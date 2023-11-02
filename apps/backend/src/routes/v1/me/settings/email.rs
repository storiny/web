use crate::constants::account_activity_type::AccountActivityType;
use crate::error::FormErrorResponse;
use crate::{
    error::AppError,
    error::ToastErrorResponse,
    middleware::{identity::identity::Identity, session::session::Session},
    AppState,
};
use actix_web::{patch, web, HttpResponse};
use actix_web_validator::Json;
use argon2::{Argon2, PasswordHash, PasswordVerifier};
use email_address::EmailAddress;
use serde::{Deserialize, Serialize};
use sqlx::Row;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(email(message = "Invalid e-mail"))]
    #[validate(length(min = 3, max = 300, message = "Invalid e-mail length"))]
    new_email: String,
    #[validate(length(min = 6, max = 64, message = "Invalid password length"))]
    current_password: String,
}

#[patch("/v1/me/settings/email")]
async fn patch(
    payload: Json<Request>,
    data: web::Data<AppState>,
    user: Identity,
    session: Session,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => {
            let db_user = sqlx::query(
                r#"
                SELECT password FROM users
                WHERE id = $1
                "#,
            )
            .bind(user_id)
            .fetch_one(&data.db_pool)
            .await?;

            let user_password = db_user.get::<Option<String>, _>("password");

            if user_password.is_none() {
                return Ok(HttpResponse::BadRequest().json(ToastErrorResponse::new(
                    "You need to set a password to change your e-mail".to_string(),
                )));
            }

            // Check for valid e-mail
            if !EmailAddress::is_valid(&payload.new_email) {
                return Ok(
                    HttpResponse::BadRequest().json(FormErrorResponse::new(vec![vec![
                        "new_email".to_string(),
                        "Invalid e-mail".to_string(),
                    ]])),
                );
            }

            match PasswordHash::new(&user_password.unwrap()) {
                Ok(hash) => {
                    match Argon2::default()
                        .verify_password(&payload.current_password.as_bytes(), &hash)
                    {
                        Ok(_) => {
                            match sqlx::query(
                                r#"
                                WITH
                                    updated_user AS (
                                        UPDATE users
                                            SET
                                                email = $2,
                                                email_verified = FALSE
                                            WHERE id = $1
                                    )
                                INSERT
                                INTO
                                    account_activities (type, description, user_id)
                                VALUES (
                                    $3,
                                    'You changed your e-mail address to <m>' || $2 || '</m>',
                                    $1
                                )
                                "#,
                            )
                            .bind(user_id)
                            .bind(&payload.new_email)
                            .bind(AccountActivityType::Email as i16)
                            .execute(&data.db_pool)
                            .await
                            {
                                Ok(_) => {
                                    // Log the user out and destroy all the sessions
                                    session.purge_all();
                                    user.logout();

                                    Ok(HttpResponse::NoContent().finish())
                                }
                                Err(err) => {
                                    if let Some(db_err) = err.into_database_error() {
                                        match db_err.kind() {
                                            // Check whether the new email is already in use
                                            sqlx::error::ErrorKind::UniqueViolation => {
                                                Ok(HttpResponse::Conflict().json(
                                                    FormErrorResponse::new(vec![vec![
                                                        "new_email".to_string(),
                                                        "This e-mail is already in use".to_string(),
                                                    ]]),
                                                ))
                                            }
                                            _ => Ok(HttpResponse::InternalServerError().finish()),
                                        }
                                    } else {
                                        Ok(HttpResponse::InternalServerError().finish())
                                    }
                                }
                            }
                        }
                        Err(_) => {
                            Ok(
                                HttpResponse::Forbidden().json(FormErrorResponse::new(vec![vec![
                                    "current_password".to_string(),
                                    "Invalid password".to_string(),
                                ]])),
                            )
                        }
                    }
                }
                Err(_) => Ok(HttpResponse::InternalServerError().finish()),
            }
        }
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(patch);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_form_error_response, assert_toast_error_response, init_app_for_test,
    };
    use actix_web::test;
    use argon2::{
        password_hash::{rand_core::OsRng, SaltString},
        PasswordHasher,
    };
    use sqlx::{PgPool, Row};

    /// Returns sample hashed password
    fn get_sample_password() -> (String, String) {
        let password = "sample";
        let salt = SaltString::generate(&mut OsRng);
        let password_hash = Argon2::default()
            .hash_password(password.as_bytes(), &salt)
            .unwrap()
            .to_string();

        (password_hash, password.to_string())
    }

    #[sqlx::test]
    async fn can_update_email(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, true).await;
        let (password_hash, password) = get_sample_password();

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
        .bind(password_hash)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Change the email
        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/email")
            .set_json(Request {
                new_email: "new@example.com".to_string(),
                current_password: password.to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Email should get updated in the database
        let result = sqlx::query(
            r#"
            SELECT email::TEXT, email_verified FROM users
            WHERE id = $1
            "#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("email"),
            "new@example.com".to_string()
        );
        assert!(!result.get::<bool, _>("email_verified"));

        // Should also insert an account activity
        let result = sqlx::query(
            r#"
            SELECT description FROM account_activities
            WHERE user_id = $1 AND type = $2
            "#,
        )
        .bind(user_id.unwrap())
        .bind(AccountActivityType::Email as i16)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("description"),
            "You changed your e-mail address to <m>new@example.com</m>".to_string()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_updating_email_for_a_user_without_password(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(patch, pool, true, false).await;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/email")
            .set_json(Request {
                new_email: "sample@example.com".to_string(),
                current_password: "sample".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "You need to set a password to change your e-mail").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_updating_email_for_invalid_password(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, true).await;
        let (password_hash, _) = get_sample_password();

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
        .bind("sample@example.com")
        .bind(password_hash)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/email")
            .set_json(Request {
                new_email: "new@example.com".to_string(),
                current_password: "invalid".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(
            res,
            vec![vec![
                "current_password".to_string(),
                "Invalid password".to_string(),
            ]],
        )
        .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_updating_email_for_duplicate_email(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, true).await;
        let (password_hash, password) = get_sample_password();

        // Insert the user
        let result = sqlx::query(
            r#"
            INSERT INTO users(id, name, username, email, password)
            VALUES ($1, $2, $3, $4, $5)
            "#,
        )
        .bind(user_id.unwrap())
        .bind("Sample user 1")
        .bind("sample_user_1")
        .bind("old@example.com")
        .bind(password_hash)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Insert another user
        let result = sqlx::query(
            r#"
            INSERT INTO users(id, name, username, email)
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind(2_i64)
        .bind("Sample user 2")
        .bind("sample_user_2")
        .bind("new@example.com")
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/email")
            .set_json(Request {
                new_email: "new@example.com".to_string(),
                current_password: password.to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(
            res,
            vec![vec![
                "new_email".to_string(),
                "This e-mail is already in use".to_string(),
            ]],
        )
        .await;

        // Should not insert an account activity
        let result = sqlx::query(
            r#"
            SELECT EXISTS(
                SELECT 1 FROM account_activities
                WHERE user_id = $1 AND type = $2
            )
            "#,
        )
        .bind(user_id.unwrap())
        .bind(AccountActivityType::Email as i16)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }
}
