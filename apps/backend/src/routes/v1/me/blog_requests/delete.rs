use crate::{
    error::{
        AppError,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_web::{
    delete,
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

#[delete("/v1/me/blog-requests/{id}")]
#[tracing::instrument(
    name = "DELETE /v1/me/blog-requests/{id}",
    skip_all,
    fields(
        user_id = user.id().ok(),
        id = %path.id
    ),
    err
)]
async fn delete(
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
WITH rejected_writer AS (
    DELETE FROM blog_writers
    WHERE
        id = $1
        AND receiver_id = $2
        AND accepted_at IS NULL
    RETURNING TRUE AS "found"
), rejected_editor AS (
    DELETE FROM blog_editors
    WHERE
        id = $1
        AND user_id = $2
        AND accepted_at IS NULL
        AND NOT EXISTS (
            SELECT FROM rejected_writer
        )
    RETURNING TRUE AS "found"
)
SELECT COALESCE(
    (SELECT TRUE FROM rejected_writer),
    (SELECT TRUE FROM rejected_editor)
)::BOOLEAN AS "found"
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
    cfg.service(delete);
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

    // Editor

    #[sqlx::test(fixtures("blog_request"))]
    async fn can_reject_an_editor_blog_request(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

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

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blog-requests/{}",
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Blog request should not be present in the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM blog_editors
    WHERE user_id = $1
)
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("blog_request"))]
    async fn can_return_an_error_response_when_trying_to_reject_an_accepted_editor_blog_request(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

        // Receive an accepted editor blog request.
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id, accepted_at)
VALUES ($1, $2, NOW())
RETURNING id
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
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
    async fn can_reject_a_writer_blog_request(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

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

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blog-requests/{}",
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Blog request should not be present in the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM blog_writers
    WHERE receiver_id = $1
)
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("blog_request"))]
    async fn can_return_an_error_response_when_trying_to_reject_an_accepted_writer_blog_request(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

        // Receive an accepted writer blog request.
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_writers (transmitter_id, receiver_id, accepted_at, blog_id)
VALUES ($1, $2, NOW(), $3)
RETURNING id
"#,
        )
        .bind(1_i64)
        .bind(user_id.unwrap())
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
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
    async fn can_return_an_error_response_when_trying_to_reject_an_unknown_blog_request(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(delete, pool, true, false, None).await;

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blog-requests/{}", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Blog request not found").await;

        Ok(())
    }
}
