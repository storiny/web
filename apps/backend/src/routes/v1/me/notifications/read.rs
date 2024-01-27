use crate::{
    error::AppError,
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
    notification_id: String,
}

#[post("/v1/me/notifications/{notification_id}/read")]
#[tracing::instrument(
    name = "POST /v1/me/notifications/{notification_id}/read",
    skip_all,
    fields(
        user_id = user.id().ok(),
        notification_id = %path.notification_id
    ),
    err
)]
async fn post(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let notification_id = path
        .notification_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid notification ID"))?;

    match sqlx::query(
        r#"
UPDATE notification_outs
SET read_at = NOW()
WHERE
    notified_id = $1
    AND notification_id = $2
"#,
    )
    .bind(user_id)
    .bind(notification_id)
    .execute(&data.db_pool)
    .await?
    .rows_affected()
    {
        0 => Err(AppError::from("Notification not found")),
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
        assert_response_body_text,
        init_app_for_test,
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };
    use time::OffsetDateTime;

    #[sqlx::test(fixtures("notification"))]
    async fn can_mark_a_notification_as_read(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Receive a notification.
        let insert_result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id)
VALUES ($1, $2)
RETURNING read_at
"#,
        )
        .bind(user_id.unwrap())
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        // `read_at` should be NULL initially.
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("read_at")
                .is_none()
        );

        // Mark the notification as read.
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/notifications/{}/read", 4))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // `read_at` should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT read_at FROM notification_outs
WHERE notified_id = $1 AND notification_id = $2
"#,
        )
        .bind(user_id.unwrap())
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<Option<OffsetDateTime>, _>("read_at").is_some());

        Ok(())
    }

    #[sqlx::test(fixtures("notification"))]
    async fn can_handle_a_missing_notification(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/notifications/12345/read")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Notification not found").await;

        Ok(())
    }

    #[sqlx::test(fixtures("notification"))]
    async fn should_not_throw_when_the_read_at_column_is_not_modified(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Receive a notification.
        let insert_result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id)
VALUES ($1, $2)
RETURNING read_at
"#,
        )
        .bind(user_id.unwrap())
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        // `read_at` should be NULL initially.
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("read_at")
                .is_none()
        );

        // Mark the notification as read.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/notifications/{}/read", 4))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Try marking the notification as read again.
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/notifications/{}/read", 4))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should not throw.
        assert!(res.status().is_success());

        Ok(())
    }
}
