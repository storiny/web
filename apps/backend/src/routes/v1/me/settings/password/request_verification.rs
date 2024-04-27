use crate::{
    amqp::consumers::templated_email::{
        TemplatedEmailMessage,
        TEMPLATED_EMAIL_QUEUE_NAME,
    },
    constants::email_template::EmailTemplate,
    error::{
        AppError,
        ToastErrorResponse,
    },
    grpc::defs::token_def::v1::TokenType,
    middlewares::identity::identity::Identity,
    models::email_templates::password_add_verification::PasswordAddVerificationEmailTemplateData,
    AppState,
};
use actix_web::{
    post,
    web,
    HttpResponse,
};
use argon2::{
    password_hash::SaltString,
    Argon2,
    PasswordHasher,
};
use chrono::{
    Datelike,
    Local,
};
use deadpool_lapin::lapin::{
    options::BasicPublishOptions,
    BasicProperties,
};
use nanoid::nanoid;
use sqlx::Row;
use time::{
    Duration,
    OffsetDateTime,
};

/// Generates a random 6-digit numeric verification code.
fn generate_verification_code() -> String {
    let character_set: [char; 10] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    nanoid!(6, &character_set)
}

#[post("/v1/me/settings/password/add/request-verification")]
#[tracing::instrument(
    name = "POST /v1/me/settings/password/add/request-verification",
    skip_all,
    fields(user = user.id().ok()),
    err
)]
async fn post(data: web::Data<AppState>, user: Identity) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    let user = sqlx::query(
        r#"
SELECT
    email::TEXT,
    password
FROM users
WHERE id = $1
"#,
    )
    .bind(user_id)
    .fetch_one(&mut *txn)
    .await?;

    let user_password = user.get::<Option<String>, _>("password");

    if user_password.is_some() {
        return Err(ToastErrorResponse::new(None, "You have already set a password").into());
    }

    let verification_code = generate_verification_code();

    let salt = SaltString::from_b64(&data.config.token_salt)
        .map_err(|error| AppError::InternalError(error.to_string()))?;

    let hashed_verification_code = Argon2::default()
        .hash_password(verification_code.as_bytes(), &salt)
        .map_err(|error| {
            AppError::InternalError(format!("unable to hash the verification code: {error:?}"))
        })?;

    // Delete previous password-add verification tokens and insert a new one.
    sqlx::query(
        r#"
WITH deleted_tokens AS (
    DELETE FROM tokens
    WHERE
        type = $2
        AND user_id = $3
)
INSERT INTO tokens (id, type, user_id, expires_at)
VALUES ($1, $2, $3, $4)
"#,
    )
    .bind(hashed_verification_code.to_string())
    .bind(TokenType::PasswordAdd as i16)
    .bind(user_id)
    .bind(OffsetDateTime::now_utc() + Duration::days(1)) // 24 hours
    .execute(&mut *txn)
    .await?;

    let template_data = serde_json::to_string(&PasswordAddVerificationEmailTemplateData {
        verification_code,
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
            destination: user.get::<String, _>("email"),
            template: EmailTemplate::PasswordAddVerification.to_string(),
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
    use crate::{
        config::get_app_config,
        test_utils::{
            assert_toast_error_response,
            init_app_for_test,
        },
        utils::generate_hashed_token::generate_hashed_token,
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test]
    async fn can_request_password_setup_verification(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/password/add/request-verification")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Should insert a password-add verification token into the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM tokens
    WHERE type = $1    
)
"#,
        )
        .bind(TokenType::PasswordAdd as i16)
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_an_add_password_verification_request_for_an_account_with_existing_password(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

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
        .bind("sample_hashed_password")
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/password/add/request-verification")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "You have already set a password").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_delete_previous_password_setup_verification_tokens_for_the_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;
        let config = get_app_config().unwrap();
        let (_, hashed_token) = generate_hashed_token(&config.token_salt).unwrap();

        // Insert a password-add verification token.
        let result = sqlx::query(
            r#"
INSERT INTO tokens (id, type, user_id, expires_at)
VALUES ($1, $2, $3, $4)
"#,
        )
        .bind(&hashed_token)
        .bind(TokenType::PasswordAdd as i16)
        .bind(user_id.unwrap())
        .bind(OffsetDateTime::now_utc() + Duration::days(1)) // 24 hours
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/password/add/request-verification")
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
