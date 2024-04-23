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
    FromRow,
    Row,
};
use time::OffsetDateTime;
use validator::Validate;

#[derive(Serialize, Deserialize, Validate)]
struct QueryParams {
    #[validate(range(min = 1, max = 1000))]
    page: Option<u16>,
}

#[derive(Deserialize, Validate)]
struct Fragments {
    blog_id: String,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct Subscriber {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    // Timestamps
    #[serde(with = "crate::iso8601::time")]
    created_at: OffsetDateTime,
    // Fields
    email: String,
}

#[get("/v1/me/blogs/{blog_id}/subscribers")]
#[tracing::instrument(
    name = "GET /v1/me/blogs/{blog_id}/subscribers",
    skip_all,
    fields(
        user_id = user.id().ok(),
        blog_id = %path.blog_id,
        page = query.page
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

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    let result = sqlx::query(
        r#"
SELECT EXISTS (
    SELECT FROM blogs
    WHERE
        id = $1
        AND user_id = $2
        AND deleted_at IS NULL
)
"#,
    )
    .bind(blog_id)
    .bind(user_id)
    .fetch_one(&mut *txn)
    .await?;

    if !result.get::<bool, _>("exists") {
        return Err(AppError::from("Blog does not exist"));
    }

    let subscribers = sqlx::query_as::<_, Subscriber>(
        r#"
SELECT
    id,
    email,
    created_at
FROM subscribers
WHERE
    blog_id = $1
ORDER BY
    created_at DESC
LIMIT $2 OFFSET $3
    "#,
    )
    .bind(blog_id)
    .bind(10_i16)
    .bind((page * 10) as i16)
    .fetch_all(&mut *txn)
    .await?;

    txn.commit().await?;

    Ok(HttpResponse::Ok().json(subscribers))
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

    #[sqlx::test(fixtures("subscriber"))]
    async fn can_return_subscribers_for_blog_owner(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/blogs/{}/subscribers", 3_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should reject the request initially.
        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Blog does not exist").await;

        // Change the owner of the blog.
        let result = sqlx::query(
            r#"
UPDATE blogs
SET user_id = $1
WHERE id = $2
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{}/subscribers", 3_i64))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should accept the request.
        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Subscriber>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 3);

        Ok(())
    }
}
