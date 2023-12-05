use crate::{
    error::{
        AppError,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_web::{
    http::StatusCode,
    post,
    web,
    HttpResponse,
};
use actix_web_validator::Json;
use argon2::{
    Argon2,
    PasswordHash,
    PasswordVerifier,
};
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::Row;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(email(message = "Invalid e-mail"))]
    #[validate(length(min = 3, max = 300, message = "Invalid e-mail length"))]
    email: String,
    #[validate(length(min = 6, max = 64, message = "Invalid password length"))]
    password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Response {
    mfa_enabled: bool,
}

#[post("/v1/auth/mfa-preflight")]
#[tracing::instrument(
    name = "POST /v1/auth/mfa-preflight",
    skip_all,
    fields(
        email = %payload.email
    ),
    err
)]
async fn post(
    payload: Json<Request>,
    data: web::Data<AppState>,
    user: Option<Identity>,
) -> Result<HttpResponse, AppError> {
    // Return early if the user is already logged-in.
    if user.is_some() {
        return Err(ToastErrorResponse::new(None, "You are already logged in").into());
    }

    let user = sqlx::query(
        r#"
SELECT
    password,
    mfa_enabled
FROM users
WHERE email = $1
"#,
    )
    .bind(&payload.email)
    .fetch_one(&data.db_pool)
    .await
    .map_err(|error| {
        if matches!(error, sqlx::Error::RowNotFound) {
            AppError::ToastError(ToastErrorResponse::new(
                Some(StatusCode::UNAUTHORIZED),
                "Invalid e-mail or password",
            ))
        } else {
            AppError::SqlxError(error)
        }
    })?;

    let user_password = user.get::<Option<String>, _>("password");

    // The password can be NULL if the user has created the account using a third-party service,
    // such as Apple or Google.
    if user_password.is_none() {
        return Err(
            ToastErrorResponse::new(Some(StatusCode::UNAUTHORIZED), "Invalid credentials").into(),
        );
    }

    let user_password = user_password.unwrap_or_default();
    let password_hash = PasswordHash::new(&user_password)
        .map_err(|error| AppError::InternalError(error.to_string()))?;

    // Validate the password.
    Argon2::default()
        .verify_password(&payload.password.as_bytes(), &password_hash)
        .map_err(|_| {
            AppError::ToastError(ToastErrorResponse::new(
                Some(StatusCode::UNAUTHORIZED),
                "Invalid credentials",
            ))
        })?;

    Ok(HttpResponse::Ok().json(Response {
        mfa_enabled: user.get::<bool, _>("mfa_enabled"),
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
    use argon2::{
        password_hash::{
            rand_core::OsRng,
            SaltString,
        },
        PasswordHasher,
    };
    use sqlx::PgPool;

    /// Returns a sample email and hashed password.
    fn get_sample_email_and_password() -> (String, String, String) {
        let password = "sample";
        let email = "someone@example.com";
        let salt = SaltString::generate(&mut OsRng);
        let password_hash = Argon2::default()
            .hash_password(password.as_bytes(), &salt)
            .unwrap()
            .to_string();

        (email.to_string(), password_hash, password.to_string())
    }

    #[sqlx::test]
    async fn can_handle_a_mfa_preflight_request_when_mfa_is_enabled_for_the_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false, None).await.0;

        let (email, password_hash, password) = get_sample_email_and_password();

        // Insert the user.
        sqlx::query(
            r#"
INSERT INTO users (name, username, email, password, email_verified, mfa_enabled)
VALUES ($1, $2, $3, $4, TRUE, TRUE)
"#,
        )
        .bind("Sample user".to_string())
        .bind("sample_user".to_string())
        .bind((&email).to_string())
        .bind(password_hash)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .uri("/v1/auth/mfa-preflight")
            .set_json(Request {
                email: email.to_string(),
                password: password.to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Response>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert!(json.unwrap().mfa_enabled);

        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_a_mfa_preflight_request_when_mfa_is_disabled_for_the_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false, None).await.0;

        let (email, password_hash, password) = get_sample_email_and_password();

        // Insert the user.
        sqlx::query(
            r#"
INSERT INTO users (name, username, email, password, email_verified, mfa_enabled)
VALUES ($1, $2, $3, $4, TRUE, FALSE)
"#,
        )
        .bind("Sample user".to_string())
        .bind("sample_user".to_string())
        .bind((&email).to_string())
        .bind(password_hash)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .uri("/v1/auth/mfa-preflight")
            .set_json(Request {
                email: email.to_string(),
                password: password.to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Response>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert!(!json.unwrap().mfa_enabled);

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_mfa_preflight_request_with_an_invalid_email(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false, None).await.0;

        let (email, password_hash, password) = get_sample_email_and_password();

        // Insert the user.
        sqlx::query(
            r#"
INSERT INTO users (name, username, email, password)
VALUES ($1, $2, $3, $4)
"#,
        )
        .bind("Sample user".to_string())
        .bind("sample_user".to_string())
        .bind((&email).to_string())
        .bind(password_hash)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .uri("/v1/auth/mfa-preflight")
            .set_json(Request {
                email: "some_invalid_email@example.com".to_string(),
                password: password.to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Invalid e-mail or password").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_mfa_preflight_request_with_a_missing_password(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false, None).await.0;

        let (email, _, password) = get_sample_email_and_password();

        // Insert the user.
        sqlx::query(
            r#"
INSERT INTO users (name, username, email)
VALUES ($1, $2, $3)
"#,
        )
        .bind("Sample user".to_string())
        .bind("sample_user".to_string())
        .bind((&email).to_string())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .uri("/v1/auth/mfa-preflight")
            .set_json(Request {
                email: email.to_string(),
                password: password.to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Invalid credentials").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_mfa_preflight_request_for_an_invalid_password(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false, None).await.0;

        let (email, password_hash, _) = get_sample_email_and_password();

        // Insert the user.
        sqlx::query(
            r#"
INSERT INTO users (name, username, email, password)
VALUES ($1, $2, $3, $4)
"#,
        )
        .bind("Sample user".to_string())
        .bind("sample_user".to_string())
        .bind((&email).to_string())
        .bind(password_hash)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .uri("/v1/auth/mfa-preflight")
            .set_json(Request {
                email: email.to_string(),
                password: "some_invalid_password".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Invalid credentials").await;

        Ok(())
    }
}
