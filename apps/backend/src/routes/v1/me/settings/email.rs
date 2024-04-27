use crate::{
    amqp::consumers::templated_email::{
        TemplatedEmailMessage,
        TEMPLATED_EMAIL_QUEUE_NAME,
    },
    constants::{
        account_activity_type::AccountActivityType,
        email_template::EmailTemplate,
    },
    error::{
        AppError,
        FormErrorResponse,
        ToastErrorResponse,
    },
    grpc::defs::token_def::v1::TokenType,
    middlewares::identity::identity::Identity,
    models::email_templates::new_email_verification::NewEmailVerificationEmailTemplateData,
    utils::{
        clear_user_sessions::clear_user_sessions,
        generate_hashed_token::generate_hashed_token,
    },
    AppState,
};
use actix_http::StatusCode;
use actix_web::{
    patch,
    web,
    HttpResponse,
};
use actix_web_validator::Json;
use argon2::{
    Argon2,
    PasswordHash,
    PasswordVerifier,
};
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
    new_email: String,
    #[validate(length(min = 6, max = 64, message = "Invalid password length"))]
    current_password: String,
}

#[patch("/v1/me/settings/email")]
#[tracing::instrument(
    name = "PATCH /v1/me/settings/email",
    skip_all,
    fields(
        user = user.id().ok(),
        new_email = %payload.new_email
    ),
    err
)]
async fn patch(
    payload: Json<Request>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    let db_user = sqlx::query(
        r#"
SELECT password FROM users
WHERE id = $1
"#,
    )
    .bind(user_id)
    .fetch_one(&mut *txn)
    .await?;

    let user_password = db_user.get::<Option<String>, _>("password");

    if user_password.is_none() {
        return Err(ToastErrorResponse::new(
            None,
            "You need to set a password to change your e-mail",
        )
        .into());
    }

    // Validate the current password.
    {
        let user_password = user_password.unwrap_or_default();
        let password_hash = PasswordHash::new(&user_password)
            .map_err(|error| AppError::InternalError(error.to_string()))?;

        Argon2::default()
            .verify_password(payload.current_password.as_bytes(), &password_hash)
            .map_err(|_| {
                AppError::FormError(FormErrorResponse::new(
                    Some(StatusCode::FORBIDDEN),
                    vec![("current_password", "Invalid password")],
                ))
            })?;
    }

    // Token ID for verification email.
    let (token_id, hashed_token) = generate_hashed_token(&data.config.token_salt)?;

    match sqlx::query(
        r#"
WITH updated_user AS (
    UPDATE users
    SET
        email = $2,
        email_verified = FALSE
    WHERE id = $1
),
inserted_token AS (
    INSERT INTO tokens (id, type, user_id, expires_at)
    VALUES ($4, $5, $1, $6)
)
INSERT INTO account_activities (type, description, user_id)
VALUES ($3, 'You changed your e-mail address to <m>' || $2 || '</m>', $1)
"#,
    )
    .bind(user_id)
    .bind(&payload.new_email)
    .bind(AccountActivityType::Email as i16)
    .bind(&hashed_token)
    .bind(TokenType::EmailVerification as i16)
    .bind(OffsetDateTime::now_utc() + Duration::days(1)) // 24 hours
    .execute(&mut *txn)
    .await
    {
        Ok(_) => {
            // Log the user out and destroy all the sessions so that the user is forced to the auth
            // screen and needs to verify the new e-mail address.
            clear_user_sessions(&data.redis, user_id).await?;
            user.logout();

            // Push an email verification job.

            let verification_link = format!(
                "{}/auth/verify-email/{}",
                data.config.web_server_url, token_id
            );

            let template_data = serde_json::to_string(&NewEmailVerificationEmailTemplateData {
                link: verification_link,
                copyright_year: Local::now().year().to_string(),
            })
            .map_err(|error| {
                AppError::InternalError(format!("unable to serialize the template data: {error:?}"))
            })?;

            // Publish a message for the email verification job.
            {
                let channel = {
                    let lapin = &data.lapin;
                    let connection = lapin.get().await?;
                    connection.create_channel().await?
                };

                let message = serde_json::to_vec(&TemplatedEmailMessage {
                    destination: payload.new_email.to_string(),
                    template: EmailTemplate::NewEmailVerification.to_string(),
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

            Ok(HttpResponse::NoContent().finish())
        }
        Err(error) => {
            if let Some(db_err) = error.as_database_error() {
                // Check whether the new email is already in use.
                if matches!(db_err.kind(), sqlx::error::ErrorKind::UniqueViolation) {
                    return Err(AppError::FormError(FormErrorResponse::new(
                        Some(StatusCode::CONFLICT),
                        vec![("new_email", "This e-mail is already in use")],
                    )));
                }
            }

            Err(AppError::SqlxError(error))
        }
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(patch);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_form_error_response,
        assert_toast_error_response,
        init_app_for_test,
    };
    use actix_web::test;
    use argon2::{
        password_hash::{
            rand_core::OsRng,
            SaltString,
        },
        PasswordHasher,
    };
    use sqlx::{
        PgPool,
        Row,
    };

    /// Returns a sample hashed password.
    fn get_sample_password() -> (String, String) {
        let password = "sample";
        let salt = SaltString::generate(&mut OsRng);
        let password_hash = Argon2::default()
            .hash_password(password.as_bytes(), &salt)
            .unwrap()
            .to_string();

        (password_hash, password.to_string())
    }

    #[sqlx::test]
    async fn can_update_email(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, true, Some(1_i64)).await;
        let (password_hash, password) = get_sample_password();

        // Insert the user.
        let result = sqlx::query(
            r#"
INSERT INTO users (id, name, username, email, password)
VALUES ($1, $2, $3, $4, $5)
"#,
        )
        .bind(user_id.unwrap())
        .bind("Sample user")
        .bind("sample_user")
        .bind("old@example.com")
        .bind(password_hash)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/email")
            .set_json(Request {
                new_email: "new@example.com".to_string(),
                current_password: password.to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Email should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT email::TEXT, email_verified FROM users
WHERE id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("email"),
            "new@example.com".to_string()
        );
        assert!(!result.get::<bool, _>("email_verified"));

        // Should also insert an account activity.
        let result = sqlx::query(
            r#"
SELECT description FROM account_activities
WHERE user_id = $1 AND type = $2
"#,
        )
        .bind(user_id.unwrap())
        .bind(AccountActivityType::Email as i16)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("description"),
            "You changed your e-mail address to <m>new@example.com</m>".to_string()
        );

        // Should also insert an e-mail verification token.
        let token = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM tokens
    WHERE type = $1
)
"#,
        )
        .bind(TokenType::EmailVerification as i16)
        .fetch_one(&mut *conn)
        .await?;

        assert!(token.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_an_update_email_request_for_a_user_without_password(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(patch, pool, true, false, None).await;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/email")
            .set_json(Request {
                new_email: "sample@example.com".to_string(),
                current_password: "sample".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "You need to set a password to change your e-mail").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_an_update_email_request_for_invalid_password(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, true, Some(1_i64)).await;

        let (password_hash, _) = get_sample_password();

        // Insert the user.
        let result = sqlx::query(
            r#"
INSERT INTO users (id, name, username, email, password)
VALUES ($1, $2, $3, $4, $5)
"#,
        )
        .bind(user_id.unwrap())
        .bind("Sample user")
        .bind("sample_user")
        .bind("sample@example.com")
        .bind(password_hash)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/email")
            .set_json(Request {
                new_email: "new@example.com".to_string(),
                current_password: "invalid".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(res, vec![("current_password", "Invalid password")]).await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_an_update_email_request_for_a_duplicate_email(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, true, Some(1_i64)).await;
        let (password_hash, password) = get_sample_password();

        // Insert the user.
        let result = sqlx::query(
            r#"
INSERT INTO users (id, name, username, email, password)
VALUES ($1, $2, $3, $4, $5)
"#,
        )
        .bind(user_id.unwrap())
        .bind("Sample user 1")
        .bind("sample_user_1")
        .bind("old@example.com")
        .bind(password_hash)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Insert another user.
        let result = sqlx::query(
            r#"
INSERT INTO users (id, name, username, email)
VALUES ($1, $2, $3, $4)
"#,
        )
        .bind(2_i64)
        .bind("Sample user 2")
        .bind("sample_user_2")
        .bind("new@example.com")
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/email")
            .set_json(Request {
                new_email: "new@example.com".to_string(),
                current_password: password.to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(res, vec![("new_email", "This e-mail is already in use")]).await;

        // Should not insert an account activity.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM account_activities
    WHERE user_id = $1 AND type = $2
)
"#,
        )
        .bind(user_id.unwrap())
        .bind(AccountActivityType::Email as i16)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }
}
