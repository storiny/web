use crate::error::ToastErrorResponse;
use crate::{error::AppError, middleware::identity::identity::Identity, AppState};
use actix_web::{delete, web, HttpResponse};
use serde::Deserialize;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    user_id: String,
}

#[delete("/v1/me/friend-requests/{user_id}")]
async fn delete(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => match path.user_id.parse::<i64>() {
            Ok(transmitter_id) => {
                match sqlx::query(
                    r#"
                    DELETE FROM friends
                    WHERE
                        receiver_id = $1
                        AND transmitter_id = $2
                        AND accepted_at IS NULL
                    "#,
                )
                .bind(user_id)
                .bind(transmitter_id)
                .execute(&data.db_pool)
                .await?
                .rows_affected()
                {
                    0 => Ok(HttpResponse::BadRequest().json(ToastErrorResponse::new(
                        "Friend request not found".to_string(),
                    ))),
                    _ => Ok(HttpResponse::NoContent().finish()),
                }
            }
            Err(_) => Ok(HttpResponse::BadRequest().body("Invalid user ID")),
        },
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(delete);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{assert_toast_error_response, init_app_for_test};
    use actix_web::test;
    use sqlx::{PgPool, Row};

    #[sqlx::test(fixtures("friend_request"))]
    async fn can_reject_a_friend_request(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false).await;

        // Receive a friend request
        let insert_result = sqlx::query(
            r#"
            INSERT INTO friends(transmitter_id, receiver_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/friend-requests/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Friend request should not be present in the database
        let result = sqlx::query(
            r#"
            SELECT EXISTS(
                SELECT 1 FROM friends
                WHERE receiver_id = $1 AND transmitter_id = $2
            )
            "#,
        )
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_an_error_response_when_rejecting_an_unknown_friend_request(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(delete, pool, true, false).await;

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/friend-requests/{}", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Friend request not found").await;

        Ok(())
    }
}
