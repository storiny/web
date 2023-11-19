use crate::{
    error::AppError,
    middleware::identity::identity::Identity,
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
async fn post(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => match path.notification_id.parse::<i64>() {
            Ok(notification_id) => {
                match sqlx::query(
                    r#"
                    UPDATE notification_outs
                    SET read_at = now()
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
                    0 => Ok(HttpResponse::BadRequest().body("Notification not found")),
                    _ => Ok(HttpResponse::NoContent().finish()),
                }
            }
            Err(_) => Ok(HttpResponse::BadRequest().body("Invalid notification ID")),
        },
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
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
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false).await;

        // Receive a notification
        let insert_result = sqlx::query(
            r#"
            INSERT INTO notification_outs(notified_id, notification_id)
            VALUES ($1, $2)
            RETURNING read_at
            "#,
        )
        .bind(user_id.unwrap())
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        // `read_at` should be NULL initially
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("read_at")
                .is_none()
        );

        // Mark the notification as read
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/notifications/{}/read", 4))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // `read_at` should get updated in the database
        let asset = sqlx::query(
            r#"
            SELECT read_at FROM notification_outs
            WHERE notified_id = $1 AND notification_id = $2
            "#,
        )
        .bind(user_id.unwrap())
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(asset.get::<Option<OffsetDateTime>, _>("read_at").is_some());

        Ok(())
    }

    #[sqlx::test(fixtures("notification"))]
    async fn can_handle_a_missing_notification(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false).await;

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
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false).await;

        // Receive a notification
        let insert_result = sqlx::query(
            r#"
            INSERT INTO notification_outs(notified_id, notification_id)
            VALUES ($1, $2)
            RETURNING read_at
            "#,
        )
        .bind(user_id.unwrap())
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        // `read_at` should be NULL initially
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("read_at")
                .is_none()
        );

        // Mark the notification as read
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/notifications/{}/read", 4))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Try marking the notification as read again
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/notifications/{}/read", 4))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should not throw
        assert!(res.status().is_success());

        Ok(())
    }
}
