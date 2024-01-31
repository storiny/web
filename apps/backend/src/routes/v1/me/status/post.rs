use crate::{
    error::{
        AppError,
        FormErrorResponse,
    },
    grpc::defs::user_def::v1::StatusDuration,
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_web::{
    post,
    web,
    HttpResponse,
};
use actix_web_validator::Json;
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::FromRow;
use time::{
    Duration,
    OffsetDateTime,
};
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
    #[serde(with = "crate::iso8601::time::option")]
    expires_at: Option<OffsetDateTime>,
    visibility: i16,
}

#[post("/v1/me/status")]
#[tracing::instrument(
    name = "POST /v1/me/status",
    skip_all,
    fields(
        user_id = user.id().ok(),
        payload
    ),
    err
)]
async fn post(
    payload: Json<Request>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;

    let status_text = payload.status_text.clone().unwrap_or_default();
    let status_emoji = payload.status_emoji.clone().unwrap_or_default();

    if status_emoji.is_empty() && status_text.is_empty() {
        return Err(FormErrorResponse::new(
            None,
            vec![("status_text", "Cannot set an empty status")],
        )
        .into());
    }

    // Validate the emoji.
    match emojis::get(status_emoji.as_str()) {
        Some(_) => {}
        None => {
            return Err(
                FormErrorResponse::new(None, vec![("status_text", "Invalid emoji")]).into(),
            );
        }
    };

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    // Delete the previous status.
    sqlx::query(
        r#"
DELETE FROM user_statuses
WHERE user_id = $1
"#,
    )
    .bind(user_id)
    .execute(&mut *txn)
    .await?;

    let status_duration =
        match StatusDuration::try_from(payload.duration).unwrap_or(StatusDuration::Day1) {
            StatusDuration::Day1 => Some(OffsetDateTime::now_utc() + Duration::days(1)),
            StatusDuration::Hr4 => Some(OffsetDateTime::now_utc() + Duration::hours(4)),
            StatusDuration::Min60 => Some(OffsetDateTime::now_utc() + Duration::hours(1)),
            StatusDuration::Min30 => Some(OffsetDateTime::now_utc() + Duration::minutes(30)),
            _ => None,
        };

    let result = sqlx::query_as::<_, Response>(
        r#"
INSERT INTO user_statuses
    (user_id, text, emoji, duration, visibility, expires_at)
VALUES
    ($1, $2, $3, $4, $5, $6)
RETURNING duration, emoji, text, visibility, expires_at
"#,
    )
    .bind(user_id)
    .bind(&status_text)
    .bind(&payload.status_emoji)
    .bind(payload.duration)
    .bind(payload.visibility)
    .bind(status_duration)
    .fetch_one(&mut *txn)
    .await?;

    txn.commit().await?;

    Ok(HttpResponse::Created().json(result))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        grpc::defs::user_def::v1::StatusVisibility,
        test_utils::{
            assert_form_error_response,
            init_app_for_test,
        },
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test]
    async fn can_set_a_status(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/status")
            .set_json(Request {
                status_text: Some("Some status text".to_string()),
                status_emoji: Some("🌿".to_string()),
                duration: StatusDuration::Day1.into(),
                visibility: StatusVisibility::Global.into(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Status should be present in the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
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
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/status")
            .set_json(Request {
                status_text: Some("Some status text".to_string()),
                status_emoji: Some("🌿".to_string()),
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

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("expires_at")
                .is_some()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_an_invalid_emoji(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/status")
            .set_json(Request {
                status_text: Some("".to_string()),
                status_emoji: Some("invalid".to_string()),
                duration: StatusDuration::Day1.into(),
                visibility: StatusVisibility::Global.into(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(res, vec![("status_text", "Invalid emoji")]).await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_status_request_when_both_the_text_and_emoji_are_empty(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

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
        assert_form_error_response(res, vec![("status_text", "Cannot set an empty status")]).await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_delete_the_previous_status_before_inserting_a_new_one(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Insert status for the first time.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/status")
            .set_json(Request {
                status_text: Some("Some status text".to_string()),
                status_emoji: Some("🌿".to_string()),
                duration: StatusDuration::Day1.into(),
                visibility: StatusVisibility::Global.into(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Insert status again.
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/status")
            .set_json(Request {
                status_text: Some("New status text".to_string()),
                status_emoji: Some("🌿".to_string()),
                duration: StatusDuration::Day1.into(),
                visibility: StatusVisibility::Global.into(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // New status should be present in the database.
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
