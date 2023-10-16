use crate::{
    constants::token_type::TokenType,
    error::{
        AppError,
        FormErrorResponse,
    },
    AppState,
};
use actix_web::{
    cookie::time::OffsetDateTime,
    post,
    web,
    HttpResponse,
};
use actix_web_validator::Json;
use argon2::PasswordHasher;
use email_address::EmailAddress;
use nanoid::nanoid;
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::Row;
use time::Duration;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(email(message = "Invalid e-mail"))]
    #[validate(length(min = 3, max = 300, message = "Invalid e-mail length"))]
    email: String,
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
            // Insert a password-reset token
            let token_id = nanoid!(24);

            sqlx::query(
                r#"
                INSERT INTO tokens(id, type, user_id, expires_at)
                VALUES ($1, $2, $3, $4)
                "#,
            )
            .bind(token_id.clone())
            .bind(TokenType::PasswordReset.to_string())
            .bind(user.get::<i64, _>("id"))
            .bind(OffsetDateTime::now_utc() + Duration::weeks(1)) // 1 week
            .execute(&data.db_pool)
            .await?;

            send_recovery_email().await;

            Ok(HttpResponse::NoContent().finish())
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

async fn send_recovery_email() {
    todo!()
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
    use sqlx::PgPool;

    #[sqlx::test(fixtures("user"))]
    async fn can_handle_account_recovery_request(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool).await;

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
        let app = init_app_for_test(post, pool).await;

        let req = test::TestRequest::post()
            .uri("/v1/auth/recovery")
            .set_json(Request {
                email: "invalid@example.com".to_string(),
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
}
