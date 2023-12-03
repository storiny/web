use crate::{
    constants::email_template::EmailTemplate,
    error::{
        AppError,
        FormErrorResponse,
    },
    grpc::defs::token_def::v1::TokenType,
    jobs::{
        email::templated_email::TemplatedEmailJob,
        storage::JobStorage,
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
use email_address::EmailAddress;
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

#[derive(Debug, Serialize)]
struct ResetPasswordEmailTemplateData {
    link: String,
}

#[post("/v1/auth/recovery")]
async fn post(
    payload: Json<Request>,
    data: web::Data<AppState>,
    templated_email_job_storage: web::Data<JobStorage<TemplatedEmailJob>>,
) -> Result<HttpResponse, AppError> {
    if !EmailAddress::is_valid(&payload.email) {
        return Err(FormErrorResponse::new(
            Some(StatusCode::CONFLICT),
            vec![("email", "Invalid e-mail")],
        )
        .into());
    }

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    match sqlx::query(
        r#"
SELECT id FROM users
WHERE email = $1
    AND
        deleted_at IS NULL
        AND deactivated_at IS NULL
"#,
    )
    .bind(&payload.email)
    .fetch_one(&mut *txn)
    .await
    {
        Ok(user) => {
            let token_id = nanoid!(48);

            // Generate hash from the token_id
            match Argon2::default()
                .hash_password(&token_id.as_bytes(), &SaltString::generate(&mut OsRng))
            {
                Ok(hashed_token) => {
                    // Delete previous password reset tokens for the user insert a new one
                    sqlx::query(
                        r#"
WITH deleted_tokens AS (
    DELETE FROM tokens
    WHERE type = $2 AND user_id = $3
)
INSERT INTO tokens (id, type, user_id, expires_at)
VALUES ($1, $2, $3, $4)
"#,
                    )
                    .bind(hashed_token.to_string())
                    .bind(TokenType::PasswordReset as i16)
                    .bind(user.get::<i64, _>("id"))
                    .bind(OffsetDateTime::now_utc() + Duration::days(1)) // 24 hours
                    .execute(&mut *txn)
                    .await?;

                    txn.commit().await?;

                    let template_data = serde_json::to_string(&ResetPasswordEmailTemplateData {
                        link: format!("https://storiny.com/auth/reset-password/{}", token_id),
                    })
                    .map_err(|_| AppError::InternalError)?;

                    let mut templated_email_job =
                        (&*templated_email_job_storage.into_inner()).clone();

                    templated_email_job
                        .push(TemplatedEmailJob {
                            destination: (&payload.email).to_string(),
                            template: EmailTemplate::PasswordReset,
                            template_data,
                        })
                        .await
                        .map_err(|_| AppError::InternalError)?;

                    Ok(HttpResponse::Created().finish())
                }
                Err(_) => Ok(HttpResponse::InternalServerError().finish()),
            }
        }
        Err(error) => {
            if matches!(error, sqlx::Error::RowNotFound) {
                Err(FormErrorResponse::new(
                    Some(StatusCode::CONFLICT),
                    vec![(
                        "email",
                        "Could not find any account associated with this e-mail",
                    )],
                )
                .into())
            } else {
                Err(AppError::InternalError)
            }
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
        init_app_for_test,
    };
    use actix_web::test;
    use sqlx::PgPool;

    #[sqlx::test(fixtures("user"))]
    async fn can_handle_account_recovery_request(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false, None).await.0;

        let req = test::TestRequest::post()
            .uri("/v1/auth/recovery")
            .set_json(Request {
                email: "someone@example.com".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Should insert a password reset token into the database
        let result = sqlx::query(
            r#"
            SELECT EXISTS(
                SELECT 1 FROM tokens
                WHERE type = $1    
            )
            "#,
        )
        .bind(TokenType::PasswordReset as i16)
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_recovery_request_for_an_invalid_email(pool: PgPool) -> sqlx::Result<()> {
        let app = init_app_for_test(post, pool, false, false, None).await.0;

        let req = test::TestRequest::post()
            .uri("/v1/auth/recovery")
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
                "Could not find any account associated with this e-mail",
            )],
        )
        .await;

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_previous_password_reset_tokens_for_the_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false, None).await.0;

        // Insert a password reset token
        let prev_result = sqlx::query(
            r#"
            INSERT INTO tokens(id, type, user_id, expires_at)
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind("sample")
        .bind(TokenType::PasswordReset as i16)
        .bind(1_i64)
        .bind(OffsetDateTime::now_utc() + Duration::days(1)) // 24 hours
        .execute(&mut *conn)
        .await?;

        assert_eq!(prev_result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .uri("/v1/auth/recovery")
            .set_json(Request {
                email: "someone@example.com".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Should delete the previous token
        let result = sqlx::query(
            r#"
            SELECT EXISTS(
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
