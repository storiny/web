use crate::{
    constants::{
        email_source::EMAIL_SOURCE, email_templates::EmailTemplate, token_type::TokenType,
    },
    error::{AppError, FormErrorResponse},
    AppState,
};
use actix_web::{post, web, HttpResponse};
use actix_web_validator::Json;
use argon2::{
    password_hash::{rand_core::OsRng, SaltString},
    Argon2, PasswordHasher,
};
use email_address::EmailAddress;
use nanoid::nanoid;
use rusoto_ses::{Destination, SendTemplatedEmailRequest, Ses};
use serde::{Deserialize, Serialize};
use sqlx::Row;
use time::{Duration, OffsetDateTime};
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
async fn post(payload: Json<Request>, data: web::Data<AppState>) -> Result<HttpResponse, AppError> {
    if !EmailAddress::is_valid(&payload.email) {
        return Ok(
            HttpResponse::Conflict().json(FormErrorResponse::new(vec![vec![
                "email".to_string(),
                "Invalid e-mail".to_string(),
            ]])),
        );
    }

    match sqlx::query(
        r#"
        SELECT id FROM users
        WHERE email = $1
            AND deleted_at IS NULL AND deactivated_at IS NULL
        "#,
    )
    .bind(&payload.email)
    .fetch_one(&data.db_pool)
    .await
    {
        Ok(user) => {
            let token_id = nanoid!(48);

            // Generate hash from the token_id
            match Argon2::default()
                .hash_password(&token_id.as_bytes(), &SaltString::generate(&mut OsRng))
            {
                Ok(hashed_token) => {
                    let pg_pool = &data.db_pool;
                    let mut txn = pg_pool.begin().await?;

                    // Delete previous password reset tokens for the user
                    sqlx::query(
                        r#"
                        DELETE FROM tokens
                        WHERE type = $1 AND user_id = $2
                        "#,
                    )
                    .bind(TokenType::PasswordReset.to_string())
                    .bind(user.get::<i64, _>("id"))
                    .execute(&mut *txn)
                    .await?;

                    // Insert a new password-reset token
                    sqlx::query(
                        r#"
                        INSERT INTO tokens(id, type, user_id, expires_at)
                        VALUES ($1, $2, $3, $4)
                        "#,
                    )
                    .bind(hashed_token.to_string())
                    .bind(TokenType::PasswordReset.to_string())
                    .bind(user.get::<i64, _>("id"))
                    .bind(OffsetDateTime::now_utc() + Duration::days(1)) // 24 hours
                    .execute(&mut *txn)
                    .await?;

                    txn.commit().await?;

                    match serde_json::to_string(&ResetPasswordEmailTemplateData {
                        link: format!("https://storiny.com/auth/reset-password/{}", token_id),
                    }) {
                        Ok(template_data) => {
                            let ses = &data.ses_client;
                            let _ = ses
                                .send_templated_email(SendTemplatedEmailRequest {
                                    destination: Destination {
                                        to_addresses: Some(vec![(&payload.email).to_string()]),
                                        ..Default::default()
                                    },
                                    source: EMAIL_SOURCE.to_string(),
                                    template: EmailTemplate::PasswordReset.to_string(),
                                    template_data,
                                    ..Default::default()
                                })
                                .await;

                            Ok(HttpResponse::Created().finish())
                        }
                        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
                    }
                }
                Err(_) => Ok(HttpResponse::InternalServerError().finish()),
            }
        }
        Err(kind) => match kind {
            sqlx::Error::RowNotFound => Ok(HttpResponse::Conflict().json(FormErrorResponse::new(
                vec![vec![
                    "email".to_string(),
                    "Could not find any account associated with this e-mail".to_string(),
                ]],
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
    use crate::test_utils::{assert_form_error_response, init_app_for_test};
    use actix_web::test;
    use sqlx::PgPool;

    #[sqlx::test(fixtures("user"))]
    async fn can_handle_account_recovery_request(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false).await.0;

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
        .bind(TokenType::PasswordReset.to_string())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_recovery_request_for_an_invalid_email(pool: PgPool) -> sqlx::Result<()> {
        let app = init_app_for_test(post, pool, false, false).await.0;

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
            vec![vec![
                "email".to_string(),
                "Could not find any account associated with this e-mail".to_string(),
            ]],
        )
        .await;

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_previous_password_reset_tokens_for_the_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false).await.0;

        // Insert a password reset token
        let prev_result = sqlx::query(
            r#"
            INSERT INTO tokens(id, type, user_id, expires_at)
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind("sample")
        .bind(TokenType::PasswordReset.to_string())
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
