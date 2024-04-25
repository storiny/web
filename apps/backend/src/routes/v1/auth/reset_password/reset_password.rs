use crate::{
    constants::resource_lock::ResourceLock,
    error::{
        AppError,
        FormErrorResponse,
        ToastErrorResponse,
    },
    grpc::defs::token_def::v1::TokenType,
    utils::{
        clear_user_sessions::clear_user_sessions,
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
    #[validate(email(message = "Invalid e-mail"))]
    #[validate(length(min = 3, max = 300, message = "Invalid e-mail length"))]
    email: String,
    #[validate(length(min = 6, max = 64, message = "Invalid password length"))]
    password: String,
    logout_of_all_devices: bool,
    #[validate(length(equal = 48, message = "Invalid token length"))]
    token: String,
}

#[post("/v1/auth/reset-password")]
#[tracing::instrument(
    name = "POST /v1/auth/reset-password",
    skip_all,
    fields(
        email = %payload.email,
        logout_of_all_devices = %payload.logout_of_all_devices
    ),
    err
)]
async fn post(payload: Json<Request>, data: web::Data<AppState>) -> Result<HttpResponse, AppError> {
    if is_resource_locked(&data.redis, ResourceLock::ResetPassword, &payload.email).await? {
        return Err(ToastErrorResponse::new(
            Some(StatusCode::TOO_MANY_REQUESTS),
            "Password reset requests for this email are currently rate-limited. Try again later.",
        )
        .into());
    }

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    let user = sqlx::query(
        r#"
SELECT id FROM users
WHERE
    email = $1
        AND deleted_at IS NULL
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

    let user_id = user.get::<i64, _>("id");

    let token = match sqlx::query(
        r#"
SELECT id, expires_at FROM tokens
WHERE type = $1 AND user_id = $2
"#,
    )
    .bind(TokenType::PasswordReset as i16)
    .bind(user_id)
    .fetch_one(&mut *txn)
    .await
    {
        Ok(token) => token,
        Err(error) => {
            return if matches!(error, sqlx::Error::RowNotFound) {
                // Increment the password reset attempts.
                incr_resource_lock_attempts(
                    &data.redis,
                    ResourceLock::ResetPassword,
                    &payload.email,
                )
                .await?;

                Err(ToastErrorResponse::new(None, "Invalid token").into())
            } else {
                Err(AppError::SqlxError(error))
            };
        }
    };

    // Validate the token.
    {
        let token_id = token.get::<String, _>("id");
        let hashed_token = PasswordHash::new(&token_id)
            .map_err(|error| AppError::InternalError(error.to_string()))?;

        match Argon2::default().verify_password(payload.token.as_bytes(), &hashed_token) {
            Ok(_) => {
                reset_resource_lock(&data.redis, ResourceLock::ResetPassword, &payload.email)
                    .await?;
            }
            Err(_) => {
                // Increment the password reset attempts.
                incr_resource_lock_attempts(
                    &data.redis,
                    ResourceLock::ResetPassword,
                    &payload.email,
                )
                .await?;

                return Err(AppError::ToastError(ToastErrorResponse::new(
                    None,
                    "Invalid token",
                )));
            }
        };
    }

    // Check the token expiry.
    {
        let expires_at = token.get::<OffsetDateTime, _>("expires_at");

        if expires_at < OffsetDateTime::now_utc() {
            return Err(AppError::ToastError(ToastErrorResponse::new(
                None,
                "Token has expired",
            )));
        }
    }

    let salt = SaltString::generate(&mut OsRng);
    let next_hashed_password = Argon2::default()
        .hash_password(payload.password.as_bytes(), &salt)
        .map_err(|error| AppError::InternalError(error.to_string()))?;

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
    .bind(next_hashed_password.to_string())
    .bind(user_id)
    .bind(token.get::<String, _>("id"))
    .execute(&mut *txn)
    .await?;

    txn.commit().await?;

    // Logout of all devices if requested
    if payload.logout_of_all_devices {
        clear_user_sessions(&data.redis, user_id)
            .await
            .map_err(|error| AppError::InternalError(error.to_string()))?;
    }

    Ok(HttpResponse::NoContent().finish())
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        config::get_app_config,
        constants::{
            redis_namespaces::RedisNamespace,
            token::TOKEN_LENGTH,
        },
        test_utils::{
            assert_form_error_response,
            assert_toast_error_response,
            exceed_resource_lock_attempts,
            get_resource_lock_attempts,
            init_app_for_test,
            RedisTestContext,
        },
        utils::{
            generate_hashed_token::generate_hashed_token,
            get_user_sessions::{
                get_user_sessions,
                UserSession,
            },
        },
    };
    use actix_web::test;
    use argon2::{
        PasswordHash,
        PasswordVerifier,
    };
    use nanoid::nanoid;
    use redis::AsyncCommands;
    use sqlx::PgPool;
    use storiny_macros::test_context;
    use time::Duration;
    use uuid::Uuid;

    #[sqlx::test(fixtures("user"))]
    async fn can_reset_password(pool: PgPool) -> sqlx::Result<()> {
        let config = get_app_config().unwrap();
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false, None).await.0;
        let (token_id, hashed_token) = generate_hashed_token(&config.token_salt).unwrap();

        // Insert the reset password token.
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
            .uri("/v1/auth/reset-password")
            .set_json(Request {
                email: "someone@example.com".to_string(),
                password: "new_password".to_string(),
                logout_of_all_devices: false,
                token: token_id,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Password should get updated in the database.
        let user = sqlx::query(
            r#"
SELECT password FROM users
WHERE email = $1
"#,
        )
        .bind("someone@example.com")
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
        .bind(&hashed_token)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!token.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_a_reset_password_request_for_an_invalid_email(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let config = get_app_config().unwrap();
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false, None).await.0;
        let (token_id, hashed_token) = generate_hashed_token(&config.token_salt).unwrap();

        // Insert the reset password token.
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
            .uri("/v1/auth/reset-password")
            .set_json(Request {
                email: "invalid@example.com".to_string(),
                password: "new_password".to_string(),
                logout_of_all_devices: false,
                token: token_id,
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

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_a_reset_password_request_for_an_expired_token(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let config = get_app_config().unwrap();
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false, None).await.0;
        let (token_id, hashed_token) = generate_hashed_token(&config.token_salt).unwrap();

        // Insert the reset password token.
        let token_result = sqlx::query(
            r#"
INSERT INTO tokens (id, type, user_id, expires_at)
VALUES ($1, $2, $3, $4)
"#,
        )
        .bind(&hashed_token)
        .bind(TokenType::PasswordReset as i16)
        .bind(1_i64)
        .bind(OffsetDateTime::now_utc() - Duration::days(1)) // The token expired yesterday
        .execute(&mut *conn)
        .await?;

        assert_eq!(token_result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .uri("/v1/auth/reset-password")
            .set_json(Request {
                email: "someone@example.com".to_string(),
                password: "new_password".to_string(),
                logout_of_all_devices: false,
                token: token_id,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Token has expired").await;

        Ok(())
    }

    mod serial {
        use super::*;

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("user"))]
        async fn can_reject_a_reset_password_request_for_an_invalid_token(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let app = init_app_for_test(post, pool, false, false, None).await.0;

            let req = test::TestRequest::post()
                .uri("/v1/auth/reset-password")
                .set_json(Request {
                    email: "someone@example.com".to_string(),
                    password: "new_password".to_string(),
                    logout_of_all_devices: false,
                    token: nanoid!(TOKEN_LENGTH).to_string(),
                })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_client_error());
            assert_toast_error_response(res, "Invalid token").await;

            // Should increment the password reset attempts.
            let result = get_resource_lock_attempts(
                &ctx.redis_pool,
                ResourceLock::ResetPassword,
                "someone@example.com",
            )
            .await
            .unwrap();

            assert_eq!(result, 1);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_a_reset_password_request_on_exceeding_the_max_attempts(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let app = init_app_for_test(post, pool, false, false, None).await.0;

            exceed_resource_lock_attempts(
                &ctx.redis_pool,
                ResourceLock::ResetPassword,
                "someone@example.com",
            )
            .await;

            let req = test::TestRequest::post()
                .uri("/v1/auth/reset-password")
                .set_json(Request {
                    email: "someone@example.com".to_string(),
                    password: "new_password".to_string(),
                    logout_of_all_devices: false,
                    token: nanoid!(TOKEN_LENGTH).to_string(),
                })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert_eq!(res.status(), StatusCode::TOO_MANY_REQUESTS);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("user"))]
        async fn can_reset_the_resource_lock_on_a_valid_reset_password_request(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let config = get_app_config().unwrap();
            let mut conn = pool.acquire().await?;
            let app = init_app_for_test(post, pool, false, false, None).await.0;

            // Increment the resource lock.
            incr_resource_lock_attempts(
                &ctx.redis_pool,
                ResourceLock::ResetPassword,
                "someone@example.com",
            )
            .await
            .unwrap();

            let result = get_resource_lock_attempts(
                &ctx.redis_pool,
                ResourceLock::ResetPassword,
                "someone@example.com",
            )
            .await
            .unwrap();

            assert_eq!(result, 1);

            let (token_id, hashed_token) = generate_hashed_token(&config.token_salt).unwrap();

            // Insert the reset password token.
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
                .uri("/v1/auth/reset-password")
                .set_json(Request {
                    email: "someone@example.com".to_string(),
                    password: "new_password".to_string(),
                    logout_of_all_devices: false,
                    token: token_id,
                })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Should reset the attempts.
            let result = get_resource_lock_attempts(
                &ctx.redis_pool,
                ResourceLock::ResetPassword,
                "someone@example.com",
            )
            .await;

            assert!(result.is_none());

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("user"))]
        async fn can_log_out_of_other_devices(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let redis_pool = &ctx.redis_pool;
            let config = get_app_config().unwrap();
            let mut conn = pool.acquire().await?;
            let (app, _, _) = init_app_for_test(post, pool, false, false, None).await;
            let user_id = 1_i64;
            let (token_id, hashed_token) = generate_hashed_token(&config.token_salt).unwrap();

            // Insert the reset password token.
            let result = sqlx::query(
                r#"
INSERT INTO tokens (id, type, user_id, expires_at)
VALUES ($1, $2, $3, $4)
"#,
            )
            .bind(&hashed_token)
            .bind(TokenType::PasswordReset as i16)
            .bind(user_id)
            .bind(OffsetDateTime::now_utc() + Duration::days(1)) // 24 hours
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            let mut redis_conn = redis_pool.get().await.unwrap();

            // Create some sessions for the user.
            for _ in 0..5 {
                redis_conn
                    .set::<_, _, ()>(
                        &format!("{}:{user_id}:{}", RedisNamespace::Session, Uuid::new_v4()),
                        &rmp_serde::to_vec_named(&UserSession {
                            user_id,
                            ..Default::default()
                        })
                        .unwrap(),
                    )
                    .await
                    .unwrap();
            }

            // Cache should have all the created sessions initially.
            let sessions = get_user_sessions(redis_pool, user_id).await.unwrap();
            assert_eq!(sessions.len(), 5);

            let req = test::TestRequest::post()
                .uri("/v1/auth/reset-password")
                .set_json(Request {
                    email: "someone@example.com".to_string(),
                    password: "new_password".to_string(),
                    logout_of_all_devices: true,
                    token: token_id,
                })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Cache should not have any sessions.
            let sessions = get_user_sessions(redis_pool, user_id).await.unwrap();
            assert!(sessions.is_empty());

            Ok(())
        }
    }
}
