use crate::{
    constants::{
        email_template::EmailTemplate,
        resource_lock::ResourceLock,
    },
    error::{
        AppError,
        FormErrorResponse,
        ToastErrorResponse,
    },
    grpc::defs::token_def::v1::TokenType,
    jobs::{
        email::templated_email::TemplatedEmailJob,
        storage::JobStorage,
    },
    models::email_templates::{
        email_verification::EmailVerificationEmailTemplateData,
        new_email_verification::NewEmailVerificationEmailTemplateData,
    },
    utils::{
        incr_resource_lock_attempts::incr_resource_lock_attempts,
        is_resource_locked::is_resource_locked,
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
use apalis::prelude::Storage;
use argon2::{
    password_hash::{
        rand_core::OsRng,
        SaltString,
    },
    Argon2,
    PasswordHasher,
};
use nanoid::nanoid;
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
    email: String,
}

#[post("/v1/auth/resend-verification-email")]
#[tracing::instrument(
    name = "POST /v1/auth/resend-verification-email",
    skip_all,
    fields(
        email = %payload.email,
    ),
    err
)]
async fn post(
    payload: Json<Request>,
    data: web::Data<AppState>,
    templated_email_job_storage: web::Data<JobStorage<TemplatedEmailJob>>,
) -> Result<HttpResponse, AppError> {
    if is_resource_locked(&data.redis, ResourceLock::Verification, &payload.email).await? {
        return Err(ToastErrorResponse::new(
            Some(StatusCode::TOO_MANY_REQUESTS),
            "Verification requests for this email are currently rate-limited. Try again later.",
        )
        .into());
    }

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    let user = sqlx::query(
        r#"
SELECT
    id,
    last_login_at
FROM users
WHERE email = $1
    AND
        deleted_at IS NULL
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

    let user_id = user.get::<i64>("id");

    // Check if the email-change token exists if this is not a new user.
    if user
        .get::<Option<OffsetDateTime>, _>("last_login_at")
        .is_some()
    {
        match sqlx::query(
            r#"
SELECT
    id,
    name
FROM tokens
WHERE
    type = $1
    AND user_id = $2
    AND expires_at > NOW()
"#,
        )
        .bind(TokenType::EmailVerification as i16)
        .bind(&user_id)
        .fetch_one(&mut *txn)
        .await
        {
            Ok(_) => {}
            Err(error) => {
                return if matches!(error, sqlx::Error::RowNotFound) {
                    // Increment the verification attempts.
                    incr_resource_lock_attempts(
                        &data.redis,
                        ResourceLock::Verification,
                        &payload.email,
                    )
                    .await?;

                    Err(ToastErrorResponse::new(None, "Unknown verification request").into())
                } else {
                    Err(AppError::SqlxError(error))
                };
            }
        };
    }

    // Generate a new verification token.

    let token_id = nanoid!(48);
    let salt = SaltString::generate(&mut OsRng);
    let hashed_token = Argon2::default()
        .hash_password(&token_id.as_bytes(), &salt)
        .map_err(|error| AppError::InternalError(error.to_string()))?;

    sqlx::query(
        r#"
WITH deleted_old_tokens AS (
    DELETE FROM tokens
    WHERE type = $2 AND user_id = $3
)
INSERT INTO tokens (id, type, user_id, expires_at)
VALUES ($1, $2, $3, $4)
"#,
    )
    .bind(hashed_token.to_string())
    .bind(TokenType::EmailVerification as i16)
    .bind(user.get::<i64, _>("id"))
    .bind(OffsetDateTime::now_utc() + Duration::days(1)) // 24 hours
    .execute(&mut *txn)
    .await?;

    // Increment the verification attempts.
    incr_resource_lock_attempts(&data.redis, ResourceLock::Verification, &payload.email).await?;

    let mut template: EmailTemplate;

    let template_data = match user.get::<Option<OffsetDateTime>, _>("last_login_at") {
        // Email verification request for an existing user.
        Some(_) => {
            template = EmailTemplate::NewEmailVerification;

            let verification_link = format!("https://storiny.com/auth/verify-email/{}", token_id);

            serde_json::to_string(&NewEmailVerificationEmailTemplateData {
                link: verification_link,
            })
            .map_err(|error| {
                AppError::InternalError(format!("unable to serialize the template data: {error:?}"))
            })?
        }

        // Email verification request for a new user.
        None => {
            template = EmailTemplate::EmailVerification;

            let full_name = user.get::<String, _>("name");
            let first_name = full_name.split(" ").collect::<Vec<_>>()[0];
            let verification_link = format!("https://storiny.com/auth/verify-email/{}", token_id);

            serde_json::to_string(&EmailVerificationEmailTemplateData {
                email: (&payload.email).to_string(),
                link: verification_link,
                name: first_name.to_string(),
            })
            .map_err(|error| {
                AppError::InternalError(format!("unable to serialize the template data: {error:?}"))
            })?
        }
    };

    let mut templated_email_job = (&*templated_email_job_storage.into_inner()).clone();

    templated_email_job
        .push(TemplatedEmailJob {
            destination: (&payload.email).to_string(),
            template,
            template_data,
        })
        .await
        .map_err(|error| AppError::InternalError(format!("unable to push the job: {error:?}")))?;

    txn.commit().await?;

    Ok(HttpResponse::Created().finish())
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_form_error_response,
        exceed_resource_lock_attempts,
        get_resource_lock_attempts,
        init_app_for_test,
        RedisTestContext,
    };
    use actix_web::test;
    use sqlx::PgPool;
    use storiny_macros::test_context;

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_a_resend_verification_email_request_for_an_invalid_email(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let app = init_app_for_test(post, pool, false, false, None).await.0;

        let req = test::TestRequest::post()
            .uri("/v1/auth/resend-verification-email")
            .set_json(Request {
                email: "invalid@example.com".to_string(),
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

    mod serial {
        use super::*;
        use crate::test_utils::assert_toast_error_response;

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("user"))]
        async fn can_handle_a_resend_verification_email_request(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let app = init_app_for_test(post, pool, false, false, None).await.0;

            let req = test::TestRequest::post()
                .uri("/v1/auth/resend-verification-email")
                .set_json(Request {
                    email: "someone@example.com".to_string(),
                })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Should insert a verification token into the database.
            let result = sqlx::query(
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

            assert!(result.get::<bool, _>("exists"));

            // Should also increment the verification attempts.
            let result = get_resource_lock_attempts(
                &ctx.redis_pool,
                ResourceLock::Verification,
                "someone@example.com",
            )
            .await
            .unwrap();

            assert_eq!(result, 1);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("user"))]
        async fn can_handle_a_resend_verification_email_request_for_an_existing_user(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let app = init_app_for_test(post, pool, false, false, None).await.0;

            // Update the `last_login_at` of the user.
            let result = sqlx::query(
                r#"
UPDATE users
SET last_login_at = NOW()
WHERE id = $1
"#,
            )
            .bind(1_i64)
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            // Insert a verification token for the user.
            let result = sqlx::query(
                r#"
INSERT INTO tokens (id, type, user_id, expires_at)
VALUES ($1, $2, $3, $4)
"#,
            )
            .bind("sample")
            .bind(TokenType::EmailVerification as i16)
            .bind(1_i64)
            .bind(OffsetDateTime::now_utc() + Duration::days(1)) // 24 hours
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            let req = test::TestRequest::post()
                .uri("/v1/auth/resend-verification-email")
                .set_json(Request {
                    email: "someone@example.com".to_string(),
                })
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
            .bind("sample")
            .fetch_one(&mut *conn)
            .await?;

            assert!(!result.get::<bool, _>("exists"));

            // Should insert a new verification token into the database.
            let result = sqlx::query(
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

            assert!(result.get::<bool, _>("exists"));

            // Should also increment the verification attempts.
            let result = get_resource_lock_attempts(
                &ctx.redis_pool,
                ResourceLock::Verification,
                "someone@example.com",
            )
            .await
            .unwrap();

            assert_eq!(result, 1);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("user"))]
        async fn can_reject_a_resend_verification_email_request_for_an_existing_user_when_the_token_is_missing(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let app = init_app_for_test(post, pool, false, false, None).await.0;

            // Update the `last_login_at` of the user.
            let result = sqlx::query(
                r#"
UPDATE users
SET last_login_at = NOW()
WHERE id = $1
"#,
            )
            .bind(1_i64)
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            let req = test::TestRequest::post()
                .uri("/v1/auth/resend-verification-email")
                .set_json(Request {
                    email: "someone@example.com".to_string(),
                })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_client_error());
            assert_toast_error_response(res, "Unknown verification request").await;

            // Should increment the verification attempts.
            let result = get_resource_lock_attempts(
                &ctx.redis_pool,
                ResourceLock::Verification,
                "someone@example.com",
            )
            .await
            .unwrap();

            assert_eq!(result, 1);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_a_resend_verification_email_request_on_exceeding_the_max_attempts(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let app = init_app_for_test(post, pool, false, false, None).await.0;

            exceed_resource_lock_attempts(
                &ctx.redis_pool,
                ResourceLock::Verification,
                "someone@example.com",
            )
            .await;

            let req = test::TestRequest::post()
                .uri("/v1/auth/resend-verification-email")
                .set_json(Request {
                    email: "someone@example.com".to_string(),
                })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert_eq!(res.status(), StatusCode::TOO_MANY_REQUESTS);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("user"))]
        async fn can_delete_previous_email_verification_tokens_for_the_user(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let app = init_app_for_test(post, pool, false, false, None).await.0;

            // Insert a verification token.
            let result = sqlx::query(
                r#"
INSERT INTO tokens (id, type, user_id, expires_at)
VALUES ($1, $2, $3, $4)
"#,
            )
            .bind("sample")
            .bind(TokenType::EmailVerification as i16)
            .bind(1_i64)
            .bind(OffsetDateTime::now_utc() + Duration::days(1)) // 24 hours
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            let req = test::TestRequest::post()
                .uri("/v1/auth/resend-verification-email")
                .set_json(Request {
                    email: "someone@example.com".to_string(),
                })
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
            .bind("sample")
            .fetch_one(&mut *conn)
            .await?;

            assert!(!result.get::<bool, _>("exists"));

            Ok(())
        }
    }
}
