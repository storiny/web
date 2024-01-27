use crate::{
    error::{
        AppError,
        FormErrorResponse,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    utils::generate_totp::generate_totp,
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
use sqlx::Row;
use totp_rs::Secret;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(length(equal = 6, message = "Invalid verification code"))]
    code: String,
}

#[post("/v1/me/settings/mfa/remove")]
#[tracing::instrument(
    name = "POST /v1/me/settings/mfa/remove",
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

    let user = sqlx::query(
        r#"
SELECT
    username,
    mfa_enabled,
    mfa_secret
FROM users
WHERE id = $1
"#,
    )
    .bind(user_id)
    .fetch_one(&mut *txn)
    .await?;

    let mfa_secret = user.get::<Option<String>, _>("mfa_secret");

    if !user.get::<bool, _>("mfa_enabled") || mfa_secret.is_none() {
        return Err(ToastErrorResponse::new(
            None,
            "2-factor authentication is not enabled for your account",
        )
        .into());
    }

    let mfa_secret = mfa_secret.unwrap_or_default();

    let secret_as_bytes = Secret::Encoded(mfa_secret).to_bytes().map_err(|error| {
        AppError::InternalError(format!("unable to parse totp secret: {error:?}"))
    })?;

    let totp =
        generate_totp(secret_as_bytes, &user.get::<String, _>("username")).map_err(|error| {
            AppError::InternalError(format!("unable to generate a totp instance: {error:?}"))
        })?;

    let is_valid = totp.check_current(&payload.code).map_err(|error| {
        AppError::InternalError(format!("unable to check totp code: {error:?}"))
    })?;

    if !is_valid {
        return Err(
            FormErrorResponse::new(None, vec![("code", "Invalid verification code")]).into(),
        );
    }

    // Disable MFA for the user.
    sqlx::query(
        r#"
WITH deleted_recovery_codes AS (
    DELETE FROM mfa_recovery_codes
    WHERE user_id = $1
)
UPDATE users
SET
    mfa_enabled = FALSE,
    mfa_secret = NULL
WHERE id = $1
"#,
    )
    .bind(user_id)
    .execute(&mut *txn)
    .await?;

    txn.commit().await?;

    Ok(HttpResponse::Ok().finish())
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
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
    use sqlx::PgPool;
    use totp_rs::Secret;

    #[sqlx::test]
    async fn can_remove_mfa(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;
        let mfa_secret = Secret::generate_secret();

        // Insert the user.
        let result = sqlx::query(
            r#"
INSERT INTO users
    (id, name, username, email, password, mfa_enabled, mfa_secret)
VALUES
    ($1, $2, $3, $4, $5, TRUE, $6)
"#,
        )
        .bind(user_id.unwrap())
        .bind("Sample user")
        .bind("sample_user")
        .bind("sample@example.com")
        .bind("sample_hashed_password")
        .bind(mfa_secret.to_encoded().to_string())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Insert a recovery code.
        let result = sqlx::query(
            r#"
INSERT INTO mfa_recovery_codes(code, user_id)
VALUES ($1, $2)
"#,
        )
        .bind("0".repeat(12))
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Generate a TOTP instance for verification code.
        let totp = generate_totp(mfa_secret.to_bytes().unwrap(), "sample_user").unwrap();

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/mfa/remove")
            .set_json(Request {
                code: totp.generate_current().unwrap(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Should update `mfa_enabled` and `mfa_secret` in the database.
        let result = sqlx::query(
            r#"
SELECT mfa_enabled, mfa_secret FROM users
WHERE id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("mfa_enabled"));
        assert!(result.get::<Option<String>, _>("mfa_secret").is_none());

        // Should also delete recovery codes.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM mfa_recovery_codes
    WHERE user_id = $1
)
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_remove_mfa_request_for_a_user_with_mfa_disabled(
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
        .bind("sample@example.com")
        .bind("sample_hashed_password")
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/mfa/remove")
            .set_json(Request {
                code: "000000".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(
            res,
            "2-factor authentication is not enabled for your account",
        )
        .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_remove_mfa_request_for_an_invalid_verification_code(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;
        let mfa_secret = Secret::generate_secret();

        // Insert the user.
        let result = sqlx::query(
            r#"
INSERT INTO users
    (id, name, username, email, password, mfa_enabled, mfa_secret)
VALUES
    ($1, $2, $3, $4, $5, TRUE, $6)
"#,
        )
        .bind(user_id.unwrap())
        .bind("Sample user")
        .bind("sample_user")
        .bind("sample@example.com")
        .bind("sample_hashed_password")
        .bind(mfa_secret.to_encoded().to_string())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/mfa/remove")
            .set_json(Request {
                code: "000000".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(res, vec![("code", "Invalid verification code")]).await;

        Ok(())
    }
}
