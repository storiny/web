use crate::{
    constants::account_activity_type::AccountActivityType,
    error::{
        AppError,
        ToastErrorResponse,
    },
    grpc::defs::token_def::v1::TokenType,
    middlewares::identity::identity::Identity,
    utils::clear_user_sessions::clear_user_sessions,
    AppState,
};
use actix_web::{
    post,
    web,
    HttpResponse,
};
use actix_web_validator::Json;
use argon2::{
    password_hash::{
        rand_core::OsRng,
        SaltString,
    },
    Argon2,
    PasswordHash,
    PasswordHasher,
    PasswordVerifier,
};
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::Row;
use time::OffsetDateTime;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(length(equal = 6, message = "Invalid verification code"))]
    verification_code: String,
    #[validate(length(min = 6, max = 64, message = "Invalid password length"))]
    new_password: String,
}

#[post("/v1/me/settings/password/add")]
#[tracing::instrument(
    name = "POST /v1/me/settings/password/add",
    skip_all,
    fields(user = user.id().ok()),
    err
)]
async fn post(
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

    if user_password.is_some() {
        return Err(ToastErrorResponse::new(None, "You have already set a password").into());
    }

    let token = sqlx::query(
        r#"
SELECT id, expires_at FROM tokens
WHERE type = $1 AND user_id = $2
"#,
    )
    .bind(TokenType::PasswordAdd as i16)
    .bind(user_id)
    .fetch_one(&mut *txn)
    .await
    .map_err(|error| {
        if matches!(error, sqlx::Error::RowNotFound) {
            AppError::ToastError(ToastErrorResponse::new(None, "Invalid verification code"))
        } else {
            AppError::SqlxError(error)
        }
    })?;

    let token_id = token.get::<String, _>("id");
    let token_hash = PasswordHash::new(&token_id).map_err(|error| {
        AppError::InternalError(format!("unable to parse the token hash: {error:?}"))
    })?;

    // Validate the token.
    Argon2::default()
        .verify_password(payload.verification_code.as_bytes(), &token_hash)
        .map_err(|_| {
            AppError::ToastError(ToastErrorResponse::new(None, "Invalid verification code"))
        })?;

    // Check whether the verification code has expired.
    {
        let expires_at = token.get::<OffsetDateTime, _>("expires_at");

        if expires_at < OffsetDateTime::now_utc() {
            return Err(ToastErrorResponse::new(None, "Verification code has expired").into());
        }
    }

    let salt = SaltString::generate(&mut OsRng);
    let hashed_password = Argon2::default()
        .hash_password(payload.new_password.as_bytes(), &salt)
        .map_err(|error| AppError::from(format!("unable to generate password hash: {error:?}")))?;

    // Delete the verification token and update the user's password.
    sqlx::query(
        r#"
WITH deleted_token AS (
    DELETE FROM tokens
    WHERE id = $3
)
UPDATE users
SET password = $1
WHERE id = $2
"#,
    )
    .bind(hashed_password.to_string())
    .bind(user_id)
    .bind(token.get::<String, _>("id"))
    .execute(&mut *txn)
    .await?;

    // Add a password-add account activity.
    sqlx::query(
        r#"
INSERT INTO account_activities (type, description, user_id)
VALUES ($1, 'You added a password to your account.', $2)
"#,
    )
    .bind(AccountActivityType::Password as i16)
    .bind(user_id)
    .execute(&mut *txn)
    .await?;

    // Log the user out and destroy all the sessions.
    clear_user_sessions(&data.redis, user_id).await?;
    user.logout();

    txn.commit().await?;

    Ok(HttpResponse::NoContent().finish())
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
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
    use nanoid::nanoid;
    use sqlx::{
        PgPool,
        Row,
    };
    use time::Duration;

    #[sqlx::test]
    async fn can_add_a_password(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;
        let verification_code = nanoid!(6);
        let salt = SaltString::generate(&mut OsRng);
        let hashed_verification_code = Argon2::default()
            .hash_password(verification_code.as_bytes(), &salt)
            .unwrap();

        // Insert a password-add verification token.
        sqlx::query(
            r#"
INSERT INTO tokens (id, type, user_id, expires_at)
VALUES ($1, $2, $3, $4)
"#,
        )
        .bind(hashed_verification_code.to_string())
        .bind(TokenType::PasswordAdd as i16)
        .bind(user_id.unwrap())
        .bind(OffsetDateTime::now_utc() + Duration::days(1)) // 24 hours
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/password/add")
            .set_json(Request {
                new_password: "new_password".to_string(),
                verification_code: verification_code.clone(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Password should get updated in the database.
        let user = sqlx::query(
            r#"
SELECT password FROM users
WHERE id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            Argon2::default()
                .verify_password(
                    "new_password".as_bytes(),
                    &PasswordHash::new(&user.get::<String, _>("password")).unwrap(),
                )
                .is_ok()
        );

        // Token should get deleted from the database.
        let token = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM tokens
    WHERE id = $1
)
"#,
        )
        .bind(hashed_verification_code.to_string())
        .fetch_one(&mut *conn)
        .await?;

        assert!(!token.get::<bool, _>("exists"));

        // Should also insert an account activity.
        let result = sqlx::query(
            r#"
SELECT description FROM account_activities
WHERE user_id = $1 AND type = $2
"#,
        )
        .bind(user_id.unwrap())
        .bind(AccountActivityType::Password as i16)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("description"),
            "You added a password to your account.".to_string()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_an_add_password_request_for_an_account_with_existing_password(
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
            .uri("/v1/me/settings/password/add")
            .set_json(Request {
                new_password: "new_password".to_string(),
                verification_code: "000000".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "You have already set a password").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_an_add_password_request_for_an_expired_verification_code(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        let verification_code = nanoid!(6);
        let salt = SaltString::generate(&mut OsRng);
        let hashed_verification_code = Argon2::default()
            .hash_password(verification_code.as_bytes(), &salt)
            .unwrap();

        // Insert a password-add verification token.
        let token_result = sqlx::query(
            r#"
INSERT INTO tokens (id, type, user_id, expires_at)
VALUES ($1, $2, $3, $4)
"#,
        )
        .bind(hashed_verification_code.to_string())
        .bind(TokenType::PasswordAdd as i16)
        .bind(user_id.unwrap())
        .bind(OffsetDateTime::now_utc() - Duration::days(1)) // The token expired yesterday
        .execute(&mut *conn)
        .await?;

        assert_eq!(token_result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/password/add")
            .set_json(Request {
                new_password: "new_password".to_string(),
                verification_code,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Verification code has expired").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_an_add_password_request_for_an_invalid_verification_code(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/password/add")
            .set_json(Request {
                new_password: "new_password".to_string(),
                verification_code: nanoid!(6).to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Invalid verification code").await;

        Ok(())
    }
}
