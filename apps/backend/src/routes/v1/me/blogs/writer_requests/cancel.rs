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

#[post("/v1/me/blogs/{blog_id}/writer-requests/{request_id}/cancel")]
#[tracing::instrument(
    name = "POST /v1/me/blogs/{blog_id}/writer-requests/{request_id}/cancel",
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
WITH blog_as_owner AS (
    SELECT 1 FROM blogs
    WHERE
        id = $2
        AND user_id = $3
        AND deleted_at IS NULL
), blog_as_editor AS (
    SELECT 1 FROM blog_editors
    WHERE
        blog_id = $2
        AND user_id = $3
        AND accepted_at IS NOT NULL
        AND deleted_at IS NULL
        AND NOT EXISTS (
            SELECT FROM blog_as_owner
        )
)
DELETE FROM blog_writers bw
USING blogs b
WHERE
    bw.blog_id = $2
    AND bw.id = $1
    AND bw.blog_id = b.id
    AND bw.accepted_at IS NULL
    AND (
        SELECT COALESCE(
            (SELECT TRUE FROM blog_as_owner),
            (SELECT TRUE FROM blog_as_editor)
        ) IS TRUE
    )
"#,
    )
    .bind(request_id)
    .bind(blog_id)
    .bind(user_id)
    .execute(&data.db_pool)
    .await?
    .rows_affected()
    {
        0 => Err(ToastErrorResponse::new(None, "Writer request not found").into()),
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

    #[sqlx::test(fixtures("writer_request"))]
    async fn can_cancel_a_writer_request(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Send a writer request.
        let insert_result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Writer 1', 'writer_1', 'writer_1@example.com')
    RETURNING id
)
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES ($1, (SELECT id FROM inserted_user), $2)
RETURNING id
"#,
        )
        .bind(user_id.unwrap())
        .bind(6_i64)
        .fetch_one(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/writer-requests/{}/cancel",
                6_i64,
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Writer request should not be present in the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM blog_writers
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

    #[sqlx::test(fixtures("writer_request"))]
    async fn can_cancel_a_writer_request_as_blog_owner(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Send a writer request.
        let insert_result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Writer 1', 'writer_1', 'writer_1@example.com')
    RETURNING id
)
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES ($1, (SELECT id FROM inserted_user), $2)
RETURNING id
"#,
        )
        .bind(user_id.unwrap())
        .bind(6_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Remove all the blog editors.
        sqlx::query(r#" DELETE FROM blog_editors "#)
            .execute(&mut *conn)
            .await?;

        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/writer-requests/{}/cancel",
                6_i64,
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should reject the request initially.
        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Writer request not found").await;

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

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/writer-requests/{}/cancel",
                6_i64,
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should cancel the writer request.
        assert!(res.status().is_success());

        Ok(())
    }

    #[sqlx::test(fixtures("writer_request"))]
    async fn can_cancel_a_writer_request_as_blog_editor(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Send a writer request.
        let insert_result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Writer 1', 'writer_1', 'writer_1@example.com')
    RETURNING id
)
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES ($1, (SELECT id FROM inserted_user), $2)
RETURNING id
"#,
        )
        .bind(user_id.unwrap())
        .bind(6_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Remove all the blog editors.
        sqlx::query(r#" DELETE FROM blog_editors "#)
            .execute(&mut *conn)
            .await?;

        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/writer-requests/{}/cancel",
                6_i64,
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should reject the request initially.
        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Writer request not found").await;

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

        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/writer-requests/{}/cancel",
                6_i64,
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should still return an error response as the editor invite has not been accepted yet.
        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Writer request not found").await;

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

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/writer-requests/{}/cancel",
                6_i64,
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should accept the writer request.
        assert!(res.status().is_success());

        Ok(())
    }

    #[sqlx::test(fixtures("writer_request"))]
    async fn can_cancel_a_soft_deleted_writer_request(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Send a soft-deleted writer request.
        let insert_result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Writer 1', 'writer_1', 'writer_1@example.com')
    RETURNING id
)
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id, deleted_at)
VALUES ($1, (SELECT id FROM inserted_user), $2, NOW())
RETURNING id
"#,
        )
        .bind(2_i64)
        .bind(6_i64)
        .fetch_one(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/writer-requests/{}/cancel",
                6_i64,
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Writer request should not be present in the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM blog_writers
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

    #[sqlx::test(fixtures("writer_request"))]
    async fn can_return_an_error_response_when_trying_to_cancel_an_accepted_writer_request(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Send an accepted writer request.
        let insert_result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Writer 1', 'writer_1', 'writer_1@example.com')
    RETURNING id
)
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id, accepted_at)
VALUES ($1, (SELECT id FROM inserted_user), $2, NOW())
RETURNING id
"#,
        )
        .bind(2_i64)
        .bind(6_i64)
        .fetch_one(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/writer-requests/{}/cancel",
                6_i64,
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Writer request not found").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_an_error_response_when_trying_to_cancel_an_unknown_writer_request(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/writer-requests/{}/cancel",
                6_i64, 12345
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Writer request not found").await;

        Ok(())
    }
}
