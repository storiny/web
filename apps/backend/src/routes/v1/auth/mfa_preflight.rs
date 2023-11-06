use crate::{
    error::{AppError, FormErrorResponse, ToastErrorResponse},
    middleware::identity::identity::Identity,
    AppState,
};
use actix_web::{post, web, HttpResponse};
use actix_web_validator::Json;
use argon2::{Argon2, PasswordHash, PasswordVerifier};
use email_address::EmailAddress;
use serde::{Deserialize, Serialize};
use sqlx::{Error, Row};
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
async fn post(
    payload: Json<Request>,
    data: web::Data<AppState>,
    user: Option<Identity>,
) -> Result<HttpResponse, AppError> {
    // Return if the user is already logged-in
    if user.is_some() {
        return Ok(HttpResponse::BadRequest().json(ToastErrorResponse::new(
            "You are already logged-in".to_string(),
        )));
    }

    // Check for valid e-mail
    if !EmailAddress::is_valid(&payload.email) {
        return Ok(
            HttpResponse::BadRequest().json(FormErrorResponse::new(vec![vec![
                "email".to_string(),
                "Invalid e-mail".to_string(),
            ]])),
        );
    }

    let query_result = sqlx::query(
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
    .await;

    match query_result {
        Ok(user) => {
            let user_password = user.get::<Option<String>, _>("password");
            // User has created account using a third-party service, such as Apple or Google
            if user_password.is_none() {
                return Ok(HttpResponse::Unauthorized()
                    .json(ToastErrorResponse::new("Invalid credentials".to_string())));
            }

            match PasswordHash::new(&user_password.unwrap()) {
                Ok(hash) => {
                    match Argon2::default().verify_password(&payload.password.as_bytes(), &hash) {
                        Ok(_) => Ok(HttpResponse::Ok().json(Response {
                            mfa_enabled: user.get::<bool, _>("mfa_enabled"),
                        })),
                        Err(_) => Ok(HttpResponse::Unauthorized()
                            .json(ToastErrorResponse::new("Invalid credentials".to_string()))),
                    }
                }
                Err(_) => Ok(HttpResponse::InternalServerError().finish()),
            }
        }
        Err(kind) => match kind {
            Error::RowNotFound => Ok(HttpResponse::Unauthorized().json(ToastErrorResponse::new(
                "Invalid e-mail or password".to_string(),
            ))),
            _ => Ok(HttpResponse::InternalServerError().finish()),
        },
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{assert_toast_error_response, init_app_for_test, res_to_string};
    use actix_web::test;
    use argon2::{
        password_hash::{rand_core::OsRng, SaltString},
        PasswordHasher,
    };
    use sqlx::PgPool;

    /// Returns sample email and hashed password
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
    async fn can_handle_mfa_preflight_request_when_mfa_is_enabled(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false).await.0;
        let (email, password_hash, password) = get_sample_email_and_password();

        // Insert the user
        sqlx::query(
            r#"
            INSERT INTO users(name, username, email, password, email_verified, mfa_enabled)
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
    async fn can_handle_mfa_preflight_request_when_mfa_is_disabled(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false).await.0;
        let (email, password_hash, password) = get_sample_email_and_password();

        // Insert the user
        sqlx::query(
            r#"
            INSERT INTO users(name, username, email, password, email_verified, mfa_enabled)
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
    async fn can_reject_mfa_preflight_request_with_invalid_email(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false).await.0;
        let (email, password_hash, password) = get_sample_email_and_password();

        // Insert the user
        sqlx::query(
            r#"
            INSERT INTO users(name, username, email, password)
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
    async fn can_reject_mfa_preflight_request_with_missing_password(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false).await.0;
        let (email, _, password) = get_sample_email_and_password();

        // Insert the user
        sqlx::query(
            r#"
            INSERT INTO users(name, username, email)
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
    async fn can_reject_mfa_preflight_request_for_invalid_password(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false).await.0;
        let (email, password_hash, _) = get_sample_email_and_password();

        // Insert the user
        sqlx::query(
            r#"
            INSERT INTO users(name, username, email, password)
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
