use crate::error::ToastErrorResponse;
use crate::{
    constants::sql_states::SqlState, error::AppError, middleware::identity::identity::Identity,
    AppState,
};
use actix_web::{post, web, HttpResponse};
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
                    match sqlx::query(
                        r#"
                        INSERT INTO friends(transmitter_id, receiver_id)
                        VALUES ($1, $2)
                        "#,
                    )
                    .bind(user_id)
                    .bind(receiver_id)
                    .execute(&data.db_pool)
                    .await
                    {
                        Ok(_) => Ok(HttpResponse::Created().finish()),
                        Err(err) => {
                            if let Some(db_err) = err.into_database_error() {
                                match db_err.kind() {
                                    // Do not throw if friend already exists
                                    sqlx::error::ErrorKind::UniqueViolation => {
                                        Ok(HttpResponse::NoContent().finish())
                                    }
                                    _ => {
                                        let err_code = db_err.code().unwrap_or_default();

                                        // Check if the receiver is soft-deleted or deactivated
                                        if err_code == SqlState::EntityUnavailable.to_string() {
                                            Ok(HttpResponse::BadRequest().json(
                                                ToastErrorResponse::new(
                                                    "User is either deleted or deactivated"
                                                        .to_string(),
                                                ),
                                            ))
                                        // Check if `transmitter_id` is same as `receiver_id`
                                        } else if err_code == SqlState::RelationOverlap.to_string()
                                        {
                                            Ok(HttpResponse::BadRequest().json(
                                                ToastErrorResponse::new(
                                                    "You cannot send a friend request to yourself"
                                                        .to_string(),
                                                ),
                                            ))
                                        // Check if the user is being blocked by the followed user
                                        } else if err_code
                                            == SqlState::TransmitterBlockedByReceiverUser
                                                .to_string()
                                        {
                                            Ok(HttpResponse::Forbidden().json(
                                                ToastErrorResponse::new(
                                                    "You are being blocked by the user".to_string(),
                                                ),
                                            ))
                                        // Check wether the receiver is accepting friend requests from the transmitter
                                        } else if err_code
                                            == SqlState::ReceiverNotAcceptingFriendRequest
                                                .to_string()
                                        {
                                            Ok(HttpResponse::Forbidden()
                                                .json(ToastErrorResponse::new(
                                                "User is not accepting friend requests from you"
                                                    .to_string(),
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
    use crate::privacy_settings_def::v1::IncomingFriendRequest;
    use crate::test_utils::{assert_toast_error_response, init_app_for_test};
    use actix_web::test;
    use sqlx::{PgPool, Row};

    #[sqlx::test(fixtures("friend"))]
    async fn can_send_a_friend_request(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false).await;

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
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("friend"))]
    async fn should_not_throw_when_sending_a_friend_request_to_an_existing_friend(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false).await;

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

        Ok(())
    }

    #[sqlx::test(fixtures("friend"))]
    async fn should_not_send_friend_request_to_a_soft_deleted_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, false).await;

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
        let (app, cookie, _) = init_app_for_test(post, pool, true, false).await;

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
        let (app, cookie, _) = init_app_for_test(post, pool, true, false).await;

        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/friends/{}", 1))
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
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false).await;

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
        let (app, cookie, _) = init_app_for_test(post, pool, true, false).await;

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
}
