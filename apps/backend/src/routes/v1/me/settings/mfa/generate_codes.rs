use crate::{
    error::{AppError, ToastErrorResponse},
    middleware::identity::identity::Identity,
    AppState,
};
use actix_web::{post, web, HttpResponse};
use nanoid::nanoid;
use serde::{Deserialize, Serialize};
use sqlx::Row;

static RECOVERY_CODE_LENGTH: usize = 8;

/// Generates a unique set of 10 random 8-character recovery codes.
fn generate_recovery_codes() -> Result<[String; 10], ()> {
    let character_set: [char; 16] = [
        '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'a', 'b', 'c', 'd', 'e', 'f',
    ];
    let mut recovery_codes: Vec<String> = vec![];

    // Generate recovery codes.
    while recovery_codes.len() < 10 {
        let mut next_recovery_code = nanoid!(RECOVERY_CODE_LENGTH, &character_set).to_string();
        let mut generate_attempts = 0;

        // Make sure the recovery code is unique in the set.
        while recovery_codes.contains(&next_recovery_code) {
            // This case should be rare.
            if generate_attempts >= 100 {
                return Err(());
            }

            generate_attempts = generate_attempts + 1;
            next_recovery_code = nanoid!(RECOVERY_CODE_LENGTH, &character_set).to_string();
        }

        recovery_codes.push(next_recovery_code);
    }

    recovery_codes.try_into().map_err(|_| ())
}

#[derive(Debug, Serialize, Deserialize)]
struct Response {
    used: bool,
    value: String,
}

#[post("/v1/me/settings/mfa/generate-codes")]
async fn post(data: web::Data<AppState>, user: Identity) -> Result<HttpResponse, AppError> {
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

            if db_user.get::<Option<String>, _>("password").is_none() {
                return Ok(HttpResponse::BadRequest()
                    .body("You need to set a password to generate recovery codes"));
            }

            match generate_recovery_codes() {
                Ok(new_recovery_codes) => {
                    match sqlx::query(
                        r#"
                        WITH
                            removed_recovery_codes AS (
                                DELETE FROM mfa_recovery_codes WHERE user_id = $1
                            )
                        INSERT
                        INTO
                            mfa_recovery_codes (code, user_id)
                        SELECT
                            UNNEST($2::CHAR(8)[]),
                            $1
                        "#,
                    )
                    .bind(user_id)
                    .bind(&new_recovery_codes[..])
                    .execute(&data.db_pool)
                    .await?
                    .rows_affected()
                    {
                        0 => Ok(
                            HttpResponse::InternalServerError().json(ToastErrorResponse::new(
                                "Unable to generate recovery codes".to_string(),
                            )),
                        ),
                        _ => Ok(HttpResponse::Created().json(new_recovery_codes.map(|code| {
                            Response {
                                used: false,
                                value: code,
                            }
                        }))),
                    }
                }
                Err(_) => Ok(
                    HttpResponse::InternalServerError().json(ToastErrorResponse::new(
                        "Unable to generate recovery codes".to_string(),
                    )),
                ),
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
    use crate::test_utils::{assert_response_body_text, init_app_for_test, res_to_string};
    use actix_web::test;
    use sqlx::{PgPool, Row};

    #[sqlx::test]
    async fn can_generate_recovery_codes(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true).await;

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
            .uri("/v1/me/settings/mfa/generate-codes")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Response>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 10);

        Ok(())
    }

    #[sqlx::test]
    async fn can_delete_old_recovery_codes(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true).await;

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

        // Insert a recovery code
        let result = sqlx::query(
            r#"
            INSERT INTO mfa_recovery_codes(code, user_id)
            VALUES ($1, $2)
            "#,
        )
        .bind("0".repeat(RECOVERY_CODE_LENGTH))
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Send the request
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/mfa/generate-codes")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Response>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 10);

        // Old recovery code should not be present in the database.
        let result = sqlx::query(
            r#"
            SELECT EXISTS(
                SELECT 1 FROM mfa_recovery_codes
                WHERE code = $1
            )
            "#,
        )
        .bind("0".repeat(RECOVERY_CODE_LENGTH))
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_generate_recovery_codes_request_for_a_user_without_password(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/mfa/generate-codes")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "You need to set a password to generate recovery codes")
            .await;

        Ok(())
    }
}
