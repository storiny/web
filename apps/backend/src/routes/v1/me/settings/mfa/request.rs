use crate::{
    error::{
        AppError,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    utils::generate_totp::generate_totp,
    AppState,
};
use actix_web::{
    post,
    web,
    HttpResponse,
};
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::Row;
use totp_rs::Secret;

#[derive(Debug, Serialize, Deserialize)]
struct Response {
    code: String,
    qr: String,
}

#[post("/v1/me/settings/mfa/request")]
async fn post(data: web::Data<AppState>, user: Identity) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => {
            let pg_pool = &data.db_pool;
            let mut txn = pg_pool.begin().await?;

            let db_user = sqlx::query(
                r#"
                SELECT
                    mfa_enabled,
                    username,
                    password
                FROM users
                WHERE id = $1
                "#,
            )
            .bind(user_id)
            .fetch_one(&mut *txn)
            .await?;

            if db_user.get::<Option<String>, _>("password").is_none() {
                return Ok(HttpResponse::BadRequest()
                    .body("You need to set a password to enable 2-factor authentication"));
            }

            if db_user.get::<bool, _>("mfa_enabled") {
                return Ok(HttpResponse::BadRequest().json(ToastErrorResponse::new(
                    "2-factor authentication is already enabled for your account",
                )));
            }

            let secret = Secret::generate_secret();
            let secret_as_bytes = secret.to_bytes();

            if secret_as_bytes.is_err() {
                return Ok(HttpResponse::InternalServerError().finish());
            }

            match generate_totp(
                secret_as_bytes.unwrap(),
                &db_user.get::<String, _>("username"),
            ) {
                Ok(totp) => {
                    let qr_code = totp.get_qr_base64();

                    if qr_code.is_err() {
                        return Ok(HttpResponse::InternalServerError().finish());
                    }

                    // Save the TOTP secret
                    sqlx::query(
                        r#"
                        UPDATE users
                        SET mfa_secret = $1
                        WHERE id = $2
                        "#,
                    )
                    .bind(secret.to_encoded().to_string())
                    .bind(user_id)
                    .execute(&mut *txn)
                    .await?;

                    txn.commit().await?;

                    Ok(HttpResponse::Ok().json(Response {
                        code: totp.get_secret_base32().to_lowercase(),
                        qr: format!("data:image/png;base64,{}", qr_code.unwrap()),
                    }))
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
        assert_response_body_text,
        assert_toast_error_response,
        init_app_for_test,
        res_to_string,
    };
    use actix_web::test;
    use sqlx::PgPool;

    #[sqlx::test]
    async fn can_request_mfa(pool: PgPool) -> sqlx::Result<()> {
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
        .bind("sample@example.com")
        .bind("sample_hashed_password")
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Send the request
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/mfa/request")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Response>(&res_to_string(res).await);

        assert!(json.is_ok());

        // Should also update `mfa_secret` in the database
        let result = sqlx::query(
            r#"
            SELECT mfa_secret FROM users
            WHERE id = $1
            "#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<Option<String>, _>("mfa_secret").is_some());

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_mfa_request_for_a_user_without_password(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/mfa/request")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(
            res,
            "You need to set a password to enable 2-factor authentication",
        )
        .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_mfa_request_for_a_user_with_mfa_already_enabled(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Insert the user
        let result = sqlx::query(
            r#"
            INSERT INTO users(id, name, username, email, password, mfa_enabled)
            VALUES ($1, $2, $3, $4, $5, TRUE)
            "#,
        )
        .bind(user_id.unwrap())
        .bind("Sample user")
        .bind("sample_user")
        .bind("sample@example.com")
        .bind("sample_hashed_password")
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/mfa/request")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(
            res,
            "2-factor authentication is already enabled for your account",
        )
        .await;

        Ok(())
    }
}
