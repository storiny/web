use crate::{
    amqp::consumers::templated_email::{
        TemplatedEmailMessage,
        TEMPLATED_EMAIL_QUEUE_NAME,
    },
    constants::{
        email_template::EmailTemplate,
        resource_lock::ResourceLock,
    },
    error::{
        AppError,
        FormErrorResponse,
        ToastErrorResponse,
    },
    grpc::defs::token_def::v1::TokenType,
    models::email_templates::reset_password::ResetPasswordEmailTemplateData,
    utils::{
        generate_hashed_token::generate_hashed_token,
        incr_resource_lock_attempts::incr_resource_lock_attempts,
        is_resource_locked::is_resource_locked,
    },
    AppState,
};
use actix_web::{
    http::StatusCode,
    post,
    web,
    HttpResponse,
};
use actix_web_validator::Json;
use chrono::{
    Datelike,
    Local,
};
use deadpool_lapin::lapin::{
    options::BasicPublishOptions,
    BasicProperties,
};
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::Row;
use time::{
    Duration,
    OffsetDateTime,
};
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(email(message = "Invalid e-mail"))]
    #[validate(length(min = 3, max = 300, message = "Invalid e-mail length"))]
    email: String,
}

#[post("/v1/auth/recovery")]
#[tracing::instrument(
    name = "POST /v1/auth/recovery",
    skip_all,
    fields(
        email = %payload.email,
    ),
    err
)]
async fn post(payload: Json<Request>, data: web::Data<AppState>) -> Result<HttpResponse, AppError> {
    if is_resource_locked(&data.redis, ResourceLock::Recovery, &payload.email).await? {
        return Err(ToastErrorResponse::new(
            Some(StatusCode::TOO_MANY_REQUESTS),
            "Account recovery requests for this email are currently rate-limited. Try again later.",
        )
        .into());
    }

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    let user = sqlx::query(
        r#"
SELECT id FROM users
WHERE email = $1
    AND
        deleted_at IS NULL
        AND deactivated_at IS NULL
"#,
    )
    .bind(&payload.email)
    .fetch_one(&mut *txn)
    .await
    .map_err(|error| {
        if matches!(error, sqlx::Error::RowNotFound) {
            AppError::FormError(FormErrorResponse::new(
                Some(StatusCode::CONFLICT),
                vec![(
                    "email",
                    "Could not find an account associated with this e-mail",
                )],
            ))
        } else {
            AppError::SqlxError(error)
        }
    })?;

    // Generate a new password reset token.
    let (token_id, hashed_token) = generate_hashed_token(&data.config.token_salt)?;

    sqlx::query(
        r#"
WITH deleted_old_tokens AS (
    DELETE FROM tokens
    WHERE type = $2 AND user_id = $3
)
INSERT INTO tokens (id, type, user_id, expires_at)
VALUES ($1, $2, $3, $4)
"#,
    )
    .bind(&hashed_token)
    .bind(TokenType::PasswordReset as i16)
    .bind(user.get::<i64, _>("id"))
    .bind(OffsetDateTime::now_utc() + Duration::days(1)) // 24 hours
    .execute(&mut *txn)
    .await?;

    // Increment the recovery attempts.
    incr_resource_lock_attempts(&data.redis, ResourceLock::Recovery, &payload.email).await?;

    let template_data = serde_json::to_string(&ResetPasswordEmailTemplateData {
        link: format!(
            "{}/auth/reset-password/{}",
            data.config.web_server_url, token_id
        ),
        copyright_year: Local::now().year().to_string(),
    })
    .map_err(|error| {
        AppError::InternalError(format!("unable to serialize the template data: {error:?}"))
    })?;

    // Publish a message for the email.
    {
        let channel = {
            let lapin = &data.lapin;
            let connection = lapin.get().await?;
            connection.create_channel().await?
        };

        let message = serde_json::to_vec(&TemplatedEmailMessage {
            destination: payload.email.to_string(),
            template: EmailTemplate::PasswordReset.to_string(),
            template_data,
        })
        .map_err(|error| {
            AppError::InternalError(format!("unable to serialize the message: {error:?}"))
        })?;

        channel
            .basic_publish(
                "",
                TEMPLATED_EMAIL_QUEUE_NAME,
                BasicPublishOptions::default(),
                &message,
                BasicProperties::default(),
            )
            .await?;
    }

    txn.commit().await?;

    Ok(HttpResponse::Created().finish())
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_form_error_response,
        exceed_resource_lock_attempts,
        get_resource_lock_attempts,
        init_app_for_test,
        RedisTestContext,
    };
    use actix_web::test;
    use sqlx::PgPool;
    use storiny_macros::test_context;

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_an_account_recovery_request_for_an_invalid_email(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let app = init_app_for_test(post, pool, false, false, None).await.0;

        let req = test::TestRequest::post()
            .uri("/v1/auth/recovery")
            .set_json(Request {
                email: "invalid@example.com".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(
            res,
            vec![(
                "email",
                "Could not find an account associated with this e-mail",
            )],
        )
        .await;

        Ok(())
    }

    mod serial {
        use super::*;
        use crate::config::get_app_config;

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("user"))]
        async fn can_handle_account_recovery_request(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let app = init_app_for_test(post, pool, false, false, None).await.0;

            let req = test::TestRequest::post()
                .uri("/v1/auth/recovery")
                .set_json(Request {
                    email: "someone@example.com".to_string(),
                })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Should insert a password reset token into the database.
            let result = sqlx::query(
                r#"
SELECT EXISTS (
    SELECT 1 FROM tokens
    WHERE type = $1    
)
"#,
            )
            .bind(TokenType::PasswordReset as i16)
            .fetch_one(&mut *conn)
            .await?;

            assert!(result.get::<bool, _>("exists"));

            // Should also increment the recovery attempts.
            let result = get_resource_lock_attempts(
                &ctx.redis_pool,
                ResourceLock::Recovery,
                "someone@example.com",
            )
            .await
            .unwrap();

            assert_eq!(result, 1);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_an_account_recovery_request_on_exceeding_the_max_attempts(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let app = init_app_for_test(post, pool, false, false, None).await.0;

            exceed_resource_lock_attempts(
                &ctx.redis_pool,
                ResourceLock::Recovery,
                "someone@example.com",
            )
            .await;

            let req = test::TestRequest::post()
                .uri("/v1/auth/recovery")
                .set_json(Request {
                    email: "someone@example.com".to_string(),
                })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert_eq!(res.status(), StatusCode::TOO_MANY_REQUESTS);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("user"))]
        async fn can_delete_previous_password_reset_tokens_for_the_user(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let app = init_app_for_test(post, pool, false, false, None).await.0;
            let config = get_app_config().unwrap();
            let (_, hashed_token) = generate_hashed_token(&config.token_salt).unwrap();

            // Insert a password reset token.
            let result = sqlx::query(
                r#"
INSERT INTO tokens (id, type, user_id, expires_at)
VALUES ($1, $2, $3, $4)
"#,
            )
            .bind(&hashed_token)
            .bind(TokenType::PasswordReset as i16)
            .bind(1_i64)
            .bind(OffsetDateTime::now_utc() + Duration::days(1)) // 24 hours
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            let req = test::TestRequest::post()
                .uri("/v1/auth/recovery")
                .set_json(Request {
                    email: "someone@example.com".to_string(),
                })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Should delete the previous token.
            let result = sqlx::query(
                r#"
SELECT EXISTS (
    SELECT 1 FROM tokens
    WHERE id = $1
)
"#,
            )
            .bind(&hashed_token)
            .fetch_one(&mut *conn)
            .await?;

            assert!(!result.get::<bool, _>("exists"));

            Ok(())
        }
    }
}
