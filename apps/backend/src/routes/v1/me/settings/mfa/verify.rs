use crate::{
    error::{
        AppError,
        FormErrorResponse,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    utils::{
        generate_recovery_codes::generate_recovery_codes,
        generate_totp::generate_totp,
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

#[post("/v1/me/settings/mfa/verify")]
#[tracing::instrument(
    name = "POST /v1/me/settings/mfa/verify",
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
    mfa_secret,
    password
FROM users
WHERE id = $1
"#,
    )
    .bind(user_id)
    .fetch_one(&mut *txn)
    .await?;

    if user.get::<Option<String>, _>("password").is_none() {
        return Err(ToastErrorResponse::new(
            None,
            "You need to set a password to enable 2-factor authentication",
        )
        .into());
    }

    if user.get::<bool, _>("mfa_enabled") {
        return Err(ToastErrorResponse::new(
            Some(StatusCode::CONFLICT),
            "2-factor authentication is already enabled for your account",
        )
        .into());
    }

    let mfa_secret = user.get::<Option<String>, _>("mfa_secret");

    let mfa_secret = match mfa_secret {
        Some(value) => value,
        None => {
            return Err(ToastErrorResponse::new(
                None,
                "2-factor authentication has not been requested for your account",
            )
            .into());
        }
    };

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

    // Enable MFA for the user.
    sqlx::query(
        r#"
UPDATE users
SET mfa_enabled = TRUE
WHERE id = $1
"#,
    )
    .bind(user_id)
    .execute(&mut *txn)
    .await?;

    // Also generate recovery codes for the user
    let recovery_codes = generate_recovery_codes()?;

    match sqlx::query(
        r#"
WITH removed_recovery_codes AS (
    DELETE FROM mfa_recovery_codes
    WHERE user_id = $1
)
INSERT INTO
    mfa_recovery_codes (code, user_id)
SELECT
    UNNEST($2::TEXT[]), $1
"#,
    )
    .bind(user_id)
    .bind(&recovery_codes[..])
    .execute(&mut *txn)
    .await?
    .rows_affected()
    {
        0 => Err(AppError::InternalError(
            "unable to generate recovery codes".to_string(),
        )),
        _ => {
            txn.commit().await?;

            Ok(HttpResponse::Ok().finish())
        }
    }
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
    async fn can_verify_mfa(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;
        let mfa_secret = Secret::generate_secret();

        // Insert the user.
        let result = sqlx::query(
            r#"
INSERT INTO users
    (id, name, username, email, password, mfa_secret)
VALUES
    ($1, $2, $3, $4, $5, $6)
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

        // Generate a TOTP instance for verification code.
        let totp = generate_totp(mfa_secret.to_bytes().unwrap(), "sample_user").unwrap();

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/mfa/verify")
            .set_json(Request {
                code: totp.generate_current().unwrap(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Should update `mfa_enabled` in the database.
        let result = sqlx::query(
            r#"
SELECT mfa_enabled FROM users
WHERE id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("mfa_enabled"));

        // Should also generate and insert recovery codes into the database.
        let result = sqlx::query(
            r#"
SELECT 1 FROM mfa_recovery_codes
WHERE user_id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_all(&mut *conn)
        .await?;

        assert_eq!(result.len(), 10);

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_verify_mfa_request_for_a_user_without_password(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/mfa/verify")
            .set_json(Request {
                code: "000000".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(
            res,
            "You need to set a password to enable 2-factor authentication",
        )
        .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_verify_mfa_request_for_a_user_with_mfa_already_enabled(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Insert the user.
        let result = sqlx::query(
            r#"
INSERT INTO users
    (id, name, username, email, password, mfa_enabled, mfa_secret)
VALUES
    ($1, $2, $3, $4, $5, TRUE, 'some_secret')
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
            .uri("/v1/me/settings/mfa/verify")
            .set_json(Request {
                code: "000000".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(
            res,
            "2-factor authentication is already enabled for your account",
        )
        .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_verify_mfa_request_for_a_user_without_mfa_secret(
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
            .uri("/v1/me/settings/mfa/verify")
            .set_json(Request {
                code: "000000".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(
            res,
            "2-factor authentication has not been requested for your account",
        )
        .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_verify_mfa_request_for_an_invalid_verification_code(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;
        let mfa_secret = Secret::generate_secret();

        // Insert the user
        let result = sqlx::query(
            r#"
INSERT INTO users
    (id, name, username, email, password, mfa_secret)
VALUES
    ($1, $2, $3, $4, $5, $6)
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
            .uri("/v1/me/settings/mfa/verify")
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
