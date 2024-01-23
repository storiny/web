use crate::{
    constants::notification_entity_type::NotificationEntityType,
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
    transmitter_id: String,
}

#[post("/v1/me/friend-requests/{transmitter_id}")]
#[tracing::instrument(
    name = "POST /v1/me/friend-requests/{transmitter_id}",
    skip_all,
    fields(
        receiver_id = user.id().ok(),
        transmitter_id = %path.transmitter_id
    ),
    err
)]
async fn post(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let receiver_id = user.id()?;
    let transmitter_id = path
        .transmitter_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid user ID"))?;

    match sqlx::query(
        r#"                    
WITH
    updated_friend AS (
        UPDATE friends
        SET accepted_at = NOW()
        WHERE
            receiver_id = $1
            AND transmitter_id = $2
            AND accepted_at IS NULL
            AND deleted_at IS NULL
        RETURNING TRUE as "updated"
    ),
    inserted_notification AS (
        INSERT INTO notifications (entity_type, entity_id, notifier_id)
        SELECT $3, $1, $1
        WHERE EXISTS (SELECT 1 FROM updated_friend)
        RETURNING id
    )
INSERT INTO
    notification_outs (notified_id, notification_id)
SELECT
    $2, (SELECT id FROM inserted_notification)
WHERE EXISTS (SELECT 1 FROM inserted_notification)
"#,
    )
    .bind(receiver_id)
    .bind(transmitter_id)
    .bind(NotificationEntityType::FriendReqAccept as i16)
    .execute(&data.db_pool)
    .await?
    .rows_affected()
    {
        0 => Err(ToastErrorResponse::new(None, "Friend request not found").into()),
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
    use time::OffsetDateTime;

    #[sqlx::test(fixtures("friend_request"))]
    async fn can_accept_a_friend_request(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Receive a friend request.
        let insert_result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/friend-requests/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Friend request should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT accepted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("accepted_at")
                .is_some()
        );

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

        Ok(())
    }

    #[sqlx::test(fixtures("friend_request"))]
    async fn should_not_accept_a_soft_deleted_friend_request(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Receive a soft-deleted friend request.
        let insert_result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id, deleted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Try accepting the friend request.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/friend-requests/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Friend request not found").await;

        // Recover the friend request.
        let result = sqlx::query(
            r#"
UPDATE friends
SET deleted_at = NULL
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Try accepting the friend request again.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/friend-requests/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        Ok(())
    }

    #[sqlx::test(fixtures("friend_request"))]
    async fn should_not_accept_an_already_accepted_friend_request(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Receive a friend request.
        let insert_result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Accept the friend request for the first time.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/friend-requests/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Try accepting the friend request again.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/friend-requests/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Friend request not found").await;

        Ok(())
    }
}
