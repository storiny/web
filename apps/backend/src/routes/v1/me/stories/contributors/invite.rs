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
    realms::realm::MAX_PEERS_PER_REALM,
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
use lazy_static::lazy_static;
use regex::Regex;
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::Row;
use validator::Validate;

lazy_static! {
    static ref ROLE_REGEX: Regex = {
        #[allow(clippy::unwrap_used)]
        Regex::new(r"^(editor|viewer)$").unwrap()
    };
}

#[derive(Deserialize, Validate)]
struct Fragments {
    story_id: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(regex = "ROLE_REGEX")]
    role: String,
    #[validate(regex = "USERNAME_REGEX")]
    #[validate(length(min = 3, max = 24, message = "Invalid username length"))]
    username: String,
}

#[post("/v1/me/stories/{story_id}/contributors")]
#[tracing::instrument(
    name = "POST /v1/me/stories/{story_id}/contributors",
    skip_all,
    fields(
        current_user_id = user.id().ok(),
        story_id = %path.story_id,
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

    let story_id = path
        .story_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid story ID"))?;

    if !check_resource_limit(
        &data.redis,
        ResourceLimit::SendCollabRequest,
        current_user_id,
    )
    .await?
    {
        return Err(AppError::new_client_error_with_status(
            StatusCode::TOO_MANY_REQUESTS,
            "Daily limit exceeded for sending collaboration requests. Try again tomorrow.",
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
WITH target_story AS (
        SELECT FROM stories
        WHERE
            id = $3
            AND user_id = $1
    ),
    inserted_story_contributor AS (
        INSERT INTO story_contributors (user_id, story_id, role)
        SELECT $2, $3, $4
        WHERE
            EXISTS (SELECT 1 FROM target_story)
        RETURNING id
    ),
    inserted_notification AS (
        INSERT INTO notifications (entity_type, entity_id, notifier_id)
        SELECT
            $5,
            (SELECT id FROM inserted_story_contributor),
            $1
        WHERE
            EXISTS (SELECT 1 FROM target_story)
            AND EXISTS (SELECT 1 FROM inserted_story_contributor)
        RETURNING id
    )
INSERT INTO
    notification_outs (notified_id, notification_id)
SELECT
    $2,
    (SELECT id FROM inserted_notification)
WHERE
    EXISTS (SELECT 1 FROM target_story)
    AND EXISTS (SELECT 1 FROM inserted_notification)
"#,
    )
    .bind(current_user_id)
    .bind(user_result.get::<i64, _>("id"))
    .bind(story_id)
    .bind(&payload.role)
    .bind(NotificationEntityType::CollabReqReceived as i16)
    .bind(MAX_PEERS_PER_REALM as i16)
    .execute(&mut *txn)
    .await
    {
        Ok(result) => match result.rows_affected() {
            0 => Err(AppError::from("Unknown story")),
            _ => {
                incr_resource_limit(
                    &data.redis,
                    ResourceLimit::SendCollabRequest,
                    current_user_id,
                )
                .await?;

                txn.commit().await?;

                Ok(HttpResponse::Ok().finish())
            }
        },
        Err(error) => {
            if let Some(db_err) = error.as_database_error() {
                let error_kind = db_err.kind();

                // User is already a contributor.
                if matches!(error_kind, sqlx::error::ErrorKind::UniqueViolation) {
                    return Err(AppError::ToastError(ToastErrorResponse::new(
                        Some(StatusCode::CONFLICT),
                        "User is already a contributor or the request is still pending",
                    )));
                }

                // Target story is not present in the table.
                if matches!(error_kind, sqlx::error::ErrorKind::ForeignKeyViolation) {
                    return Err(AppError::from("Story does not exist"));
                }

                let error_code = db_err.code().unwrap_or_default();

                // Check if the story is soft-deleted.
                if error_code == SqlState::EntityUnavailable.to_string() {
                    return Err(AppError::from("Story unavailable"));
                }

                // Check if the contributor ID is same as the current user ID.
                if error_code == SqlState::IllegalContributor.to_string() {
                    return Err(AppError::ToastError(ToastErrorResponse::new(
                        None,
                        "You cannot send a collaboration request to yourself",
                    )));
                }

                // Check if the current user is blocked by the contributor.
                if error_code == SqlState::StoryWriterBlockedByContributor.to_string() {
                    return Err(AppError::ToastError(ToastErrorResponse::new(
                        Some(StatusCode::FORBIDDEN),
                        "You are being blocked by the user",
                    )));
                }

                // Check if the contributor is accepting requests from the current user.
                if error_code == SqlState::ContributorNotAcceptingCollaborationRequest.to_string() {
                    return Err(AppError::ToastError(ToastErrorResponse::new(
                        Some(StatusCode::FORBIDDEN),
                        "User is not accepting collaboration requests from you",
                    )));
                }

                // Check if the contributor limit has been reached for the current story.
                if error_code == SqlState::ContributorOverflow.to_string() {
                    return Err(AppError::ToastError(ToastErrorResponse::new(
                        None,
                        "Maximum number of contributors reached",
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
        grpc::defs::privacy_settings_def::v1::IncomingCollaborationRequest,
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

    #[sqlx::test(fixtures("contributor"))]
    async fn can_reject_a_collaboration_request_for_a_soft_deleted_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Soft-delete the story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Try sending the collaboration request.
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                role: "editor".to_string(),
                username: "test_user_2".to_string(),
            })
            .uri(&format!("/v1/me/stories/{}/contributors", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Story unavailable").await;

        Ok(())
    }

    #[sqlx::test(fixtures("contributor"))]
    async fn can_reject_a_collaboration_request_for_a_soft_deleted_user(
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

        // Try sending the collaboration request.
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                role: "editor".to_string(),
                username: "test_user_2".to_string(),
            })
            .uri(&format!("/v1/me/stories/{}/contributors", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Unknown user, try again").await;

        Ok(())
    }

    #[sqlx::test(fixtures("contributor"))]
    async fn can_reject_a_collaboration_request_for_a_deactivated_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
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

        // Try sending the collaboration request.
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                role: "editor".to_string(),
                username: "test_user_2".to_string(),
            })
            .uri(&format!("/v1/me/stories/{}/contributors", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Unknown user, try again").await;

        Ok(())
    }

    #[sqlx::test(fixtures("contributor"))]
    async fn can_reject_a_collaboration_request_from_an_unknown_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        // Try sending the collaboration request.
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                role: "editor".to_string(),
                username: "test_user_2".to_string(),
            })
            .uri(&format!("/v1/me/stories/{}/contributors", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Unknown story").await;

        Ok(())
    }

    #[sqlx::test(fixtures("contributor"))]
    async fn can_reject_a_collaboration_request_for_a_missing_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                role: "editor".to_string(),
                username: "test_user_2".to_string(),
            })
            .uri(&format!("/v1/me/stories/{}/contributors", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Unknown story").await;

        Ok(())
    }

    #[sqlx::test(fixtures("contributor"))]
    async fn can_reject_a_collaboration_request_for_a_missing_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                role: "editor".to_string(),
                username: "random_user".to_string(),
            })
            .uri(&format!("/v1/me/stories/{}/contributors", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Unknown user, try again").await;

        Ok(())
    }

    #[sqlx::test(fixtures("contributor"))]
    async fn should_not_allow_the_user_to_send_collaboration_request_to_itself(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                role: "editor".to_string(),
                username: "test_user_1".to_string(),
            })
            .uri(&format!("/v1/me/stories/{}/contributors", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "You cannot send a collaboration request to yourself")
            .await;

        Ok(())
    }

    #[sqlx::test(fixtures("contributor"))]
    async fn can_reject_a_collaboration_request_on_contributor_overflow(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Insert some contributors.
        let result = sqlx::query(
            r#"
WITH inserted_users AS (
    INSERT INTO users (id, name, username, email)
    VALUES
        (4, 'Contributor 1', 'contributor_1', 'contributor_1@storiny.com'),
        (5, 'Contributor 2', 'contributor_2', 'contributor_2@storiny.com'),
        (6, 'Contributor 3', 'contributor_3', 'contributor_3@storiny.com')
)
INSERT INTO story_contributors (user_id, story_id)
VALUES (4, $1), (5, $1), (6, $1)
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 3);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                role: "editor".to_string(),
                username: "test_user_2".to_string(),
            })
            .uri(&format!("/v1/me/stories/{}/contributors", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Maximum number of contributors reached").await;

        Ok(())
    }

    #[sqlx::test(fixtures("contributor"))]
    async fn can_reject_a_collaboration_request_when_the_contributor_is_private(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Make the contributor private.
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
                role: "editor".to_string(),
                username: "test_user_2".to_string(),
            })
            .uri(&format!("/v1/me/stories/{}/contributors", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "User is not accepting collaboration requests from you")
            .await;

        Ok(())
    }

    #[sqlx::test(fixtures("contributor"))]
    async fn can_reject_a_collaboration_request_when_the_contributor_has_blocked_the_writer_of_the_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Get blocked by the contributor.
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
                role: "editor".to_string(),
                username: "test_user_2".to_string(),
            })
            .uri(&format!("/v1/me/stories/{}/contributors", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "You are being blocked by the user").await;

        Ok(())
    }

    #[sqlx::test(fixtures("contributor"))]
    async fn can_reject_a_collaboration_request_when_the_contributor_is_not_accepting_collaboration_requests_from_the_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Set `incoming_collaboration_requests` to `None` for the receiver.
        sqlx::query(
            r#"
UPDATE users
SET incoming_collaboration_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingCollaborationRequest::None as i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .set_json(Request {
                role: "editor".to_string(),
                username: "test_user_2".to_string(),
            })
            .uri(&format!("/v1/me/stories/{}/contributors", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "User is not accepting collaboration requests from you")
            .await;

        Ok(())
    }

    mod serial {
        use super::*;

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("contributor"))]
        async fn can_send_a_collaboration_request(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (app, cookie, user_id) =
                init_app_for_test(post, pool, true, true, Some(1_i64)).await;

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .set_json(Request {
                    role: "editor".to_string(),
                    username: "test_user_2".to_string(),
                })
                .uri(&format!("/v1/me/stories/{}/contributors", 3))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Story contributor should be present in the database.
            let contributor_result = sqlx::query(
                r#"
SELECT id FROM story_contributors
WHERE user_id = $1 AND story_id = $2
"#,
            )
            .bind(2_i64)
            .bind(3_i64)
            .fetch_one(&mut *conn)
            .await?;

            assert!(contributor_result.try_get::<i64, _>("id").is_ok());

            // Should also insert a notification.
            let result = sqlx::query(
                r#"
SELECT EXISTS (
    SELECT 1 FROM notifications
    WHERE entity_id = $1
)
"#,
            )
            .bind(contributor_result.get::<i64, _>("id"))
            .fetch_one(&mut *conn)
            .await?;

            assert!(result.get::<bool, _>("exists"));

            // Should also increment the resource limit.
            let result = get_resource_limit(
                &ctx.redis_pool,
                ResourceLimit::SendCollabRequest,
                user_id.unwrap(),
            )
            .await;

            assert_eq!(result, 1);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_a_collaboration_request_on_exceeding_the_resource_limit(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

            exceed_resource_limit(
                &ctx.redis_pool,
                ResourceLimit::SendCollabRequest,
                user_id.unwrap(),
            )
            .await;

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .set_json(Request {
                    role: "editor".to_string(),
                    username: "test_user_2".to_string(),
                })
                .uri(&format!("/v1/me/stories/{}/contributors", 3))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert_eq!(res.status(), StatusCode::TOO_MANY_REQUESTS);

            Ok(())
        }
    }
}
