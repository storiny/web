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
use validator::Validate;

lazy_static! {
    static ref SORT_REGEX: Regex = {
        #[allow(clippy::unwrap_used)]
        Regex::new(r"^(recent|old|(least|most)-liked)$").unwrap()
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
    #[serde(with = "crate::snowflake_id")]
    user_id: i64,
    // Joins
    user: Json<User>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Comment {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    content: String,
    #[serde(with = "crate::snowflake_id")]
    story_id: i64,
    // Joins
    user: Json<User>,
    story: Json<Story>,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct Reply {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    hidden: bool,
    content: Option<String>,
    rendered_content: String,
    #[serde(with = "crate::snowflake_id")]
    user_id: i64,
    #[serde(with = "crate::snowflake_id")]
    comment_id: i64,
    // Stats
    like_count: i32,
    // Timestamps
    #[serde(with = "crate::iso8601::time")]
    created_at: OffsetDateTime,
    #[serde(with = "crate::iso8601::time::option")]
    edited_at: Option<OffsetDateTime>,
    // Joins
    comment: Json<Comment>,
    // Boolean flags
    is_liked: bool,
}

#[get("/v1/me/replies")]
#[tracing::instrument(
    name = "GET /v1/me/replies",
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
WITH replies_result AS (
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
    -- Reply
    r.id,
    r.user_id,
    r.comment_id,
    r.hidden,
    r.rendered_content,
    CASE WHEN r.user_id = $1 THEN r.content END AS "content",
    r.like_count,
    r.created_at,
    r.edited_at,
    -- Comment
    JSON_BUILD_OBJECT(
        'id', rc.id,
        'content', rc.content,
        'story_id', rc.story_id,                  
        'user', JSON_BUILD_OBJECT(
            'id', "rc->user".id,
            'username', "rc->user".username
        ),
        'story', JSON_BUILD_OBJECT(
            'id', "rc->story".id,
            'slug', "rc->story".slug,
            'user_id', "rc->story".user_id,
            'user', JSON_BUILD_OBJECT(
                'id', "rc->story->user".id,
                'username', "rc->story->user".username
            )
        )
    ) AS "comment",
    -- Boolean flags
    "r->is_liked".reply_id IS NOT NULL AS "is_liked"
"#,
    );

    if has_search_query {
        query_builder.push(",");
        query_builder.push(
            r#"
-- Query score
TS_RANK_CD(r.search_vec, (SELECT tsq FROM search_query)) AS "query_score"
"#,
        );
    }

    query_builder.push(
        r#"
FROM
    replies r
        -- Join comment
        INNER JOIN comments AS rc
            ON rc.id = r.comment_id
        -- Join comment user
        INNER JOIN users AS "rc->user"
            ON "rc->user".id = rc.user_id
        -- Join comment story
        INNER JOIN stories AS "rc->story"
            ON "rc->story".id = rc.story_id
        -- Join comment story user
        INNER JOIN users AS "rc->story->user"
            ON "rc->story->user".id = "rc->story".user_id
        -- Boolean like flag
        LEFT OUTER JOIN reply_likes AS "r->is_liked"
            ON "r->is_liked".reply_id = r.id                           
            AND "r->is_liked".user_id = $1
            AND "r->is_liked".deleted_at IS NULL
WHERE
    r.user_id = $1
"#,
    );

    if has_search_query {
        query_builder.push(r#"AND r.search_vec @@ (SELECT tsq FROM search_query)"#);
    }

    query_builder.push(
        r#"
AND r.deleted_at IS NULL
GROUP BY
    r.id,
    rc.id,
    "r->is_liked".reply_id,
    "rc->user".id,
    "rc->story".id,
    "rc->story->user".id,
    r.created_at
ORDER BY
"#,
    );

    if has_search_query {
        query_builder.push("query_score DESC");
        query_builder.push(",");
    }

    query_builder.push(match sort.as_str() {
        "old" => "r.created_at",
        "least-liked" => "r.like_count",
        "most-liked" => "r.like_count DESC",
        _ => "r.created_at DESC",
    });

    query_builder.push(
        r#"
    LIMIT $2 OFFSET $3
)
SELECT
    -- Reply
    id,
    user_id,
    comment_id,
    hidden,
    content,
    rendered_content,
    like_count,
    created_at,
    edited_at,
    -- Comment
    comment,
    -- Boolean flags
    is_liked
FROM replies_result
"#,
    );

    let mut db_query = query_builder
        .build_query_as::<Reply>()
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

    #[sqlx::test(fixtures("reply"))]
    async fn can_return_replies(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some replies.
        let insert_result = sqlx::query(
            r#"
INSERT INTO replies (content, user_id, comment_id)
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
            .uri("/v1/me/replies")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Reply>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("reply"))]
    async fn can_return_is_liked_flag_for_replies(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert a reply.
        let insert_result = sqlx::query(
            r#"
INSERT INTO replies (content, user_id, comment_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Sample reply")
        .bind(user_id.unwrap())
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        let reply_id = insert_result.get::<i64, _>("id");

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/replies")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<Reply>>(&res_to_string(res).await).unwrap();
        let reply = &json[0];
        assert!(!reply.is_liked);

        // Like the reply.
        let result = sqlx::query(
            r#"
INSERT INTO reply_likes (user_id, reply_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(reply_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/replies")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<Reply>>(&res_to_string(res).await).unwrap();
        let reply = &json[0];
        assert!(reply.is_liked);

        Ok(())
    }

    #[sqlx::test(fixtures("reply"))]
    async fn can_return_replies_in_asc_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some replies.
        sqlx::query(
            r#"
INSERT INTO replies (id, content, user_id, comment_id)
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
INSERT INTO replies (id, content, user_id, comment_id)
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
            .uri("/v1/me/replies?sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Reply>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 4_i64);
        assert_eq!(json[1].id, 5_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("reply"))]
    async fn can_return_replies_in_desc_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some replies.
        sqlx::query(
            r#"
INSERT INTO replies (id, content, user_id, comment_id)
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
INSERT INTO replies (id, content, user_id, comment_id)
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
            .uri("/v1/me/replies?sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Reply>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 5_i64);
        assert_eq!(json[1].id, 4_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("reply"))]
    async fn can_return_replies_in_most_liked_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some replies.
        sqlx::query(
            r#"
INSERT INTO replies (id, content, user_id, comment_id, like_count)
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
INSERT INTO replies (id, content, user_id, comment_id)
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
            .uri("/v1/me/replies?sort=most-liked")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Reply>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 4_i64);
        assert_eq!(json[1].id, 5_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("reply"))]
    async fn can_return_replies_in_least_liked_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some replies.
        sqlx::query(
            r#"
INSERT INTO replies (id, content, user_id, comment_id)
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
INSERT INTO replies (id, content, user_id, comment_id, like_count)
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
            .uri("/v1/me/replies?sort=least-liked")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Reply>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 4_i64);
        assert_eq!(json[1].id, 5_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("reply"))]
    async fn can_search_replies(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some replies.
        let insert_result = sqlx::query(
            r#"
INSERT INTO replies (content, user_id, comment_id)
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
            .uri(&format!("/v1/me/replies?query={}", encode("two")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Reply>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert_eq!(json[0].content, Some("two".to_string()));

        Ok(())
    }

    #[sqlx::test(fixtures("reply"))]
    async fn should_not_include_soft_deleted_replies(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some replies.
        let insert_result = sqlx::query(
            r#"
INSERT INTO replies (id, content, user_id, comment_id)
VALUES (4, $1, $2, $3), (5, $1, $2, $3)
"#,
        )
        .bind("Sample comment")
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the replies initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/replies")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Reply>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Soft-delete one of the replies.
        let result = sqlx::query(
            r#"
UPDATE replies
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one reply.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/replies")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Reply>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Recover the reply.
        let result = sqlx::query(
            r#"
UPDATE replies
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the replies again.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/replies")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Reply>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }
}
