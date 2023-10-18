use crate::{
    constants::token_type::TokenType,
    error::{
        AppError,
        FormErrorResponse,
        ToastErrorResponse,
    },
    AppState,
};
use actix_web::{
    http::header::ContentType,
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
use email_address::EmailAddress;
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
        Ok(user) => match sqlx::query(
            r#"
            SELECT id, expires_at FROM tokens
            WHERE type = $1 AND user_id = $2
            "#,
        )
        .bind(TokenType::PasswordReset.to_string())
        .bind(user.get::<i64, _>("id"))
        .fetch_one(&data.db_pool)
        .await
        {
            Ok(token_result) => {
                match PasswordHash::new(&token_result.get::<String, _>("id")) {
                    Ok(token_hash) => {
                        // Check if the token is valid
                        match Argon2::default()
                            .verify_password(&payload.token.as_bytes(), &token_hash)
                        {
                            Ok(_) => {
                                let expires_at =
                                    token_result.get::<OffsetDateTime, _>("expires_at");

                                // Check if the token has expired
                                if expires_at < OffsetDateTime::now_utc() {
                                    return Ok(HttpResponse::BadRequest()
                                        .content_type(ContentType::json())
                                        .json(ToastErrorResponse::new(
                                            "Token has expired".to_string(),
                                        )));
                                }

                                // Generate a hash from the new password
                                match Argon2::default().hash_password(
                                    &payload.password.as_bytes(),
                                    &SaltString::generate(&mut OsRng),
                                ) {
                                    Ok(hashed_password) => {
                                        let pg_pool = &data.db_pool;
                                        let mut transaction = pg_pool.begin().await?;

                                        // Delete the token
                                        sqlx::query(
                                            r#"
                                            DELETE FROM tokens
                                            WHERE id = $1
                                            "#,
                                        )
                                        .bind(token_result.get::<String, _>("id"))
                                        .execute(&mut *transaction)
                                        .await?;

                                        // Update user's password
                                        sqlx::query(
                                            r#"
                                            UPDATE users
                                            SET password = $1
                                            WHERE id = $2
                                            "#,
                                        )
                                        .bind(hashed_password.to_string())
                                        .bind(user.get::<i64, _>("id"))
                                        .execute(&mut *transaction)
                                        .await?;

                                        transaction.commit().await?;

                                        // Logout of all devices if requested
                                        if payload.logout_of_all_devices {
                                            // TODO
                                        }

                                        Ok(HttpResponse::NoContent().finish())
                                    }
                                    Err(_) => Ok(HttpResponse::InternalServerError().finish()),
                                }
                            }
                            Err(_) => Ok(HttpResponse::BadRequest()
                                .content_type(ContentType::json())
                                .json(ToastErrorResponse::new("Invalid token".to_string()))),
                        }
                    }
                    Err(_) => Ok(HttpResponse::InternalServerError().finish()),
                }
            }
            Err(kind) => match kind {
                sqlx::Error::RowNotFound => Ok(HttpResponse::BadRequest()
                    .content_type(ContentType::json())
                    .json(ToastErrorResponse::new("Invalid token".to_string()))),
                _ => Ok(HttpResponse::InternalServerError().finish()),
            },
        },
        Err(kind) => match kind {
            sqlx::Error::RowNotFound => {
                return Ok(
                    HttpResponse::Conflict().json(FormErrorResponse::new(vec![vec![
                        "email".to_string(),
                        "Could not find any account associated with this e-mail".to_string(),
                    ]])),
                );
            }
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
    use crate::utils::init_app_for_test::init_app_for_test;
    use actix_http::body::to_bytes;
    use actix_web::test;
    use argon2::{
        PasswordHash,
        PasswordVerifier,
    };
    use nanoid::nanoid;
    use sqlx::PgPool;
    use time::Duration;

    #[sqlx::test(fixtures("user"))]
    async fn can_reset_password(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false).await.0;
        let token_id = nanoid!(48);
        let salt = SaltString::generate(&mut OsRng);
        let hashed_token = Argon2::default()
            .hash_password(&token_id.as_bytes(), &salt)
            .unwrap();

        // Insert reset password token
        sqlx::query(
            r#"
            INSERT INTO tokens(id, type, user_id, expires_at)
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind(hashed_token.to_string())
        .bind(TokenType::PasswordReset.to_string())
        .bind(1i64)
        .bind(OffsetDateTime::now_utc() + Duration::days(1)) // 24 hours
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .uri("/v1/auth/reset-password")
            .set_json(Request {
                email: "someone@example.com".to_string(),
                password: "new_password".to_string(),
                logout_of_all_devices: false,
                token: token_id.clone(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Password should get updated in the database
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

        // Token should get removed from the database.
        let token = sqlx::query(
            r#"
            SELECT EXISTS(
                SELECT 1 FROM tokens
                WHERE id = $1
            )
            "#,
        )
        .bind(&token_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!token.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_reset_password_for_an_invalid_email(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false).await.0;
        let token_id = nanoid!(48);

        // Insert reset password token
        sqlx::query(
            r#"
            INSERT INTO tokens(id, type, user_id, expires_at)
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind(token_id.clone())
        .bind(TokenType::PasswordReset.to_string())
        .bind(1i64)
        .bind(OffsetDateTime::now_utc() + Duration::days(1)) // 24 hours
        .execute(&mut *conn)
        .await?;

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
        assert_eq!(
            to_bytes(res.into_body()).await.unwrap(),
            serde_json::to_string(&FormErrorResponse::new(vec![vec![
                "email".to_string(),
                "Could not find any account associated with this e-mail".to_string(),
            ]]))
            .unwrap()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_reset_password_for_an_expired_token(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false).await.0;
        let token_id = nanoid!(48);
        let salt = SaltString::generate(&mut OsRng);
        let hashed_token = Argon2::default()
            .hash_password(&token_id.as_bytes(), &salt)
            .unwrap();

        // Insert reset password token
        let token_result = sqlx::query(
            r#"
            INSERT INTO tokens(id, type, user_id, expires_at)
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind(hashed_token.to_string())
        .bind(TokenType::PasswordReset.to_string())
        .bind(1i64)
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
        assert_eq!(
            to_bytes(res.into_body()).await.unwrap(),
            serde_json::to_string(&ToastErrorResponse::new("Token has expired".to_string()))
                .unwrap()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_reset_password_for_an_invalid_token(pool: PgPool) -> sqlx::Result<()> {
        let app = init_app_for_test(post, pool, false, false).await.0;

        let req = test::TestRequest::post()
            .uri("/v1/auth/reset-password")
            .set_json(Request {
                email: "someone@example.com".to_string(),
                password: "new_password".to_string(),
                logout_of_all_devices: false,
                token: nanoid!(48).to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_eq!(
            to_bytes(res.into_body()).await.unwrap(),
            serde_json::to_string(&ToastErrorResponse::new("Invalid token".to_string())).unwrap()
        );

        Ok(())
    }
}
