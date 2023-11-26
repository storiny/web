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
use actix_web::{
    post,
    web,
    HttpResponse,
};
use serde::Deserialize;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    user_id: String,
}

#[post("/v1/me/friends/{user_id}")]
async fn post(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => {
            match path.user_id.parse::<i64>() {
                Ok(receiver_id) => {
                    if !check_resource_limit(&data.redis, ResourceLimit::SendFriendRequest, user_id)
                        .await
                        .unwrap_or_default()
                    {
                        return Ok(HttpResponse::TooManyRequests().body(
                            "Daily limit exceeded for sending friend requests. Try again tomorrow.",
                        ));
                    }

                    match sqlx::query(
                        r#"
                        WITH
                            inserted_friend AS (
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
                        INSERT
                        INTO
                            notification_outs (notified_id, notification_id)
                        SELECT
                            $2, (SELECT id FROM inserted_notification)
                        WHERE EXISTS (SELECT 1 FROM inserted_friend)
                        "#,
                    )
                    .bind(user_id)
                    .bind(receiver_id)
                    .bind(NotificationEntityType::FriendReqReceived as i16)
                    .execute(&data.db_pool)
                    .await
                    {
                        Ok(_) => {
                            let _ = incr_resource_limit(
                                &data.redis,
                                ResourceLimit::SendFriendRequest,
                                user_id,
                            )
                            .await;

                            Ok(HttpResponse::Created().finish())
                        }
                        Err(err) => {
                            if let Some(db_err) = err.into_database_error() {
                                match db_err.kind() {
                                    // Do not throw if friend already exists
                                    sqlx::error::ErrorKind::UniqueViolation => {
                                        Ok(HttpResponse::NoContent().finish())
                                    }
                                    // Target user is not present in the table
                                    sqlx::error::ErrorKind::ForeignKeyViolation => {
                                        Ok(HttpResponse::BadRequest()
                                            .json(ToastErrorResponse::new("User does not exist")))
                                    }
                                    _ => {
                                        let err_code = db_err.code().unwrap_or_default();

                                        // Check if the receiver is soft-deleted or deactivated
                                        if err_code == SqlState::EntityUnavailable.to_string() {
                                            Ok(HttpResponse::BadRequest().json(
                                                ToastErrorResponse::new(
                                                    "User is either deleted or deactivated",
                                                ),
                                            ))
                                        // Check if `transmitter_id` is same as `receiver_id`
                                        } else if err_code == SqlState::RelationOverlap.to_string()
                                        {
                                            Ok(HttpResponse::BadRequest().json(
                                                ToastErrorResponse::new(
                                                    "You cannot send a friend request to yourself",
                                                ),
                                            ))
                                        // Check if the user is being blocked by the followed user
                                        } else if err_code
                                            == SqlState::TransmitterBlockedByReceiverUser
                                                .to_string()
                                        {
                                            Ok(HttpResponse::Forbidden().json(
                                                ToastErrorResponse::new(
                                                    "You are being blocked by the user",
                                                ),
                                            ))
                                        // Check whether the receiver is accepting friend requests
                                        // from the transmitter
                                        } else if err_code
                                            == SqlState::ReceiverNotAcceptingFriendRequest
                                                .to_string()
                                        {
                                            Ok(HttpResponse::Forbidden()
                                                .json(ToastErrorResponse::new(
                                                "User is not accepting friend requests from you",
                                            )))
                                        } else {
                                            Ok(HttpResponse::InternalServerError().finish())
                                        }
                                    }
                                }
                            } else {
                                Ok(HttpResponse::InternalServerError().finish())
                            }
                        }
                    }
                }
                Err(_) => Ok(HttpResponse::BadRequest().body("Invalid user ID")),
            }
        }
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
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
    use serial_test::serial;
    use sqlx::{
        PgPool,
        Row,
    };
    use storiny_macros::test_context;

    #[test_context(RedisTestContext)]
    #[sqlx::test(fixtures("friend"))]
    #[serial(redis)]
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

        // Friend request should be present in the database
        let result = sqlx::query(
            r#"
            SELECT EXISTS(
                SELECT 1 FROM friends
                WHERE transmitter_id = $1 AND receiver_id = $2 AND accepted_at IS NULL
            )
            "#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("exists"));

        // Should also insert a notification
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

        // Should also increment the resource limit
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
    #[serial(redis)]
    async fn can_reject_friend_request_on_exceeding_the_resource_limit(
        ctx: &mut RedisTestContext,
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Exceed the resource limit
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
    #[serial(redis)]
    async fn should_not_throw_when_sending_a_friend_request_to_an_existing_friend(
        _ctx: &mut RedisTestContext,
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Send the friend request for the first time
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/friends/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Try sending the friend request again
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/friends/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should not throw
        assert!(res.status().is_success());

        // Should not insert another notification
        let result = sqlx::query(
            r#"
            SELECT
                1
            FROM
                notification_outs
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

    #[sqlx::test(fixtures("friend"))]
    async fn should_not_send_friend_request_to_a_soft_deleted_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        // Soft-delete the receiver
        let result = sqlx::query(
            r#"
            UPDATE users
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Try sending a friend request to the user
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
    async fn should_not_send_friend_request_to_a_deactivated_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        // Deactivate the receiver
        let result = sqlx::query(
            r#"
            UPDATE users
            SET deactivated_at = now()
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Try sending a friend request to the user
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
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/friends/{}", user_id.unwrap()))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "You cannot send a friend request to yourself").await;

        Ok(())
    }

    #[sqlx::test(fixtures("friend"))]
    async fn can_reject_friend_request_when_the_receiver_has_blocked_the_transmitter(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Get blocked by the receiver
        sqlx::query(
            r#"
            INSERT INTO blocks(blocker_id, blocked_id)
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
    async fn can_reject_friend_request_when_the_receiver_is_not_accepting_friend_requests_from_the_transmitter(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        // Set `incoming_friend_requests` to none for the receiver
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
    async fn can_reject_friend_request_for_a_missing_user(pool: PgPool) -> sqlx::Result<()> {
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
}
