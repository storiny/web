use crate::{
    error::{
        AppError,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    utils::generate_totp::generate_totp,
    AppState,
};
use actix_web::{
    http::StatusCode,
    post,
    web,
    HttpResponse,
};
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::Row;
use totp_rs::Secret;

#[derive(Debug, Serialize, Deserialize)]
struct Response {
    code: String,
    qr: String,
}

#[post("/v1/me/settings/mfa/request")]
#[tracing::instrument(
    name = "POST /v1/me/settings/mfa/request",
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
    mfa_enabled,
    username,
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

    let secret = Secret::generate_secret();
    let secret_as_bytes = secret.to_bytes().map_err(|error| {
        AppError::InternalError(format!("unable to generate the totp secret: {error:?}"))
    })?;

    let totp = generate_totp(secret_as_bytes, user.get::<String, _>("username").as_str()).map_err(
        |error| AppError::InternalError(format!("unable to generate a totp instance: {error:?}")),
    )?;

    let qr_code = totp.get_qr_base64().map_err(|error| {
        AppError::InternalError(format!("unable to generate a QR code: {error:?}"))
    })?;

    // Temporarily save the TOTP secret for the user.
    sqlx::query(
        r#"
UPDATE users
SET mfa_secret = $1
WHERE id = $2
"#,
    )
    .bind(secret.to_encoded().to_string())
    .bind(user_id)
    .execute(&mut *txn)
    .await?;

    txn.commit().await?;

    Ok(HttpResponse::Ok().json(Response {
        code: totp.get_secret_base32().to_lowercase(),
        qr: format!("data:image/png;base64,{qr_code}"),
    }))
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
        res_to_string,
    };
    use actix_web::test;
    use sqlx::PgPool;

    #[sqlx::test]
    async fn can_request_mfa(pool: PgPool) -> sqlx::Result<()> {
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
            .uri("/v1/me/settings/mfa/request")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Response>(&res_to_string(res).await);

        assert!(json.is_ok());

        // Should update `mfa_secret` in the database.
        let result = sqlx::query(
            r#"
SELECT mfa_secret FROM users
WHERE id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<Option<String>, _>("mfa_secret").is_some());

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_an_mfa_request_for_a_user_without_password(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/mfa/request")
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
    async fn can_reject_an_mfa_request_for_a_user_with_mfa_already_enabled(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Insert the user.
        let result = sqlx::query(
            r#"
INSERT INTO users
    (id, name, username, email, password, mfa_enabled)
VALUES
    ($1, $2, $3, $4, $5, TRUE)
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
            .uri("/v1/me/settings/mfa/request")
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
}
