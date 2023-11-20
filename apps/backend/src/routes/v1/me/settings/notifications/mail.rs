use crate::{
    error::AppError,
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_web::{
    patch,
    web,
    HttpResponse,
};
use actix_web_validator::Json;
use serde::{
    Deserialize,
    Serialize,
};
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    features_and_updates: bool,
    login_activity: bool,
    newsletters: bool,
    digest: bool,
}

#[patch("/v1/me/settings/notifications/mail")]
async fn patch(
    payload: Json<Request>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => {
            match sqlx::query(
                r#"
                UPDATE notification_settings
                SET
                 	mail_login_activity = $2,
                 	mail_features_and_updates = $3,
                 	mail_newsletters = $4,
                 	mail_suggested_stories = $5    
                WHERE user_id = $1
                "#,
            )
            .bind(user_id)
            .bind(&payload.login_activity)
            .bind(&payload.features_and_updates)
            .bind(&payload.newsletters)
            .bind(&payload.digest)
            .execute(&data.db_pool)
            .await?
            .rows_affected()
            {
                0 => Ok(HttpResponse::InternalServerError().finish()),
                _ => Ok(HttpResponse::NoContent().finish()),
            }
        }
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(patch);
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

    #[sqlx::test]
    async fn can_set_mail_notification_settings(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Disable all e-mail notifications
        let req = test::TestRequest::patch()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/settings/notifications/mail")
            .set_json(Request {
                features_and_updates: false,
                login_activity: false,
                newsletters: false,
                digest: false,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Notification settings should get updated in the database
        let result = sqlx::query(
            r#"
            SELECT
                mail_login_activity,
                mail_features_and_updates,
                mail_newsletters,
                mail_suggested_stories
            FROM notification_settings
            WHERE user_id = $1
            "#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("mail_login_activity"));
        assert!(!result.get::<bool, _>("mail_features_and_updates"));
        assert!(!result.get::<bool, _>("mail_newsletters"));
        assert!(!result.get::<bool, _>("mail_suggested_stories"));

        // Enable all e-mail notifications
        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/notifications/mail")
            .set_json(Request {
                features_and_updates: true,
                login_activity: true,
                newsletters: true,
                digest: true,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Notification settings should get updated in the database
        let result = sqlx::query(
            r#"
            SELECT
                mail_login_activity,
                mail_features_and_updates,
                mail_newsletters,
                mail_suggested_stories
            FROM notification_settings
            WHERE user_id = $1
            "#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("mail_login_activity"));
        assert!(result.get::<bool, _>("mail_features_and_updates"));
        assert!(result.get::<bool, _>("mail_newsletters"));
        assert!(result.get::<bool, _>("mail_suggested_stories"));

        Ok(())
    }
}
