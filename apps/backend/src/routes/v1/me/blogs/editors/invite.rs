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

#[post("/v1/me/blogs/{blog_id}/editors")]
#[tracing::instrument(
    name = "POST /v1/me/blogs/{blog_id}/editors",
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

    if !check_resource_limit(&data.redis, ResourceLimit::SendBlogEditorRequest, blog_id).await? {
        return Err(AppError::new_client_error_with_status(
            StatusCode::TOO_MANY_REQUESTS,
            "Daily limit exceeded for sending editor requests on this blog. Try again tomorrow.",
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
WITH target_blog AS (
        SELECT FROM blogs
        WHERE
            id = $3
            AND user_id = $1
    ),
    inserted_blog_editor AS (
        INSERT INTO blog_editors (user_id, blog_id)
        SELECT $2, $3
        WHERE
            EXISTS (SELECT 1 FROM target_blog)
        RETURNING id
    ),
    inserted_notification AS (
        INSERT INTO notifications (entity_type, entity_id, notifier_id)
        SELECT
            $4,
            (SELECT id FROM inserted_blog_editor),
            $1
        WHERE
            EXISTS (SELECT 1 FROM target_blog)
            AND EXISTS (SELECT 1 FROM inserted_blog_editor)
        RETURNING id
    )
INSERT INTO
    notification_outs (notified_id, notification_id)
SELECT
    $2,
    (SELECT id FROM inserted_notification)
WHERE
    EXISTS (SELECT 1 FROM target_blog)
    AND EXISTS (SELECT 1 FROM inserted_notification)
"#,
    )
    .bind(current_user_id)
    .bind(user_result.get::<i64, _>("id"))
    .bind(blog_id)
    .bind(NotificationEntityType::BlogEditorInvite as i16)
    .execute(&mut *txn)
    .await
    {
        Ok(result) => match result.rows_affected() {
            0 => Err(AppError::from("Unknown blog")),
            _ => {
                incr_resource_limit(&data.redis, ResourceLimit::SendBlogEditorRequest, blog_id)
                    .await?;

                txn.commit().await?;

                Ok(HttpResponse::Ok().finish())
            }
        },
        Err(error) => {
            if let Some(db_err) = error.as_database_error() {
                let error_kind = db_err.kind();

                // User is already an editor.
                if matches!(error_kind, sqlx::error::ErrorKind::UniqueViolation) {
                    return Err(AppError::ToastError(ToastErrorResponse::new(
                        Some(StatusCode::CONFLICT),
                        "User is already an editor or the request is still pending",
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

                // Check if the editor ID is same as the current user ID.
                if error_code == SqlState::IllegalEditor.to_string() {
                    return Err(AppError::ToastError(ToastErrorResponse::new(
                        None,
                        "You cannot send an editor request to yourself",
                    )));
                }

                // Check if the current user is blocked by the editor.
                if error_code == SqlState::BlogOwnerBlockedByEditor.to_string() {
                    return Err(AppError::ToastError(ToastErrorResponse::new(
                        Some(StatusCode::FORBIDDEN),
                        "You are being blocked by the user",
                    )));
                }

                // Check if the editor is accepting requests from the current user.
                if error_code == SqlState::EditorNotAcceptingBlogRequest.to_string() {
                    return Err(AppError::ToastError(ToastErrorResponse::new(
                        Some(StatusCode::FORBIDDEN),
                        "User is not accepting editor requests from you",
                    )));
                }

                // Check if the editor limit has been reached for the current blog.
                if error_code == SqlState::EditorOverflow.to_string() {
                    return Err(AppError::ToastError(ToastErrorResponse::new(
                        None,
                        "Editor limit has been reached for this blog",
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

    #[sqlx::test(fixtures("editor"))]
    async fn can_reject_an_editor_request_for_a_soft_deleted_blog(
        pool: PgPool,
    ) -> sqlx::Result<()> {
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
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Try sending the editor request.
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                username: "test_user_2".to_string(),
            })
            .uri(&format!("/v1/me/blogs/{}/editors", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Blog unavailable").await;

        Ok(())
    }

    #[sqlx::test(fixtures("editor"))]
    async fn can_reject_an_editor_request_for_a_soft_deleted_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
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

        // Try sending the editor request.
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                username: "test_user_2".to_string(),
            })
            .uri(&format!("/v1/me/blogs/{}/editors", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Unknown user, try again").await;

        Ok(())
    }

    #[sqlx::test(fixtures("editor"))]
    async fn can_reject_an_editor_request_for_a_deactivated_user(pool: PgPool) -> sqlx::Result<()> {
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

        // Try sending the editor request.
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                username: "test_user_2".to_string(),
            })
            .uri(&format!("/v1/me/blogs/{}/editors", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Unknown user, try again").await;

        Ok(())
    }

    #[sqlx::test(fixtures("editor"))]
    async fn can_reject_an_editor_request_from_an_unknown_user(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        // Try sending the editor request.
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                username: "test_user_2".to_string(),
            })
            .uri(&format!("/v1/me/blogs/{}/editors", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Unknown blog").await;

        Ok(())
    }

    #[sqlx::test(fixtures("editor"))]
    async fn can_reject_an_editor_request_for_a_missing_blog(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                username: "test_user_2".to_string(),
            })
            .uri(&format!("/v1/me/blogs/{}/editors", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Unknown blog").await;

        Ok(())
    }

    #[sqlx::test(fixtures("editor"))]
    async fn can_reject_an_editor_request_for_a_missing_user(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                username: "random_user".to_string(),
            })
            .uri(&format!("/v1/me/blogs/{}/editors", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Unknown user, try again").await;

        Ok(())
    }

    #[sqlx::test(fixtures("editor"))]
    async fn should_not_allow_the_user_to_send_editor_request_to_itself(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                username: "test_user_1".to_string(),
            })
            .uri(&format!("/v1/me/blogs/{}/editors", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "You cannot send an editor request to yourself").await;

        Ok(())
    }

    #[sqlx::test(fixtures("editor"))]
    async fn can_reject_an_editor_request_on_editor_overflow(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Insert some editors.
        let result = sqlx::query(
            r#"
WITH inserted_users AS (
    INSERT INTO users (id, name, username, email)
    VALUES
        (4, 'Editor 1', 'editor_1', 'editor_1@storiny.com'),
        (5, 'Editor 2', 'editor_2', 'editor_2@storiny.com'),
        (6, 'Editor 3', 'editor_3', 'editor_3@storiny.com'),
        (7, 'Editor 4', 'editor_4', 'editor_4@storiny.com'),
        (8, 'Editor 5', 'editor_5', 'editor_5@storiny.com')
)
INSERT INTO blog_editors (user_id, blog_id)
VALUES (4, $1), (5, $1), (6, $1), (7, $1), (8, $1)
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 5);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                username: "test_user_2".to_string(),
            })
            .uri(&format!("/v1/me/blogs/{}/editors", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Editor limit has been reached for this blog").await;

        Ok(())
    }

    #[sqlx::test(fixtures("editor"))]
    async fn can_reject_an_editor_request_when_the_editor_is_private(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Make the editor private.
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
            .uri(&format!("/v1/me/blogs/{}/editors", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "User is not accepting editor requests from you").await;

        Ok(())
    }

    #[sqlx::test(fixtures("editor"))]
    async fn can_reject_an_editor_request_when_the_editor_has_blocked_the_owner_of_the_blog(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Get blocked by the editor.
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
            .uri(&format!("/v1/me/blogs/{}/editors", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "You are being blocked by the user").await;

        Ok(())
    }

    #[sqlx::test(fixtures("editor"))]
    async fn can_reject_an_editor_request_when_the_editor_is_not_accepting_editor_requests_from_the_user(
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
            .uri(&format!("/v1/me/blogs/{}/editors", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "User is not accepting editor requests from you").await;

        Ok(())
    }

    mod serial {
        use super::*;

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("editor"))]
        async fn can_send_an_editor_request(
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
                .uri(&format!("/v1/me/blogs/{}/editors", 3))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Editor request should be present in the database.
            let editor_result = sqlx::query(
                r#"
SELECT id FROM blog_editors
WHERE user_id = $1 AND blog_id = $2
"#,
            )
            .bind(2_i64)
            .bind(3_i64)
            .fetch_one(&mut *conn)
            .await?;

            assert!(editor_result.try_get::<i64, _>("id").is_ok());

            // Should also insert a notification.
            let result = sqlx::query(
                r#"
SELECT EXISTS (
    SELECT 1 FROM notifications
    WHERE entity_id = $1
)
"#,
            )
            .bind(editor_result.get::<i64, _>("id"))
            .fetch_one(&mut *conn)
            .await?;

            assert!(result.get::<bool, _>("exists"));

            // Should also increment the resource limit.
            let result =
                get_resource_limit(&ctx.redis_pool, ResourceLimit::SendBlogEditorRequest, 3_i64)
                    .await;

            assert_eq!(result, 1);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_an_editor_request_on_exceeding_the_resource_limit(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

            exceed_resource_limit(&ctx.redis_pool, ResourceLimit::SendBlogEditorRequest, 3_i64)
                .await;

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .set_json(Request {
                    username: "test_user_2".to_string(),
                })
                .uri(&format!("/v1/me/blogs/{}/editors", 3))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert_eq!(res.status(), StatusCode::TOO_MANY_REQUESTS);

            Ok(())
        }
    }
}
