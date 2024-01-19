use crate::{
    constants::resource_lock::ResourceLock,
    error::{
        AppError,
        ToastErrorResponse,
    },
    utils::{
        incr_resource_lock_attempts::incr_resource_lock_attempts,
        is_resource_locked::is_resource_locked,
        reset_resource_lock::reset_resource_lock,
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
async fn post(payload: Json<Request>, data: web::Data<AppState>) -> Result<HttpResponse, AppError> {
    if is_resource_locked(&data.redis, ResourceLock::Login, &payload.email).await? {
        return Err(ToastErrorResponse::new(
            Some(StatusCode::TOO_MANY_REQUESTS),
            "Login attempts for this email are currently rate-limited. Try again later.",
        )
        .into());
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
        return Err(ToastErrorResponse::new(
            Some(StatusCode::UNAUTHORIZED),
            "Invalid e-mail or password",
        )
        .into());
    }

    let user_password = user_password.unwrap_or_default();
    let password_hash = PasswordHash::new(&user_password)
        .map_err(|error| AppError::InternalError(error.to_string()))?;

    // Validate the password.
    match Argon2::default().verify_password(payload.password.as_bytes(), &password_hash) {
        Ok(_) => {
            // The user is validated at this point, so it is safe to reset the login attempts.
            reset_resource_lock(&data.redis, ResourceLock::Login, &payload.email).await?;
        }
        Err(_) => {
            // Increment the login attempts.
            incr_resource_lock_attempts(&data.redis, ResourceLock::Login, &payload.email).await?;

            return Err(ToastErrorResponse::new(
                Some(StatusCode::UNAUTHORIZED),
                "Invalid e-mail or password",
            )
            .into());
        }
    }

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
        exceed_resource_lock_attempts,
        get_resource_lock_attempts,
        init_app_for_test,
        res_to_string,
        RedisTestContext,
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
    use storiny_macros::test_context;

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
        .bind(email.to_string())
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
        .bind(email.to_string())
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
        .bind(email.to_string())
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
        .bind(email.to_string())
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
        assert_toast_error_response(res, "Invalid e-mail or password").await;

        Ok(())
    }

    mod serial {
        use super::*;

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_a_mfa_preflight_request_for_an_invalid_password(
            ctx: &mut RedisTestContext,
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
            .bind(email.to_string())
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
            assert_toast_error_response(res, "Invalid e-mail or password").await;

            // Should increment the login attempts.
            let result = get_resource_lock_attempts(&ctx.redis_pool, ResourceLock::Login, &email)
                .await
                .unwrap();

            assert_eq!(result, 1);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_a_mfa_preflight_request_on_exceeding_the_max_attempts(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let app = init_app_for_test(post, pool, false, false, None).await.0;
            let (email, _, password) = get_sample_email_and_password();

            exceed_resource_lock_attempts(&ctx.redis_pool, ResourceLock::Login, &email).await;

            let req = test::TestRequest::post()
                .uri("/v1/auth/mfa-preflight")
                .set_json(Request {
                    email: email.to_string(),
                    password: password.to_string(),
                })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert_eq!(res.status(), StatusCode::TOO_MANY_REQUESTS);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reset_the_resource_lock_on_a_valid_mfa_preflight_request(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let app = init_app_for_test(post, pool, false, false, None).await.0;

            let (email, password_hash, password) = get_sample_email_and_password();

            // Increment the resource lock.
            incr_resource_lock_attempts(&ctx.redis_pool, ResourceLock::Login, &email)
                .await
                .unwrap();

            let result = get_resource_lock_attempts(&ctx.redis_pool, ResourceLock::Login, &email)
                .await
                .unwrap();

            assert_eq!(result, 1);

            // Insert the user.
            sqlx::query(
                r#"
INSERT INTO users (name, username, email, password, email_verified, mfa_enabled)
VALUES ($1, $2, $3, $4, TRUE, TRUE)
"#,
            )
            .bind("Sample user".to_string())
            .bind("sample_user".to_string())
            .bind(email.to_string())
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

            // Should reset the attempts.
            let result =
                get_resource_lock_attempts(&ctx.redis_pool, ResourceLock::Login, &email).await;

            assert!(result.is_none());

            Ok(())
        }
    }
}
