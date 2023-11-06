use crate::constants::account_activity_type::AccountActivityType;
use crate::{
    error::AppError,
    error::ToastErrorResponse,
    middleware::{identity::identity::Identity, session::session::Session},
    AppState,
};
use actix_web::{patch, web, HttpResponse};
use actix_web_validator::Json;
use argon2::password_hash::rand_core::OsRng;
use argon2::password_hash::SaltString;
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use serde::{Deserialize, Serialize};
use sqlx::Row;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(length(min = 6, max = 64, message = "Invalid password length"))]
    current_password: String,
    #[validate(length(min = 6, max = 64, message = "Invalid password length"))]
    new_password: String,
}

#[patch("/v1/me/settings/password/update")]
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
                return Ok(HttpResponse::BadRequest()
                    .json(ToastErrorResponse::new("You have not set a password yet")));
            }

            match PasswordHash::new(&user_password.unwrap()) {
                Ok(hash) => {
                    match Argon2::default()
                        .verify_password(&payload.current_password.as_bytes(), &hash)
                    {
                        Ok(_) => {
                            // Generate a hash from the new password
                            match Argon2::default().hash_password(
                                &payload.new_password.as_bytes(),
                                &SaltString::generate(&mut OsRng),
                            ) {
                                Ok(hashed_password) => {
                                    // Update user's password
                                    sqlx::query(
                                        r#"
                                        WITH
                                            updated_user AS (
                                                UPDATE users
                                                    SET
                                                        password = $2
                                                    WHERE id = $1
                                            )
                                        INSERT
                                        INTO
                                            account_activities (type, description, user_id)
                                        VALUES (
                                            $3,
                                            'You updated your password.',
                                            $1
                                        )
                                        "#,
                                    )
                                    .bind(user_id)
                                    .bind(hashed_password.to_string())
                                    .bind(AccountActivityType::Password as i16)
                                    .execute(&data.db_pool)
                                    .await?;

                                    // Log the user out and destroy all the sessions
                                    session.purge_all();
                                    user.logout();

                                    Ok(HttpResponse::NoContent().finish())
                                }
                                Err(_) => Ok(HttpResponse::InternalServerError().finish()),
                            }
                        }
                        Err(_) => Ok(HttpResponse::Forbidden()
                            .json(ToastErrorResponse::new("Invalid password"))),
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
    use crate::test_utils::{assert_toast_error_response, init_app_for_test};
    use actix_web::test;
    use argon2::{
        password_hash::{rand_core::OsRng, SaltString},
        PasswordHasher,
    };
    use sqlx::{PgPool, Row};

    /// Returns sample hashed password
    fn get_sample_password() -> (String, String) {
        let password = "old_password";
        let salt = SaltString::generate(&mut OsRng);
        let password_hash = Argon2::default()
            .hash_password(password.as_bytes(), &salt)
            .unwrap()
            .to_string();

        (password_hash, password.to_string())
    }

    #[sqlx::test]
    async fn can_update_password(pool: PgPool) -> sqlx::Result<()> {
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

        // Update the password
        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/password/update")
            .set_json(Request {
                new_password: "new_password".to_string(),
                current_password: password.to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Password should get updated in the database
        let user = sqlx::query(
            r#"
            SELECT password FROM users
            WHERE id = $1
            "#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(Argon2::default()
            .verify_password(
                "new_password".as_bytes(),
                &PasswordHash::new(&user.get::<String, _>("password")).unwrap(),
            )
            .is_ok());

        // Should also insert an account activity
        let result = sqlx::query(
            r#"
            SELECT description FROM account_activities
            WHERE user_id = $1 AND type = $2
            "#,
        )
        .bind(user_id.unwrap())
        .bind(AccountActivityType::Password as i16)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("description"),
            "You updated your password.".to_string()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_updating_password_for_a_user_without_password(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(patch, pool, true, false).await;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/password/update")
            .set_json(Request {
                new_password: "new_password".to_string(),
                current_password: "sample".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "You have not set a password yet").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_updating_password_for_invalid_current_password(
        pool: PgPool,
    ) -> sqlx::Result<()> {
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
            .uri("/v1/me/settings/password/update")
            .set_json(Request {
                new_password: "new_password".to_string(),
                current_password: "invalid".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Invalid password").await;

        Ok(())
    }
}
