use crate::{
    error::{
        AppError,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_web::{
    post,
    web,
    HttpResponse,
};
use serde::Deserialize;
use sqlx::Row;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    id: String,
}

#[post("/v1/me/blog-requests/{id}")]
#[tracing::instrument(
    name = "POST /v1/me/blog-requests/{id}",
    skip_all,
    fields(
        user_id = user.id().ok(),
        id = %path.id
    ),
    err
)]
async fn post(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let id = path
        .id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid ID"))?;

    let result = sqlx::query(
        r#"                    
WITH updated_writer AS (
    UPDATE blog_writers
    SET accepted_at = NOW()
    WHERE
        id = $1
        AND receiver_id = $2
        AND deleted_at IS NULL
        AND accepted_at IS NULL
    RETURNING true AS "found"
), updated_editor AS (
    UPDATE blog_editors
    SET accepted_at = NOW()
    WHERE
        id = $1
        AND user_id = $2
        AND deleted_at IS NULL
        AND accepted_at IS NULL
        AND NOT EXISTS (
            SELECT FROM updated_writer
        )
    RETURNING true AS "found"
)
SELECT COALESCE(
    (SELECT TRUE FROM updated_writer),
    (SELECT TRUE FROM updated_editor)
) AS "found"
"#,
    )
    .bind(id)
    .bind(user_id)
    .fetch_one(&data.db_pool)
    .await?;

    if result.get::<Option<bool>, _>("found").unwrap_or_default() {
        Ok(HttpResponse::NoContent().finish())
    } else {
        Err(ToastErrorResponse::new(None, "Blog request not found").into())
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_toast_error_response,
        init_app_for_test,
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };
    use time::OffsetDateTime;

    // Editor

    #[sqlx::test(fixtures("blog_request"))]
    async fn can_accept_an_editor_blog_request(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Receive an editor blog request.
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
RETURNING id
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blog-requests/{}",
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Blog request should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT accepted_at FROM blog_editors
WHERE user_id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("accepted_at")
                .is_some()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("blog_request"))]
    async fn should_not_accept_a_soft_deleted_editor_blog_request(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Receive a soft-deleted editor blog request.
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id, deleted_at)
VALUES ($1, $2, NOW())
RETURNING id
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Try accepting the editor blog request.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blog-requests/{}",
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Blog request not found").await;

        // Recover the editor blog request.
        let result = sqlx::query(
            r#"
UPDATE blog_editors
SET deleted_at = NULL
WHERE user_id = $1
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Try accepting the editor blog request again.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blog-requests/{}",
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        Ok(())
    }

    #[sqlx::test(fixtures("blog_request"))]
    async fn should_not_accept_an_already_accepted_editor_blog_request(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Receive an editor blog request.
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
RETURNING id
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Accept the editor blog request for the first time.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blog-requests/{}",
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Try accepting the editor blog request again.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blog-requests/{}",
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Blog request not found").await;

        Ok(())
    }

    // Writer

    #[sqlx::test(fixtures("blog_request"))]
    async fn can_accept_a_writer_blog_request(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Receive a writer blog request.
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind(1_i64)
        .bind(user_id.unwrap())
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blog-requests/{}",
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Blog request should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT accepted_at FROM blog_writers
WHERE receiver_id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("accepted_at")
                .is_some()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("blog_request"))]
    async fn should_not_accept_a_soft_deleted_writer_blog_request(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Receive a soft-deleted writer blog request.
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id, deleted_at)
VALUES ($1, $2, $3, NOW())
RETURNING id
"#,
        )
        .bind(1_i64)
        .bind(user_id.unwrap())
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Try accepting the writer blog request.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blog-requests/{}",
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Blog request not found").await;

        // Recover the writer blog request.
        let result = sqlx::query(
            r#"
UPDATE blog_writers
SET deleted_at = NULL
WHERE receiver_id = $1
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Try accepting the writer blog request again.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blog-requests/{}",
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        Ok(())
    }

    #[sqlx::test(fixtures("blog_request"))]
    async fn should_not_accept_an_already_accepted_writer_blog_request(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Receive a writer blog request.
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind(1_i64)
        .bind(user_id.unwrap())
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Accept the writer blog request for the first time.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blog-requests/{}",
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Try accepting the writer blog request again.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blog-requests/{}",
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Blog request not found").await;

        Ok(())
    }

    //

    #[sqlx::test]
    async fn can_handle_a_missing_blog_request(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blog-requests/{}", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Blog request not found").await;

        Ok(())
    }
}
