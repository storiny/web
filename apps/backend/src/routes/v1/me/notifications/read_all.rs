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

#[post("/v1/me/notifications/read-all")]
#[tracing::instrument(
    name = "POST /v1/me/notifications/read-all",
    skip_all,
    fields(
        user_id = user.id().ok()
    ),
    err
)]
async fn post(data: web::Data<AppState>, user: Identity) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;

    sqlx::query(
        r#"
UPDATE notification_outs
SET read_at = NOW()
WHERE notified_id = $1
"#,
    )
    .bind(user_id)
    .execute(&data.db_pool)
    .await?;

    Ok(HttpResponse::NoContent().finish())
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::init_app_for_test;
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };
    use time::OffsetDateTime;

    #[sqlx::test(fixtures("notification"))]
    async fn can_mark_all_notifications_as_read(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Receive some notifications.
        let insert_result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id)
VALUES ($1, $2), ($1, $3)
RETURNING read_at
"#,
        )
        .bind(user_id.unwrap())
        .bind(4_i64)
        .bind(5_i64)
        .fetch_all(&mut *conn)
        .await?;

        // `read_at` should be NULL initially.
        assert!(insert_result.iter().all(|notification| {
            notification
                .get::<Option<OffsetDateTime>, _>("read_at")
                .is_none()
        }));

        // Mark all notifications as read.
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/notifications/read-all")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // `read_at` should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT read_at FROM notification_outs
WHERE notified_id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_all(&mut *conn)
        .await?;

        assert!(result.iter().all(|notification| {
            notification
                .get::<Option<OffsetDateTime>, _>("read_at")
                .is_some()
        }));

        Ok(())
    }
}
