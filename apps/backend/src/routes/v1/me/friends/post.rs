use crate::{
    constants::{
        notification_entity_type::NotificationEntityType,
        resource_limit::ResourceLimit,
        sql_states::SqlState,
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
use serde::Deserialize;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    receiver_id: String,
}

#[post("/v1/me/friends/{receiver_id}")]
#[tracing::instrument(
    name = "POST /v1/me/friends/{receiver_id}",
    skip_all,
    fields(
        transmitter_id = user.id().ok(),
        receiver_id = %path.receiver_id
    ),
    err
)]
async fn post(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let transmitter_id = user.id()?;
    let receiver_id = path
        .receiver_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid user ID"))?;

    if !check_resource_limit(
        &data.redis,
        ResourceLimit::SendFriendRequest,
        transmitter_id,
    )
    .await?
    {
        return Err(ToastErrorResponse::new(
            Some(StatusCode::TOO_MANY_REQUESTS),
            "Daily limit exceeded for sending friend requests. Try again tomorrow.",
        )
        .into());
    }

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    match sqlx::query(
        r#"
WITH inserted_friend AS (
        INSERT INTO friends (transmitter_id, receiver_id)
        VALUES ($1, $2)
        RETURNING TRUE AS "inserted"
    ),
    inserted_notification AS (
        INSERT INTO notifications (entity_type, entity_id, notifier_id)
        SELECT $3, $1, $1
        WHERE EXISTS (SELECT 1 FROM inserted_friend)
        RETURNING id
    )
INSERT INTO
    notification_outs (notified_id, notification_id)
SELECT $2, (SELECT id FROM inserted_notification)
WHERE EXISTS (SELECT 1 FROM inserted_friend)
"#,
    )
    .bind(transmitter_id)
    .bind(receiver_id)
    .bind(NotificationEntityType::FriendReqReceived as i16)
    .execute(&mut *txn)
    .await
    {
        Ok(_) => {
            incr_resource_limit(
                &data.redis,
                ResourceLimit::SendFriendRequest,
                transmitter_id,
            )
            .await?;

            txn.commit().await?;

            Ok(HttpResponse::Created().finish())
        }
        Err(error) => {
            if let Some(db_err) = error.as_database_error() {
                let error_kind = db_err.kind();

                // Do not throw if the user is already a friend.
                if matches!(error_kind, sqlx::error::ErrorKind::UniqueViolation) {
                    return Ok(HttpResponse::NoContent().finish());
                }

                // Target user is not present in the table.
                if matches!(error_kind, sqlx::error::ErrorKind::ForeignKeyViolation) {
                    return Err(AppError::ToastError(ToastErrorResponse::new(
                        None,
                        "User does not exist",
                    )));
                }

                let error_code = db_err.code().unwrap_or_default();

                // Check if the receiver is soft-deleted or deactivated.
                if error_code == SqlState::EntityUnavailable.to_string() {
                    return Err(AppError::ToastError(ToastErrorResponse::new(
                        None,
                        "User is either deleted or deactivated",
                    )));
                }

                // Check if the `transmitter_id` is same as `receiver_id`.
                if error_code == SqlState::RelationOverlap.to_string() {
                    return Err(AppError::ToastError(ToastErrorResponse::new(
                        None,
                        "You cannot send a friend request to yourself",
                    )));
                }

                // Check if the transmitter is blocked by the receiver user.
                if error_code == SqlState::TransmitterBlockedByReceiverUser.to_string() {
                    return Err(AppError::ToastError(ToastErrorResponse::new(
                        Some(StatusCode::FORBIDDEN),
                        "You are being blocked by the user",
                    )));
                }

                // Check if the receiver is accepting requests from the transmitter.
                if error_code == SqlState::ReceiverNotAcceptingFriendRequest.to_string() {
                    return Err(AppError::ToastError(ToastErrorResponse::new(
                        Some(StatusCode::FORBIDDEN),
                        "User is not accepting friend requests from you",
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
        grpc::defs::privacy_settings_def::v1::IncomingFriendRequest,
        test_utils::{
            assert_toast_error_response,
            exceed_resource_limit,
            get_resource_limit,
            init_app_for_test,
            RedisTestContext,
        },
    };
    use actix_web::{
        http::StatusCode,
        test,
    };
    use sqlx::{
        PgPool,
        Row,
    };
    use storiny_macros::test_context;

    #[sqlx::test(fixtures("friend"))]
    async fn should_not_send_a_friend_request_to_a_soft_deleted_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        // Soft-delete the receiver.
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

        // Try sending a friend request to the user.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/friends/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "User is either deleted or deactivated").await;

        Ok(())
    }

    #[sqlx::test(fixtures("friend"))]
    async fn should_not_send_a_friend_request_to_a_deactivated_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        // Deactivate the receiver.
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

        // Try sending a friend request to the user.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/friends/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "User is either deleted or deactivated").await;

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_allow_the_user_to_send_friend_request_to_itself(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/friends/{}", user_id.unwrap()))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "You cannot send a friend request to yourself").await;

        Ok(())
    }

    #[sqlx::test(fixtures("friend"))]
    async fn can_reject_a_friend_request_when_the_receiver_has_blocked_the_transmitter(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Get blocked by the receiver.
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
            .uri(&format!("/v1/me/friends/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "You are being blocked by the user").await;

        Ok(())
    }

    #[sqlx::test(fixtures("friend"))]
    async fn can_reject_a_friend_request_when_the_receiver_is_not_accepting_friend_requests_from_the_transmitter(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        // Set `incoming_friend_requests` to `None` for the receiver.
        sqlx::query(
            r#"
UPDATE users
SET incoming_friend_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingFriendRequest::None as i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/friends/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "User is not accepting friend requests from you").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_friend_request_for_a_missing_user(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/friends/{}", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "User does not exist").await;

        Ok(())
    }

    mod serial {
        use super::*;

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("friend"))]
        async fn can_send_a_friend_request(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri(&format!("/v1/me/friends/{}", 2))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Friend request should be present in the database.
            let result = sqlx::query(
                r#"
SELECT EXISTS (
    SELECT 1 FROM friends
    WHERE
        transmitter_id = $1
        AND receiver_id = $2
        AND accepted_at IS NULL
)
"#,
            )
            .bind(user_id.unwrap())
            .bind(2_i64)
            .fetch_one(&mut *conn)
            .await?;

            assert!(result.get::<bool, _>("exists"));

            // Should also insert a notification.
            let result = sqlx::query(
                r#"
SELECT EXISTS (
    SELECT 1 FROM notifications
    WHERE entity_id = $1
)
"#,
            )
            .bind(user_id.unwrap())
            .fetch_one(&mut *conn)
            .await?;

            assert!(result.get::<bool, _>("exists"));

            // Should also increment the resource limit.
            let result = get_resource_limit(
                &ctx.redis_pool,
                ResourceLimit::SendFriendRequest,
                user_id.unwrap(),
            )
            .await;

            assert_eq!(result, 1);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_a_friend_request_on_exceeding_the_resource_limit(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

            exceed_resource_limit(
                &ctx.redis_pool,
                ResourceLimit::SendFriendRequest,
                user_id.unwrap(),
            )
            .await;

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri(&format!("/v1/me/friends/{}", 2))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert_eq!(res.status(), StatusCode::TOO_MANY_REQUESTS);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("friend"))]
        async fn should_not_throw_when_sending_a_friend_request_to_an_existing_friend(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

            // Send the friend request for the first time.
            let req = test::TestRequest::post()
                .cookie(cookie.clone().unwrap())
                .uri(&format!("/v1/me/friends/{}", 2))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Try sending the friend request again.
            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri(&format!("/v1/me/friends/{}", 2))
                .to_request();
            let res = test::call_service(&app, req).await;

            // Should not throw.
            assert!(res.status().is_success());

            // Should not insert another notification.
            let result = sqlx::query(
                r#"
SELECT 1
FROM notification_outs
WHERE
    notification_id = (
        SELECT id FROM notifications
        WHERE entity_id = $1
    )
"#,
            )
            .bind(user_id.unwrap())
            .fetch_all(&mut *conn)
            .await?;

            assert_eq!(result.len(), 1);

            Ok(())
        }
    }
}
