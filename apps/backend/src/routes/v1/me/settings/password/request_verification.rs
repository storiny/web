use crate::{
    constants::{
        email_source::EMAIL_SOURCE,
        email_templates::EmailTemplate,
    },
    error::{
        AppError,
        ToastErrorResponse,
    },
    grpc::defs::token_def::v1::TokenType,
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_web::{
    post,
    web,
    HttpResponse,
};
use argon2::{
    password_hash::{
        rand_core::OsRng,
        SaltString,
    },
    Argon2,
    PasswordHasher,
};
use nanoid::nanoid;
use rusoto_ses::{
    Destination,
    SendTemplatedEmailRequest,
    Ses,
};
use serde::Serialize;
use sqlx::Row;
use time::{
    Duration,
    OffsetDateTime,
};

#[derive(Debug, Serialize)]
struct PasswordAddVerificationEmailTemplateData {
    verification_code: String,
}

/// Generates a random 6-digit numeric verification code.
fn generate_verification_code() -> String {
    let character_set: [char; 10] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    nanoid!(6, &character_set)
}

#[post("/v1/me/settings/password/add/request-verification")]
async fn post(data: web::Data<AppState>, user: Identity) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => {
            let db_user = sqlx::query(
                r#"
                SELECT email::TEXT, password FROM users
                WHERE id = $1
                "#,
            )
            .bind(user_id)
            .fetch_one(&data.db_pool)
            .await?;

            let user_password = db_user.get::<Option<String>, _>("password");

            if user_password.is_some() {
                return Ok(HttpResponse::BadRequest()
                    .json(ToastErrorResponse::new("You have already set a password")));
            }

            let verification_code = generate_verification_code();

            // Generate hash from the verification_code
            match Argon2::default().hash_password(
                &verification_code.as_bytes(),
                &SaltString::generate(&mut OsRng),
            ) {
                Ok(hashed_verification_code) => {
                    let pg_pool = &data.db_pool;
                    let mut txn = pg_pool.begin().await?;

                    // Delete previous password-add verification tokens for the user
                    sqlx::query(
                        r#"
                        DELETE FROM tokens
                        WHERE type = $1 AND user_id = $2
                        "#,
                    )
                    .bind(TokenType::PasswordAdd as i16)
                    .bind(user_id)
                    .execute(&mut *txn)
                    .await?;

                    // Insert a new password-add verification token
                    sqlx::query(
                        r#"
                        INSERT INTO tokens(id, type, user_id, expires_at)
                        VALUES ($1, $2, $3, $4)
                        "#,
                    )
                    .bind(hashed_verification_code.to_string())
                    .bind(TokenType::PasswordAdd as i16)
                    .bind(user_id)
                    .bind(OffsetDateTime::now_utc() + Duration::days(1)) // 24 hours
                    .execute(&mut *txn)
                    .await?;

                    txn.commit().await?;

                    match serde_json::to_string(&PasswordAddVerificationEmailTemplateData {
                        verification_code,
                    }) {
                        Ok(template_data) => {
                            let ses = &data.ses_client;
                            let _ = ses
                                .send_templated_email(SendTemplatedEmailRequest {
                                    destination: Destination {
                                        to_addresses: Some(vec![
                                            (&db_user.get::<String, _>("email")).to_string(),
                                        ]),
                                        ..Default::default()
                                    },
                                    source: EMAIL_SOURCE.to_string(),
                                    template: EmailTemplate::PasswordAddVerification.to_string(),
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
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
    }
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
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test]
    async fn can_request_password_setup_verification(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        // Send the request
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/password/add/request-verification")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Should insert a password-add verification token into the database
        let result = sqlx::query(
            r#"
            SELECT EXISTS(
                SELECT 1 FROM tokens
                WHERE type = $1    
            )
            "#,
        )
        .bind(TokenType::PasswordAdd as i16)
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_add_password_verification_request_for_an_account_with_existing_password(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Insert the user
        let result = sqlx::query(
            r#"
            INSERT INTO users(id, name, username, email, password)
            VALUES ($1, $2, $3, $4, $5)
            "#,
        )
        .bind(user_id.unwrap())
        .bind("Sample user")
        .bind("sample_user")
        .bind("old@example.com")
        .bind("sample_hashed_password")
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Send the request
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/password/add/request-verification")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "You have already set a password").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_delete_previous_password_setup_verification_tokens_for_the_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Insert a password-add verification token
        let prev_result = sqlx::query(
            r#"
            INSERT INTO tokens(id, type, user_id, expires_at)
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind("sample")
        .bind(TokenType::PasswordAdd as i16)
        .bind(user_id.unwrap())
        .bind(OffsetDateTime::now_utc() + Duration::days(1)) // 24 hours
        .execute(&mut *conn)
        .await?;

        assert_eq!(prev_result.rows_affected(), 1);

        // Send the request
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/password/add/request-verification")
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
