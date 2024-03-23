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
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::{
    types::Json,
    FromRow,
    Postgres,
    QueryBuilder,
    Row,
};
use time::OffsetDateTime;
use uuid::Uuid;
use validator::Validate;

#[derive(Serialize, Deserialize, Validate)]
struct QueryParams {
    #[validate(range(min = 1, max = 1000))]
    page: Option<u16>,
    #[validate(length(min = 0, max = 160, message = "Invalid query length"))]
    query: Option<String>,
}

#[derive(Deserialize, Validate)]
struct Fragments {
    blog_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct User {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    name: String,
    username: String,
    avatar_id: Option<Uuid>,
    avatar_hex: Option<String>,
    public_flags: i32,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct WriterRequest {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    // Timestamps
    #[serde(with = "crate::iso8601::time")]
    created_at: OffsetDateTime,
    // Joins
    user: Json<User>,
}

#[get("/v1/me/blogs/{blog_id}/writer-requests")]
#[tracing::instrument(
    name = "GET /v1/me/blogs/{blog_id}/writer-requests",
    skip_all,
    fields(
        user_id = user.id().ok(),
        blog_id = %path.blog_id,
        page = query.page,
        query = query.query
    ),
    err
)]
async fn get(
    path: web::Path<Fragments>,
    query: QsQuery<QueryParams>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let blog_id = path
        .blog_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid blog ID"))?;

    let page = query.page.unwrap_or(1) - 1;
    let search_query = query.query.clone().unwrap_or_default();
    let has_search_query = !search_query.trim().is_empty();

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    let result = sqlx::query(
        r#"
WITH blog_as_owner AS (
    SELECT 1 FROM blogs
    WHERE
        id = $1
        AND user_id = $2
        AND deleted_at IS NULL
), blog_as_editor AS (
    SELECT 1 FROM blog_editors
    WHERE
        blog_id = $1
        AND user_id = $2
        AND accepted_at IS NOT NULL
        AND deleted_at IS NULL
        AND NOT EXISTS (
            SELECT FROM blog_as_owner
        )
)
SELECT COALESCE(
    (SELECT TRUE FROM blog_as_owner),
    (SELECT TRUE FROM blog_as_editor)
) AS "found"
"#,
    )
    .bind(blog_id)
    .bind(user_id)
    .fetch_one(&mut *txn)
    .await?;

    if !result.get::<Option<bool>, _>("found").unwrap_or_default() {
        return Err(AppError::from(
            "Missing permission or the blog does not exist",
        ));
    }

    let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new("");

    query_builder.push(if has_search_query {
        r#"
WITH search_query AS (
    SELECT PLAINTO_TSQUERY('english', $4) AS tsq
), requests AS (
"#
    } else {
        r#" WITH requests AS ( "#
    });

    query_builder.push(
        r#"
SELECT
    bw.id,
    bw.created_at,
    -- User
    JSON_BUILD_OBJECT(
        'id', "bw->user".id,
        'name', "bw->user".name,
        'username', "bw->user".username,
        'avatar_id', "bw->user".avatar_id,
        'avatar_hex', "bw->user".avatar_hex,
        'public_flags', "bw->user".public_flags
    ) AS "_user" -- Underscore is intentional
"#,
    );

    if has_search_query {
        query_builder.push(",");
        query_builder.push(
            r#"
-- Query score
TS_RANK_CD("bw->user".search_vec, (SELECT tsq FROM search_query)) AS "query_score"
"#,
        );
    }

    query_builder.push(
        r#"
FROM
    blog_writers AS bw
        INNER JOIN users AS "bw->user"
            ON bw.receiver_id = "bw->user".id
WHERE
    bw.blog_id = $1
    AND bw.accepted_at IS NULL
    AND bw.deleted_at IS NULL
"#,
    );

    if has_search_query {
        query_builder.push(r#" AND "bw->user".search_vec @@ (SELECT tsq FROM search_query) "#);
    }

    query_builder.push(r#" ORDER BY "#);

    if has_search_query {
        query_builder.push("query_score DESC");
        query_builder.push(",");
    }

    query_builder.push(
        r#"
        created_at DESC
    LIMIT $2 OFFSET $3
)
SELECT
    id,
    created_at,
    -- This underscore prevents selecting the actual `user` from Postgres
    _user as "user"
FROM requests
"#,
    );

    let mut db_query = query_builder
        .build_query_as::<WriterRequest>()
        .bind(blog_id)
        .bind(10_i16)
        .bind((page * 10) as i16);

    if has_search_query {
        db_query = db_query.bind(search_query);
    }

    let result = db_query.fetch_all(&mut *txn).await?;

    txn.commit().await?;

    Ok(HttpResponse::Ok().json(result))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_response_body_text,
        init_app_for_test,
        res_to_string,
    };
    use actix_web::test;
    use sqlx::PgPool;
    use urlencoding::encode;

    #[sqlx::test(fixtures("writer_request"))]
    async fn can_return_writer_requests(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{}/writer-requests", 6_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<WriterRequest>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("writer_request"))]
    async fn can_return_writer_requests_for_blog_owner(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        // Remove all the blog editors.
        sqlx::query(r#" DELETE FROM blog_editors "#)
            .execute(&mut *conn)
            .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/blogs/{}/writer-requests", 6_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should reject the request initially.
        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Missing permission or the blog does not exist").await;

        // Change the owner of the blog.
        let result = sqlx::query(
            r#"
UPDATE blogs
SET user_id = $1
WHERE id = $2
"#,
        )
        .bind(user_id.unwrap())
        .bind(6_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{}/writer-requests", 6_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should accept the request.
        assert!(res.status().is_success());

        Ok(())
    }

    #[sqlx::test(fixtures("writer_request"))]
    async fn can_return_writer_requests_for_blog_editor(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        // Remove all the blog editors.
        sqlx::query(r#" DELETE FROM blog_editors "#)
            .execute(&mut *conn)
            .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/blogs/{}/writer-requests", 6_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should reject the request initially.
        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Missing permission or the blog does not exist").await;

        // Add the user as editor.
        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(6_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/blogs/{}/writer-requests", 6_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should still return an error response as the editor invite has not been accepted yet.
        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Missing permission or the blog does not exist").await;

        // Accept the editor invite.
        let result = sqlx::query(
            r#"
UPDATE blog_editors
SET accepted_at = NOW()
WHERE blog_id = $1
"#,
        )
        .bind(6_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{}/writer-requests", 6_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should accept the request.
        assert!(res.status().is_success());

        Ok(())
    }

    #[sqlx::test(fixtures("writer_request"))]
    async fn can_search_writer_requests(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/writer-requests?query={}",
                6_i64,
                encode("three")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<WriterRequest>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert_eq!(json[0].user.username, "three".to_string());

        Ok(())
    }

    #[sqlx::test(fixtures("writer_request"))]
    async fn should_not_include_deleted_requests_in_writer_requests(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        // Should return all the requests initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/blogs/{}/writer-requests", 6_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<WriterRequest>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 2);

        // Soft-delete one of the requests.
        let result = sqlx::query(
            r#"
UPDATE blog_writers
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(8_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should not include the soft-deleted request.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/blogs/{}/writer-requests", 6_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<WriterRequest>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert!(!json.iter().any(|item| item.id == 8_i64));

        // Recover the request.
        let result = sqlx::query(
            r#"
UPDATE blog_writers
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(8_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the requests again.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{}/writer-requests", 6_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<WriterRequest>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 2);

        Ok(())
    }
}
