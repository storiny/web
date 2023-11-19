use crate::{
    error::{
        AppError,
        ToastErrorResponse,
    },
    middleware::identity::identity::Identity,
    AppState,
};
use actix_extended_session::Session;
use actix_web::{
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
    #[validate(length(min = 6, max = 64, message = "Invalid password length"))]
    current_password: String,
}

#[post("/v1/me/settings/privacy/disable-account")]
async fn post(
    payload: Json<Request>,
    data: web::Data<AppState>,
    user: Identity,
    _session: Session,
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
                            // Deactivate the user
                            match sqlx::query(
                                r#"
                                UPDATE users
                                SET deactivated_at = now()
                                WHERE id = $1
                                "#,
                            )
                            .bind(user_id)
                            .execute(&data.db_pool)
                            .await?
                            .rows_affected()
                            {
                                0 => Ok(HttpResponse::InternalServerError().finish()),
                                _ => {
                                    // Log the user out and destroy all the sessions
                                    // TODO: session.purge_all();
                                    user.logout();

                                    Ok(HttpResponse::NoContent().finish())
                                }
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
    use argon2::{
        password_hash::{
            rand_core::OsRng,
            SaltString,
        },
        PasswordHasher,
    };
    use sqlx::{
        PgPool,
        Row,
    };
    use time::OffsetDateTime;

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
    async fn can_deactivate_a_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true).await;
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
        .bind("sample@example.com")
        .bind(password_hash)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Delete the user
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/privacy/disable-account")
            .set_json(Request {
                current_password: password.to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // User should get deactivated
        let user = sqlx::query(
            r#"
            SELECT deactivated_at FROM users
            WHERE id = $1
            "#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            user.get::<Option<OffsetDateTime>, _>("deactivated_at")
                .is_some()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_deactivating_a_user_without_password(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/privacy/disable-account")
            .set_json(Request {
                current_password: "sample".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "You have not set a password yet").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_deactivating_account_for_invalid_password(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true).await;
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

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/privacy/disable-account")
            .set_json(Request {
                current_password: "invalid".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Invalid password").await;

        Ok(())
    }
}
