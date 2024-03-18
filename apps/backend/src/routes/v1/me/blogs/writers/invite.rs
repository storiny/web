use crate::{
    constants::{
        notification_entity_type::NotificationEntityType,
        resource_limit::ResourceLimit,
        sql_states::SqlState,
        username_regex::USERNAME_REGEX,
    },
    error::{
        AppError,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    utils::{
        check_resource_limit::check_resource_limit,
        incr_resource_limit::incr_resource_limit,
    },
    AppState,
};
use actix_http::StatusCode;
use actix_web::{
    post,
    web,
    HttpResponse,
};
use actix_web_validator::Json;
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::Row;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    blog_id: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(regex = "USERNAME_REGEX")]
    #[validate(length(min = 3, max = 24, message = "Invalid username length"))]
    username: String,
}

#[post("/v1/me/blogs/{blog_id}/writers")]
#[tracing::instrument(
    name = "POST /v1/me/blogs/{blog_id}/writers",
    skip_all,
    fields(
        current_user_id = user.id().ok(),
        blog_id = %path.blog_id,
        payload
    ),
    err
)]
async fn post(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    payload: Json<Request>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let current_user_id = user.id()?;

    let blog_id = path
        .blog_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid blog ID"))?;

    if !check_resource_limit(&data.redis, ResourceLimit::SendBlogWriterRequest, blog_id).await? {
        return Err(AppError::new_client_error_with_status(
            StatusCode::TOO_MANY_REQUESTS,
            "Daily limit exceeded for sending writer requests on this blog. Try again tomorrow.",
        ));
    }

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    let user_result = sqlx::query(
        r#"
SELECT id FROM users
WHERE
    username = $1
    AND deleted_at IS NULL
    AND deactivated_at IS NULL
"#,
    )
    .bind(&payload.username)
    .fetch_one(&mut *txn)
    .await
    .map_err(|error| {
        if matches!(error, sqlx::Error::RowNotFound) {
            AppError::ToastError(ToastErrorResponse::new(None, "Unknown user, try again"))
        } else {
            AppError::SqlxError(error)
        }
    })?;

    match sqlx::query(
        r#"
WITH blog_as_owner AS (
    SELECT 1 FROM blogs
    WHERE
        id = $3
        AND user_id = $1
), blog_as_editor AS (
    SELECT 1 FROM blog_editors
    WHERE
        blog_id = $3
        AND user_id = $1
        AND accepted_at IS NOT NULL
        AND deleted_at IS NULL
        AND NOT EXISTS (
            SELECT FROM blog_as_owner
        )
), sanity_check AS ( 
    SELECT COALESCE(
        (SELECT TRUE FROM blog_as_owner),
        (SELECT TRUE FROM blog_as_editor)
    ) AS "found"
), inserted_blog_writer AS (
    INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
    SELECT $1, $2, $3
    WHERE
        (SELECT found FROM sanity_check) IS TRUE
    RETURNING id
), inserted_notification AS (
    INSERT INTO notifications (entity_type, entity_id, notifier_id)
    SELECT
        $4,
        (SELECT id FROM inserted_blog_writer),
        $1
    WHERE
        (SELECT found FROM sanity_check) IS TRUE
        AND EXISTS (SELECT 1 FROM inserted_blog_writer)
    RETURNING id
)
INSERT INTO
    notification_outs (notified_id, notification_id)
SELECT
    $2,
    (SELECT id FROM inserted_notification)
WHERE
    (SELECT found FROM sanity_check) IS TRUE
    AND EXISTS (SELECT 1 FROM inserted_notification)
"#,
    )
    .bind(current_user_id)
    .bind(user_result.get::<i64, _>("id"))
    .bind(blog_id)
    .bind(NotificationEntityType::BlogWriterInvite as i16)
    .execute(&mut *txn)
    .await
    {
        Ok(result) => match result.rows_affected() {
            0 => Err(AppError::from("Unknown blog")),
            _ => {
                incr_resource_limit(&data.redis, ResourceLimit::SendBlogWriterRequest, blog_id)
                    .await?;

                txn.commit().await?;

                Ok(HttpResponse::Ok().finish())
            }
        },
        Err(error) => {
            if let Some(db_err) = error.as_database_error() {
                let error_kind = db_err.kind();

                // User is already a writer.
                if matches!(error_kind, sqlx::error::ErrorKind::UniqueViolation) {
                    return Err(AppError::ToastError(ToastErrorResponse::new(
                        Some(StatusCode::CONFLICT),
                        "User is already a writer or the request is still pending",
                    )));
                }

                // Target blog is not present in the table.
                if matches!(error_kind, sqlx::error::ErrorKind::ForeignKeyViolation) {
                    return Err(AppError::from("Blog does not exist"));
                }

                let error_code = db_err.code().unwrap_or_default();

                // Check if the blog is soft-deleted.
                if error_code == SqlState::EntityUnavailable.to_string() {
                    return Err(AppError::from("Blog unavailable"));
                }

                // Check for illegal writer.
                if error_code == SqlState::IllegalWriter.to_string() {
                    return Err(AppError::ToastError(ToastErrorResponse::new(
                        None,
                        "This user cannot be added as a writer to this blog",
                    )));
                }

                // Check if the current user is blocked by the writer.
                if error_code == SqlState::BlogOwnerOrEditorBlockedByWriter.to_string() {
                    return Err(AppError::ToastError(ToastErrorResponse::new(
                        Some(StatusCode::FORBIDDEN),
                        "You are being blocked by the user",
                    )));
                }

                // Check if the writer is accepting requests from the current user.
                if error_code == SqlState::WriterNotAcceptingBlogRequest.to_string() {
                    return Err(AppError::ToastError(ToastErrorResponse::new(
                        Some(StatusCode::FORBIDDEN),
                        "User is not accepting writer requests from you",
                    )));
                }

                // Check if the writer limit has been reached for the current blog.
                if error_code == SqlState::WriterOverflow.to_string() {
                    return Err(AppError::ToastError(ToastErrorResponse::new(
                        None,
                        "Writer limit has been reached for this blog",
                    )));
                }
            }

            Err(AppError::SqlxError(error))
        }
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        grpc::defs::privacy_settings_def::v1::IncomingBlogRequest,
        test_utils::{
            assert_response_body_text,
            assert_toast_error_response,
            exceed_resource_limit,
            get_resource_limit,
            init_app_for_test,
            RedisTestContext,
        },
    };
    use actix_http::StatusCode;
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };
    use storiny_macros::test_context;

    #[sqlx::test(fixtures("writer"))]
    async fn can_reject_a_writer_request_for_a_soft_deleted_blog(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Soft-delete the blog.
        let result = sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Try sending the writer request.
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                username: "test_user_2".to_string(),
            })
            .uri(&format!("/v1/me/blogs/{}/writers", 4))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Blog unavailable").await;

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn can_reject_a_writer_request_for_a_soft_deleted_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Soft-delete the user.
        let result = sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Try sending the writer request.
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                username: "test_user_2".to_string(),
            })
            .uri(&format!("/v1/me/blogs/{}/writers", 4))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Unknown user, try again").await;

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn can_reject_a_writer_request_for_a_deactivated_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Deactivate the user.
        let result = sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Try sending the writer request.
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                username: "test_user_2".to_string(),
            })
            .uri(&format!("/v1/me/blogs/{}/writers", 4))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Unknown user, try again").await;

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn can_reject_a_writer_request_from_an_unknown_user(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        // Try sending the writer request.
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                username: "test_user_2".to_string(),
            })
            .uri(&format!("/v1/me/blogs/{}/writers", 4))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Unknown blog").await;

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn can_reject_a_writer_request_for_a_missing_blog(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                username: "test_user_2".to_string(),
            })
            .uri(&format!("/v1/me/blogs/{}/writers", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Unknown blog").await;

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn can_reject_a_writer_request_for_a_missing_user(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                username: "random_user".to_string(),
            })
            .uri(&format!("/v1/me/blogs/{}/writers", 4))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Unknown user, try again").await;

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn should_not_allow_the_user_to_send_writer_request_to_itself(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Change the owner of the blog.
        let result = sqlx::query(
            r#"
UPDATE blogs
SET user_id = $1
WHERE id = $2
"#,
        )
        .bind(2_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Add the current user as an editor.
        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                username: "test_user_1".to_string(),
            })
            .uri(&format!("/v1/me/blogs/{}/writers", 4))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "This user cannot be added as a writer to this blog")
            .await;

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn should_not_allow_the_user_to_send_writer_request_to_the_owner_of_the_blog(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Change the owner of the blog.
        let result = sqlx::query(
            r#"
UPDATE blogs
SET user_id = $1
WHERE id = $2
"#,
        )
        .bind(2_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Add the current user as an editor.
        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                username: "test_user_2".to_string(),
            })
            .uri(&format!("/v1/me/blogs/{}/writers", 4))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "This user cannot be added as a writer to this blog")
            .await;

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn can_reject_a_writer_request_for_an_existing_editor(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Insert an editor.
        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                username: "test_user_2".to_string(),
            })
            .uri(&format!("/v1/me/blogs/{}/writers", 4))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "This user cannot be added as a writer to this blog")
            .await;

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn can_reject_a_writer_request_on_writer_overflow(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Insert some writers.
        let result = sqlx::query(
            r#"
WITH inserted_users AS (
    INSERT INTO users (id, name, username, email)
    VALUES
        (4, 'Writer 1', 'writer_1', 'writer_1@storiny.com'),
        (5, 'Writer 2', 'writer_2', 'writer_2@storiny.com'),
        (6, 'Writer 3', 'writer_3', 'writer_3@storiny.com'),
        (7, 'Writer 4', 'writer_4', 'writer_4@storiny.com'),
        (8, 'Writer 5', 'writer_5', 'writer_5@storiny.com'),
        (9, 'Writer 6', 'writer_6', 'writer_6@storiny.com'),
        (10, 'Writer 7', 'writer_7', 'writer_7@storiny.com'),
        (11, 'Writer 8', 'writer_8', 'writer_8@storiny.com'),
        (12, 'Writer 9', 'writer_9', 'writer_9@storiny.com'),
        (13, 'Writer 10', 'writer_10', 'writer_10@storiny.com')
)
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES
    ($1, 4, $2),
    ($1, 5, $2),
    ($1, 6, $2),
    ($1, 7, $2),
    ($1, 8, $2),
    ($1, 9, $2),
    ($1, 10, $2),
    ($1, 11, $2),
    ($1, 12, $2),
    ($1, 13, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 10);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                username: "test_user_2".to_string(),
            })
            .uri(&format!("/v1/me/blogs/{}/writers", 4))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Writer limit has been reached for this blog").await;

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn can_reject_a_writer_request_when_the_writer_is_private(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Make the writer private.
        sqlx::query(
            r#"
UPDATE users
SET is_private = TRUE
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                username: "test_user_2".to_string(),
            })
            .uri(&format!("/v1/me/blogs/{}/writers", 4))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "User is not accepting writer requests from you").await;

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn can_reject_a_writer_request_when_the_writer_has_blocked_the_transmitter_of_the_request(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Get blocked by the writer.
        sqlx::query(
            r#"
INSERT INTO blocks (blocker_id, blocked_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                username: "test_user_2".to_string(),
            })
            .uri(&format!("/v1/me/blogs/{}/writers", 4))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "You are being blocked by the user").await;

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn can_reject_a_writer_request_when_the_writer_is_not_accepting_writer_requests_from_the_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Set `incoming_blog_requests` to `None` for the receiver.
        sqlx::query(
            r#"
UPDATE users
SET incoming_blog_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingBlogRequest::None as i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                username: "test_user_2".to_string(),
            })
            .uri(&format!("/v1/me/blogs/{}/writers", 4))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "User is not accepting writer requests from you").await;

        Ok(())
    }

    mod serial {
        use super::*;

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("writer"))]
        async fn can_send_a_writer_request_as_blog_owner(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .set_json(Request {
                    username: "test_user_2".to_string(),
                })
                .uri(&format!("/v1/me/blogs/{}/writers", 4))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Writer request should be present in the database.
            let writer_result = sqlx::query(
                r#"
SELECT id FROM blog_writers
WHERE receiver_id = $1 AND blog_id = $2
"#,
            )
            .bind(2_i64)
            .bind(4_i64)
            .fetch_one(&mut *conn)
            .await?;

            assert!(writer_result.try_get::<i64, _>("id").is_ok());

            // Should also insert a notification.
            let result = sqlx::query(
                r#"
SELECT EXISTS (
    SELECT 1 FROM notifications
    WHERE entity_id = $1
)
"#,
            )
            .bind(writer_result.get::<i64, _>("id"))
            .fetch_one(&mut *conn)
            .await?;

            assert!(result.get::<bool, _>("exists"));

            // Should also increment the resource limit.
            let result =
                get_resource_limit(&ctx.redis_pool, ResourceLimit::SendBlogWriterRequest, 4_i64)
                    .await;

            assert_eq!(result, 1);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("writer"))]
        async fn can_send_a_writer_request_as_blog_editor(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

            // Insert an editor.
            let result = sqlx::query(
                r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
            )
            .bind(user_id.unwrap())
            .bind(4_i64)
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            let req = test::TestRequest::post()
                .cookie(cookie.clone().unwrap())
                .set_json(Request {
                    username: "test_user_2".to_string(),
                })
                .uri(&format!("/v1/me/blogs/{}/writers", 4))
                .to_request();
            let res = test::call_service(&app, req).await;

            // Should reject the request as the editor has not been accepted yet.
            assert!(res.status().is_client_error());
            assert_response_body_text(res, "Unknown blog").await;

            // Accept the editor.
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
                .set_json(Request {
                    username: "test_user_2".to_string(),
                })
                .uri(&format!("/v1/me/blogs/{}/writers", 4))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Writer request should be present in the database.
            let writer_result = sqlx::query(
                r#"
SELECT id FROM blog_writers
WHERE receiver_id = $1 AND blog_id = $2
"#,
            )
            .bind(2_i64)
            .bind(4_i64)
            .fetch_one(&mut *conn)
            .await?;

            assert!(writer_result.try_get::<i64, _>("id").is_ok());

            // Should also insert a notification.
            let result = sqlx::query(
                r#"
SELECT EXISTS (
    SELECT 1 FROM notifications
    WHERE entity_id = $1
)
"#,
            )
            .bind(writer_result.get::<i64, _>("id"))
            .fetch_one(&mut *conn)
            .await?;

            assert!(result.get::<bool, _>("exists"));

            // Should also increment the resource limit.
            let result =
                get_resource_limit(&ctx.redis_pool, ResourceLimit::SendBlogWriterRequest, 4_i64)
                    .await;

            assert_eq!(result, 1);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_a_writer_request_on_exceeding_the_resource_limit(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

            exceed_resource_limit(&ctx.redis_pool, ResourceLimit::SendBlogWriterRequest, 4_i64)
                .await;

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .set_json(Request {
                    username: "test_user_2".to_string(),
                })
                .uri(&format!("/v1/me/blogs/{}/writers", 4))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert_eq!(res.status(), StatusCode::TOO_MANY_REQUESTS);

            Ok(())
        }
    }
}
