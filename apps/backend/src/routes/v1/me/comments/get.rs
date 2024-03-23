use crate::{
    error::AppError,
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_web::{
    get,
    web,
    HttpResponse,
};
use actix_web_validator::QsQuery;
use lazy_static::lazy_static;
use regex::Regex;
use serde::{
    Deserialize,
    Serialize,
};

use sqlx::{
    types::Json,
    FromRow,
    Postgres,
    QueryBuilder,
};
use time::OffsetDateTime;
use uuid::Uuid;
use validator::Validate;

lazy_static! {
    static ref SORT_REGEX: Regex = {
        #[allow(clippy::unwrap_used)]
        Regex::new(r"^(recent|old|(least|most)-(liked|replied))$").unwrap()
    };
}

#[derive(Serialize, Deserialize, Validate)]
struct QueryParams {
    #[validate(range(min = 1, max = 1000))]
    page: Option<u16>,
    #[validate(regex = "SORT_REGEX")]
    sort: Option<String>,
    #[validate(length(min = 0, max = 160, message = "Invalid query length"))]
    query: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct User {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    username: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct Story {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    slug: String,
    title: String,
    splash_id: Option<Uuid>,
    splash_hex: Option<String>,
    #[serde(with = "crate::snowflake_id")]
    user_id: i64,
    // Joins
    user: Json<User>,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct Comment {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    hidden: bool,
    content: Option<String>,
    rendered_content: String,
    #[serde(with = "crate::snowflake_id")]
    user_id: i64,
    #[serde(with = "crate::snowflake_id")]
    story_id: i64,
    // Stats
    like_count: i32,
    reply_count: i32,
    // Timestamps
    #[serde(with = "crate::iso8601::time")]
    created_at: OffsetDateTime,
    #[serde(with = "crate::iso8601::time::option")]
    edited_at: Option<OffsetDateTime>,
    // Joins
    story: Json<Story>,
    // Boolean flags
    is_liked: bool,
}

#[get("/v1/me/comments")]
#[tracing::instrument(
    name = "GET /v1/me/comments",
    skip_all,
    fields(
        user_id = user.id().ok(),
        page = query.page,
        sort = query.sort,
        query = query.query
    ),
    err
)]
async fn get(
    query: QsQuery<QueryParams>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;

    let page = query.page.unwrap_or(1) - 1;
    let sort = query.sort.clone().unwrap_or("recent".to_string());
    let search_query = query.query.clone().unwrap_or_default();
    let has_search_query = !search_query.trim().is_empty();

    let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
        r#"
WITH comments_result AS (
"#,
    );

    if has_search_query {
        query_builder.push(
            r#"
WITH search_query AS (
    SELECT PLAINTO_TSQUERY('english', $4) AS tsq
)
"#,
        );
    }

    query_builder.push(
        r#"
SELECT
    -- Comment
    c.id,
    c.user_id,
    c.story_id,
    c.hidden,
    c.rendered_content,
    CASE WHEN c.user_id = $1 THEN c.content END AS "content",
    c.like_count,
    c.reply_count,
    c.created_at,
    c.edited_at,
    -- Story
    JSON_BUILD_OBJECT(
        'id', cs.id,
        'slug', cs.slug,
        'title', cs.title,
        'user_id', cs.user_id,
        'splash_id', cs.splash_id,
        'splash_hex', cs.splash_hex,
        'user', JSON_BUILD_OBJECT(
            'id', "cs->user".id,
            'username', "cs->user".username
        )
    ) AS "story",
    -- Boolean flags
    "c->is_liked".comment_id IS NOT NULL AS "is_liked"
"#,
    );

    if has_search_query {
        query_builder.push(",");
        query_builder.push(
            r#"
-- Query score
TS_RANK_CD(c.search_vec, (SELECT tsq FROM search_query)) AS "query_score"
"#,
        );
    }

    query_builder.push(
        r#"
FROM
    comments c
        -- Join story
        INNER JOIN stories AS cs
            ON cs.id = c.story_id
        -- Join story user
        INNER JOIN users AS "cs->user"
            ON "cs->user".id = cs.user_id
        -- Boolean like flag
        LEFT OUTER JOIN comment_likes AS "c->is_liked"
            ON "c->is_liked".comment_id = c.id                           
            AND "c->is_liked".user_id = $1
            AND "c->is_liked".deleted_at IS NULL
WHERE
    c.user_id = $1
"#,
    );

    if has_search_query {
        query_builder.push(r#"AND c.search_vec @@ (SELECT tsq FROM search_query)"#);
    }

    query_builder.push(
        r#"
AND c.deleted_at IS NULL
GROUP BY
    c.id,
    cs.id,
    "c->is_liked".comment_id,
    "cs->user".id,
    c.created_at
ORDER BY
"#,
    );

    if has_search_query {
        query_builder.push("query_score DESC");
        query_builder.push(",");
    }

    query_builder.push(match sort.as_str() {
        "old" => "c.created_at",
        "least-replied" => "c.reply_count",
        "most-replied" => "c.reply_count DESC",
        "least-liked" => "c.like_count",
        "most-liked" => "c.like_count DESC",
        _ => "c.created_at DESC",
    });

    query_builder.push(
        r#"
    LIMIT $2 OFFSET $3
)
SELECT
    -- Comment
    id,
    user_id,
    story_id,
    hidden,
    content,
    rendered_content,
    like_count,
    reply_count,
    created_at,
    edited_at,
    -- Story
    story,
    -- Boolean flags
    is_liked
FROM comments_result
"#,
    );

    let mut db_query = query_builder
        .build_query_as::<Comment>()
        .bind(user_id)
        .bind(10_i16)
        .bind((page * 10) as i16);

    if has_search_query {
        db_query = db_query.bind(search_query);
    }

    let result = db_query.fetch_all(&data.db_pool).await?;

    Ok(HttpResponse::Ok().json(result))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        init_app_for_test,
        res_to_string,
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };
    use urlencoding::encode;

    #[sqlx::test(fixtures("comment"))]
    async fn can_return_comments(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some comments.
        let insert_result = sqlx::query(
            r#"
INSERT INTO comments (content, user_id, story_id)
VALUES ($1, $2, $3), ($1, $2, $3)
"#,
        )
        .bind("Sample comment")
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/comments")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Comment>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("comment"))]
    async fn can_return_is_liked_flag_for_comments(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert a comment.
        let insert_result = sqlx::query(
            r#"
INSERT INTO comments (content, user_id, story_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Sample comment")
        .bind(user_id.unwrap())
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        let comment_id = insert_result.get::<i64, _>("id");

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/comments")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<Comment>>(&res_to_string(res).await).unwrap();
        let comment = &json[0];
        assert!(!comment.is_liked);

        // Like the comment.
        let result = sqlx::query(
            r#"
INSERT INTO comment_likes (user_id, comment_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(comment_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/comments")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<Comment>>(&res_to_string(res).await).unwrap();
        let comment = &json[0];
        assert!(comment.is_liked);

        Ok(())
    }

    #[sqlx::test(fixtures("comment"))]
    async fn can_return_comments_in_asc_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some comments.
        sqlx::query(
            r#"
INSERT INTO comments (id, content, user_id, story_id)
VALUES ($1, $2, $3, $4)
"#,
        )
        .bind(4_i64)
        .bind("Sample comment")
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO comments (id, content, user_id, story_id)
VALUES ($1, $2, $3, $4)
"#,
        )
        .bind(5_i64)
        .bind("Sample comment")
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/comments?sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Comment>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 4_i64);
        assert_eq!(json[1].id, 5_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("comment"))]
    async fn can_return_comments_in_desc_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some comments.
        sqlx::query(
            r#"
INSERT INTO comments (id, content, user_id, story_id)
VALUES ($1, $2, $3, $4)
"#,
        )
        .bind(4_i64)
        .bind("Sample comment")
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO comments (id, content, user_id, story_id)
VALUES ($1, $2, $3, $4)
"#,
        )
        .bind(5_i64)
        .bind("Sample comment")
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/comments?sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Comment>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 5_i64);
        assert_eq!(json[1].id, 4_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("comment"))]
    async fn can_return_comments_in_most_replied_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some comments.
        sqlx::query(
            r#"
INSERT INTO comments (id, content, user_id, story_id, reply_count)
VALUES ($1, $2, $3, $4, $5)
"#,
        )
        .bind(4_i64)
        .bind("Sample comment")
        .bind(user_id.unwrap())
        .bind(3_i64)
        .bind(1_i32)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO comments (id, content, user_id, story_id)
VALUES ($1, $2, $3, $4)
"#,
        )
        .bind(5_i64)
        .bind("Sample comment")
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/comments?sort=most-replied")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Comment>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 4_i64);
        assert_eq!(json[1].id, 5_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("comment"))]
    async fn can_return_comments_in_least_replied_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some comments.
        sqlx::query(
            r#"
INSERT INTO comments (id, content, user_id, story_id)
VALUES ($1, $2, $3, $4)
"#,
        )
        .bind(4_i64)
        .bind("Sample comment")
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO comments (id, content, user_id, story_id, reply_count)
VALUES ($1, $2, $3, $4, $5)
"#,
        )
        .bind(5_i64)
        .bind("Sample comment")
        .bind(user_id.unwrap())
        .bind(3_i64)
        .bind(1_i32)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/comments?sort=least-replied")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Comment>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 4_i64);
        assert_eq!(json[1].id, 5_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("comment"))]
    async fn can_return_comments_in_most_liked_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some comments.
        sqlx::query(
            r#"
INSERT INTO comments (id, content, user_id, story_id, like_count)
VALUES ($1, $2, $3, $4, $5)
"#,
        )
        .bind(4_i64)
        .bind("Sample comment")
        .bind(user_id.unwrap())
        .bind(3_i64)
        .bind(1_i32)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO comments (id, content, user_id, story_id)
VALUES ($1, $2, $3, $4)
"#,
        )
        .bind(5_i64)
        .bind("Sample comment")
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/comments?sort=most-liked")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Comment>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 4_i64);
        assert_eq!(json[1].id, 5_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("comment"))]
    async fn can_return_comments_in_least_liked_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some comments.
        sqlx::query(
            r#"
INSERT INTO comments (id, content, user_id, story_id)
VALUES ($1, $2, $3, $4)
"#,
        )
        .bind(4_i64)
        .bind("Sample comment")
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO comments (id, content, user_id, story_id, like_count)
VALUES ($1, $2, $3, $4, $5)
"#,
        )
        .bind(5_i64)
        .bind("Sample comment")
        .bind(user_id.unwrap())
        .bind(3_i64)
        .bind(1_i32)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/comments?sort=least-liked")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Comment>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 4_i64);
        assert_eq!(json[1].id, 5_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("comment"))]
    async fn can_search_comments(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some comments.
        let insert_result = sqlx::query(
            r#"
INSERT INTO comments (content, user_id, story_id)
VALUES ($1, $3, $4), ($2, $3, $4)
"#,
        )
        .bind("one")
        .bind("two")
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/comments?query={}", encode("two")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Comment>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert_eq!(json[0].content, Some("two".to_string()));

        Ok(())
    }

    #[sqlx::test(fixtures("comment"))]
    async fn should_not_include_soft_deleted_comments(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some comments.
        let insert_result = sqlx::query(
            r#"
INSERT INTO comments (id, content, user_id, story_id)
VALUES (4, $1, $2, $3), (5, $1, $2, $3)
"#,
        )
        .bind("Sample comment")
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the comments initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/comments")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Comment>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Soft-delete one of the comments.
        let result = sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one comment.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/comments")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Comment>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Recover the comment.
        let result = sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the comments again.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/comments")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Comment>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }
}
