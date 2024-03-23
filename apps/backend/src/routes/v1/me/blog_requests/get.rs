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

#[derive(Debug, Serialize, Deserialize)]
struct Blog {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    name: String,
    slug: String,
    domain: Option<String>,
    logo_id: Option<Uuid>,
    logo_hex: Option<String>,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct BlogRequest {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    #[serde(with = "crate::iso8601::time")]
    created_at: OffsetDateTime,
    role: String,
    // Joins
    blog: Json<Blog>,
}

#[get("/v1/me/blog-requests")]
#[tracing::instrument(
    name = "GET /v1/me/blog-requests",
    skip_all,
    fields(
        user_id = user.id().ok(),
        page = query.page,
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
    let search_query = query.query.clone().unwrap_or_default();
    let has_search_query = !search_query.trim().is_empty();

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
(
    SELECT
        be.id,
        be.created_at,
        'editor' AS "role",
        -- Blog
        JSON_BUILD_OBJECT(
            'id', "be->blog".id,
            'name', "be->blog".name,
            'slug', "be->blog".slug,
            'domain', "be->blog".domain,
            'logo_id', "be->blog".logo_id,
            'logo_hex', "be->blog".logo_hex
        ) AS "blog"
"#,
    );

    if has_search_query {
        query_builder.push(",");
        query_builder.push(
            r#"
-- Query score
TS_RANK_CD("be->blog".search_vec, (SELECT tsq FROM search_query)) AS "query_score"
"#,
        );
    }

    query_builder.push(
        r#"
FROM
    blog_editors AS be
        INNER JOIN blogs AS "be->blog"
            ON be.blog_id = "be->blog".id
            AND "be->blog".deleted_at IS NULL
WHERE
    be.user_id = $1
    AND be.accepted_at IS NULL
    AND be.deleted_at IS NULL
"#,
    );

    if has_search_query {
        query_builder.push(r#" AND "be->blog".search_vec @@ (SELECT tsq FROM search_query) "#);
    }

    query_builder.push(
        r#"
--
UNION ALL
--
SELECT
    bw.id,
    bw.created_at,
    'writer' AS "role",
    -- Blog
    JSON_BUILD_OBJECT(
        'id', "bw->blog".id,
        'name', "bw->blog".name,
        'slug', "bw->blog".slug,
        'domain', "bw->blog".domain,
        'logo_id', "bw->blog".logo_id,
        'logo_hex', "bw->blog".logo_hex
    ) AS "blog"
"#,
    );

    if has_search_query {
        query_builder.push(",");
        query_builder.push(
            r#"
-- Query score
TS_RANK_CD("bw->blog".search_vec, (SELECT tsq FROM search_query)) AS "query_score"
"#,
        );
    }

    query_builder.push(
        r#"
FROM
    blog_writers AS bw
        INNER JOIN blogs AS "bw->blog"
            ON bw.blog_id = "bw->blog".id
            AND "bw->blog".deleted_at IS NULL
WHERE
    bw.receiver_id = $1
    AND bw.accepted_at IS NULL
    AND bw.deleted_at IS NULL
"#,
    );

    if has_search_query {
        query_builder.push(r#" AND "bw->blog".search_vec @@ (SELECT tsq FROM search_query) "#);
    }

    query_builder.push(
        r#"
)
ORDER BY
"#,
    );

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
    role,
    created_at,
    blog
FROM requests
"#,
    );

    let mut db_query = query_builder
        .build_query_as::<BlogRequest>()
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
    use sqlx::PgPool;
    use urlencoding::encode;

    #[sqlx::test(fixtures("blog_request"))]
    async fn can_return_blog_requests(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Receive some requests.
        let result = sqlx::query(
            r#"
WITH writers AS (
    INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
    VALUES ($1, $2, $3), ($1, $2, $4)
)
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($2, $5), ($2, $6)
"#,
        )
        .bind(1_i64)
        .bind(user_id.unwrap())
        .bind(2_i64)
        .bind(3_i64)
        .bind(4_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/blog-requests")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<BlogRequest>>(&res_to_string(res).await);

        assert!(json.is_ok());

        let json = json.unwrap();

        assert_eq!(json.len(), 4);
        assert_eq!(
            json.iter()
                .filter(|item| item.role == "editor")
                .collect::<Vec<_>>()
                .len(),
            2
        );
        assert_eq!(
            json.iter()
                .filter(|item| item.role == "writer")
                .collect::<Vec<_>>()
                .len(),
            2
        );

        Ok(())
    }

    #[sqlx::test(fixtures("blog_request"))]
    async fn can_search_blog_requests(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Receive some requests.
        let result = sqlx::query(
            r#"
WITH writers AS (
    INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
    VALUES ($1, $2, $3), ($1, $2, $4)
)
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($2, $5), ($2, $6)
"#,
        )
        .bind(1_i64)
        .bind(user_id.unwrap())
        .bind(2_i64)
        .bind(3_i64)
        .bind(4_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blog-requests?query={}", encode("red")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<BlogRequest>>(&res_to_string(res).await).unwrap();

        assert!(json[0].blog.name.contains("RED"));
        assert_eq!(json.len(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("blog_request"))]
    async fn should_not_include_soft_deleted_requests_in_blog_requests(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Receive some requests.
        let result = sqlx::query(
            r#"
WITH writers AS (
    INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
    VALUES ($1, $2, $3), ($1, $2, $4)
)
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($2, $5), ($2, $6)
"#,
        )
        .bind(1_i64)
        .bind(user_id.unwrap())
        .bind(2_i64)
        .bind(3_i64)
        .bind(4_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 2);

        // Should return all the blog requests initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/blog-requests")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<BlogRequest>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 4);

        // Soft-delete two of the blog requests.
        let result = sqlx::query(
            r#"
WITH updated_writers AS (
    UPDATE blog_writers
    SET deleted_at = NOW()
    WHERE blog_id = $1
)
UPDATE blog_editors
SET deleted_at = NOW()
WHERE blog_id = $2
"#,
        )
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only two blog requests.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/blog-requests")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<BlogRequest>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Recover the blog requests.
        let result = sqlx::query(
            r#"
WITH updated_writers AS (
    UPDATE blog_writers
    SET deleted_at = NULL
)
UPDATE blog_editors
SET deleted_at = NULL
"#,
        )
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 2);

        // Should return all the blog requests again.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/blog-requests")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<BlogRequest>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 4);

        Ok(())
    }

    #[sqlx::test(fixtures("blog_request"))]
    async fn should_not_include_accepted_requests_in_blog_requests(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Receive some requests.
        let result = sqlx::query(
            r#"
WITH writers AS (
    INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
    VALUES ($1, $2, $3), ($1, $2, $4)
)
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($2, $5), ($2, $6)
"#,
        )
        .bind(1_i64)
        .bind(user_id.unwrap())
        .bind(2_i64)
        .bind(3_i64)
        .bind(4_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 2);

        // Should return all the blog requests initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/blog-requests")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<BlogRequest>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 4);

        // Accept two of the blog requests.
        let result = sqlx::query(
            r#"
WITH updated_writers AS (
    UPDATE blog_writers
    SET accepted_at = NOW()
    WHERE blog_id = $1
)
UPDATE blog_editors
SET accepted_at = NOW()
WHERE blog_id = $2
"#,
        )
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only two blog requests.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/blog-requests")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<BlogRequest>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }
}
