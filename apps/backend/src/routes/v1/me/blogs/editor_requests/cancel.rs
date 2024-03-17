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
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    blog_id: String,
    request_id: String,
}

#[post("/v1/me/blogs/{blog_id}/editor-requests/{request_id}/cancel")]
#[tracing::instrument(
    name = "POST /v1/me/blogs/{blog_id}/editor-requests/{request_id}/cancel",
    skip_all,
    fields(
        user_id = user.id().ok(),
        request_id = %path.request_id,
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

    let request_id = path
        .request_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid request ID"))?;

    match sqlx::query(
        r#"
DELETE FROM blog_editors be
USING blogs b
WHERE
    be.blog_id = $2
    AND be.id = $1
    AND be.blog_id = b.id
    AND be.accepted_at IS NULL
    AND b.user_id = $3
"#,
    )
    .bind(request_id)
    .bind(blog_id)
    .bind(user_id)
    .execute(&data.db_pool)
    .await?
    .rows_affected()
    {
        0 => Err(ToastErrorResponse::new(None, "Editor request not found").into()),
        _ => Ok(HttpResponse::NoContent().finish()),
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

    #[sqlx::test(fixtures("editor_request"))]
    async fn can_cancel_an_editor_request(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Send an editor request.
        let insert_result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Editor 1', 'editor_1', 'editor_1@example.com')
    RETURNING id
)
INSERT INTO blog_editors (user_id, blog_id)
VALUES ((SELECT id FROM inserted_user), $1)
RETURNING id
"#,
        )
        .bind(5_i64)
        .fetch_one(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/editor-requests/{}/cancel",
                5_i64,
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Editor request should not be present in the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM blog_editors
    WHERE id = $1
)
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("editor_request"))]
    async fn can_cancel_an_editor_request_as_blog_owner(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Send an editor request.
        let insert_result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Editor 1', 'editor_1', 'editor_1@example.com')
    RETURNING id
)
INSERT INTO blog_editors (user_id, blog_id)
VALUES ((SELECT id FROM inserted_user), $1)
RETURNING id
"#,
        )
        .bind(5_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Change the owner of the blog.
        let result = sqlx::query(
            r#"
UPDATE blogs
SET user_id = $1
WHERE id = $2
"#,
        )
        .bind(2_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/editor-requests/{}/cancel",
                5_i64,
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should reject the request initially.
        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Editor request not found").await;

        // Change the owner of the blog.
        let result = sqlx::query(
            r#"
UPDATE blogs
SET user_id = $1
WHERE id = $2
"#,
        )
        .bind(user_id.unwrap())
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/editor-requests/{}/cancel",
                5_i64,
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should cancel the editor request.
        assert!(res.status().is_success());

        Ok(())
    }

    #[sqlx::test(fixtures("editor_request"))]
    async fn can_cancel_a_soft_deleted_editor_request(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Send a soft-deleted editor request.
        let insert_result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Editor 1', 'editor_1', 'editor_1@example.com')
    RETURNING id
)
INSERT INTO blog_editors (user_id, blog_id, deleted_at)
VALUES ((SELECT id FROM inserted_user), $1, NOW())
RETURNING id
"#,
        )
        .bind(5_i64)
        .fetch_one(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/editor-requests/{}/cancel",
                5_i64,
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Editor request should not be present in the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM blog_editors
    WHERE id = $1
)
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("editor_request"))]
    async fn can_return_an_error_response_when_trying_to_cancel_an_accepted_editor_request(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Send an accepted editor request.
        let insert_result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Editor 1', 'editor_1', 'editor_1@example.com')
    RETURNING id
)
INSERT INTO blog_editors (user_id, blog_id, accepted_at)
VALUES ((SELECT id FROM inserted_user), $1, NOW())
RETURNING id
"#,
        )
        .bind(5_i64)
        .fetch_one(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/editor-requests/{}/cancel",
                5_i64,
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Editor request not found").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_an_error_response_when_trying_to_cancel_an_unknown_editor_request(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/editor-requests/{}/cancel",
                5_i64, 12345
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Editor request not found").await;

        Ok(())
    }
}
