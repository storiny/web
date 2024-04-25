use crate::{
    error::{
        AppError,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_http::StatusCode;
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
    blog_id: String,
}

#[post("/v1/me/leave-blog/{blog_id}")]
#[tracing::instrument(
    name = "POST /v1/me/leave-blog/{blog_id}",
    skip_all,
    fields(
        user_id = user.id().ok(),
        blog_id = %path.blog_id
    ),
    err
)]
async fn post(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let blog_id = path
        .blog_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid blog ID"))?;

    let result = sqlx::query(
        r#"
WITH removed_writer AS (
    DELETE FROM blog_writers
    WHERE
        blog_id = $2
        AND receiver_id = $1
        AND accepted_at IS NOT NULL
    RETURNING true AS "found"
), removed_editor AS (
    DELETE FROM blog_editors
    WHERE
        blog_id = $2
        AND user_id = $1
        AND accepted_at IS NOT NULL
        AND NOT EXISTS (
            SELECT FROM removed_writer
        )
    RETURNING true AS "found"
)
SELECT COALESCE(
    (SELECT TRUE FROM removed_writer),
    (SELECT TRUE FROM removed_editor)
) AS "found"
"#,
    )
    .bind(user_id)
    .bind(blog_id)
    .fetch_one(&data.db_pool)
    .await?;

    if result.get::<Option<bool>, _>("found").unwrap_or_default() {
        Ok(HttpResponse::NoContent().finish())
    } else {
        Err(ToastErrorResponse::new(
            Some(StatusCode::FORBIDDEN),
            "You are not a member of this blog",
        )
        .into())
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

    #[sqlx::test(fixtures("leave_blog"))]
    async fn can_leave_a_blog_as_writer(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Join the blog as writer.
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES ($1, $2, $3)
"#,
        )
        .bind(1_i64)
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/leave-blog/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should still return an error response as the writer invite has not been accepted yet.
        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "You are not a member of this blog").await;

        // Accept the writer invite.
        let result = sqlx::query(
            r#"
UPDATE blog_writers
SET accepted_at = NOW()
WHERE receiver_id = $1
        "#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/leave-blog/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Relation should not be present in the database.
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

    #[sqlx::test(fixtures("leave_blog"))]
    async fn can_leave_a_blog_as_editor(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Join the blog as editor.
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/leave-blog/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should still return an error response as the editor invite has not been accepted yet.
        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "You are not a member of this blog").await;

        // Accept the editor invite.
        let result = sqlx::query(
            r#"
UPDATE blog_editors
SET accepted_at = NOW()
WHERE user_id = $1
        "#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/leave-blog/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Relation should not be present in the database.
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

    #[sqlx::test]
    async fn can_return_an_error_response_when_trying_to_leave_an_unknown_blog(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/leave-blog/{}", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "You are not a member of this blog").await;

        Ok(())
    }
}
