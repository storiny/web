use crate::{
    error::AppError,
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_web::{
    get,
    web,
    HttpResponse,
};
use sqlx::Row;

#[get("/v1/me/unread-notifications")]
#[tracing::instrument(
    name = "GET /v1/me/unread-notifications",
    skip_all,
    fields(
        user_id = user.id().ok()
    ),
    err
)]
async fn get(data: web::Data<AppState>, user: Identity) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;

    let result = sqlx::query(
        r#"
SELECT COUNT(*) AS "count"
FROM notification_outs
WHERE
    notified_id = $1
    AND read_at IS NULL
"#,
    )
    .bind(user_id)
    .fetch_one(&data.db_pool)
    .await?;

    Ok(HttpResponse::Ok().json(result.get::<i64, _>("count")))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        init_app_for_test,
        res_to_string,
    };
    use actix_web::test;
    use sqlx::PgPool;

    #[sqlx::test(fixtures("unread_notification"))]
    async fn can_return_unread_notification_count(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Receive some notifications.
        let insert_result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id)
VALUES ($1, $2), ($1, $3)
"#,
        )
        .bind(user_id.unwrap())
        .bind(4_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/unread-notifications")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let count = res_to_string(res).await.parse::<i64>();

        assert!(count.is_ok());
        assert_eq!(count.unwrap(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("unread_notification"))]
    async fn should_not_count_read_notifications(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Receive some notifications.
        let insert_result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id)
VALUES ($1, $2), ($1, $3)
"#,
        )
        .bind(user_id.unwrap())
        .bind(4_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/unread-notifications")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should return the notification count initially.
        let count = res_to_string(res).await.parse::<i64>().unwrap();
        assert_eq!(count, 2);

        // Mark the notifications as read.
        let insert_result = sqlx::query(
            r#"
UPDATE notification_outs
SET
    read_at = NOW()
WHERE notified_id = $1
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/unread-notifications")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should return zero.
        let count = res_to_string(res).await.parse::<i64>().unwrap();
        assert_eq!(count, 0);

        Ok(())
    }
}
