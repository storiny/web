use crate::{
    error::AppError, error::FormErrorResponse, middleware::identity::identity::Identity,
    user_def::v1::StatusDuration, AppState,
};
use actix_web::{post, web, HttpResponse};
use actix_web_validator::Json;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use time::{Duration, OffsetDateTime};
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(length(min = 0, max = 128, message = "Invalid status text length"))]
    status_text: Option<String>,
    #[validate(length(min = 0, max = 64, message = "Invalid status emoji"))]
    status_emoji: Option<String>,
    #[validate(range(min = 1, max = 5, message = "Invalid status duration"))]
    duration: i32,
    #[validate(range(min = 1, max = 3, message = "Invalid status visibility"))]
    visibility: i32,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct Response {
    duration: i16,
    emoji: Option<String>,
    text: Option<String>,
    expires_at: Option<OffsetDateTime>,
    visibility: i16,
}

#[post("/v1/me/status")]
async fn post(
    payload: Json<Request>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => {
            let status_text = payload.status_text.clone().unwrap_or_default();
            let status_emoji = payload.status_emoji.clone().unwrap_or_default();

            if status_emoji.is_empty() && status_text.is_empty() {
                return Ok(
                    HttpResponse::BadRequest().json(FormErrorResponse::new(vec![vec![
                        "status_text".to_string(),
                        "Cannot set an empty status".to_string(),
                    ]])),
                );
            }

            // Delete previous status
            sqlx::query(
                r#"
                DELETE FROM user_statuses
                WHERE user_id = $1
                "#,
            )
            .bind(user_id)
            .execute(&data.db_pool)
            .await
            .unwrap();

            let status_duration = match StatusDuration::try_from((&payload.duration).clone())
                .unwrap_or(StatusDuration::Day1)
            {
                StatusDuration::Day1 => Some(OffsetDateTime::now_utc() + Duration::days(1)),
                StatusDuration::Hr4 => Some(OffsetDateTime::now_utc() + Duration::hours(4)),
                StatusDuration::Min60 => Some(OffsetDateTime::now_utc() + Duration::hours(1)),
                StatusDuration::Min30 => Some(OffsetDateTime::now_utc() + Duration::minutes(30)),
                _ => None,
            };

            let result = sqlx::query_as::<_, Response>(
                r#"
                INSERT INTO user_statuses(user_id, text, emoji, duration, visibility, expires_at)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING duration, emoji, text, visibility, expires_at
                "#,
            )
            .bind(user_id)
            .bind(status_text)
            .bind(&payload.status_emoji)
            .bind(&payload.duration)
            .bind(&payload.visibility)
            .bind(status_duration)
            .fetch_one(&data.db_pool)
            .await
            .unwrap();

            Ok(HttpResponse::Created().json(result))
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
    use crate::test_utils::assert_form_error_response;
    use crate::{test_utils::init_app_for_test, user_def::v1::StatusVisibility};
    use actix_web::test;
    use sqlx::{PgPool, Row};

    #[sqlx::test]
    async fn can_set_a_status(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/status")
            .set_json(Request {
                status_text: Some("Some status text".to_string()),
                status_emoji: Some("1f90c".to_string()),
                duration: StatusDuration::Day1.into(),
                visibility: StatusVisibility::Global.into(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Status should be present in the database
        let result = sqlx::query(
            r#"
            SELECT EXISTS(
                SELECT 1 FROM user_statuses
                WHERE user_id = $1
            )
            "#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_set_status_expiration_time(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/status")
            .set_json(Request {
                status_text: Some("Some status text".to_string()),
                status_emoji: Some("1f90c".to_string()),
                duration: StatusDuration::Hr4.into(),
                visibility: StatusVisibility::Global.into(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let result = sqlx::query(
            r#"
            SELECT expires_at FROM user_statuses
            WHERE user_id = $1
            "#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result
            .get::<Option<OffsetDateTime>, _>("expires_at")
            .is_some());

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_status_when_both_text_and_emoji_are_empty(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/status")
            .set_json(Request {
                status_text: Some("".to_string()),
                status_emoji: Some("".to_string()),
                duration: StatusDuration::Day1.into(),
                visibility: StatusVisibility::Global.into(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(
            res,
            vec![vec![
                "status_text".to_string(),
                "Cannot set an empty status".to_string(),
            ]],
        )
        .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_delete_previous_status_before_inserting_a_new_row(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false).await;

        // Insert status for the first time
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/status")
            .set_json(Request {
                status_text: Some("Some status text".to_string()),
                status_emoji: Some("1f90c".to_string()),
                duration: StatusDuration::Day1.into(),
                visibility: StatusVisibility::Global.into(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Insert status again
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/status")
            .set_json(Request {
                status_text: Some("New status text".to_string()),
                status_emoji: Some("1f90c".to_string()),
                duration: StatusDuration::Day1.into(),
                visibility: StatusVisibility::Global.into(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // New status should be present in the database
        let result = sqlx::query(
            r#"
            SELECT text FROM user_statuses
            WHERE user_id = $1
            "#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<String, _>("text"), "New status text");

        Ok(())
    }
}
