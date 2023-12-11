use crate::{
    error::{
        AppError,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    utils::generate_recovery_codes::generate_recovery_codes,
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

#[derive(Debug, Serialize, Deserialize)]
struct Response {
    used: bool,
    value: String,
}

#[post("/v1/me/settings/mfa/generate-codes")]
#[tracing::instrument(
    name = "POST /v1/me/settings/mfa/generate-codes",
    skip_all,
    fields(user = user.id().ok()),
    err
)]
async fn post(data: web::Data<AppState>, user: Identity) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    let user = sqlx::query(
        r#"
SELECT mfa_enabled, password FROM users
WHERE id = $1
"#,
    )
    .bind(user_id)
    .fetch_one(&mut *txn)
    .await?;

    if user.get::<Option<String>, _>("password").is_none() {
        return Err(ToastErrorResponse::new(
            None,
            "You need to set a password to generate recovery codes",
        )
        .into());
    }

    if !user.get::<bool, _>("mfa_enabled") {
        return Err(ToastErrorResponse::new(
            None,
            "2-factor authentication is not enabled for your account",
        )
        .into());
    }

    let recovery_codes = generate_recovery_codes()?;

    match sqlx::query(
        r#"
WITH removed_recovery_codes AS (
    DELETE FROM mfa_recovery_codes WHERE user_id = $1
)
INSERT INTO mfa_recovery_codes (code, user_id)
SELECT UNNEST($2::TEXT[]), $1
"#,
    )
    .bind(user_id)
    .bind(&recovery_codes[..])
    .execute(&mut *txn)
    .await?
    .rows_affected()
    {
        0 => Err(AppError::from(
            "did not insert any recovery code into the database",
        )),
        _ => {
            txn.commit().await?;

            Ok(
                HttpResponse::Created().json(recovery_codes.map(|code| Response {
                    used: false,
                    value: code,
                })),
            )
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
        assert_toast_error_response,
        init_app_for_test,
        res_to_string,
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test]
    async fn can_generate_recovery_codes(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Insert the user.
        let result = sqlx::query(
            r#"
INSERT INTO users
    (id, name, username, email, password, mfa_enabled)
VALUES
    ($1, $2, $3, $4, $5, TRUE)
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
            .uri("/v1/me/settings/mfa/generate-codes")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Response>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 10);

        // Should insert recovery codes into the database.
        let result = sqlx::query(
            r#"
SELECT 1 FROM mfa_recovery_codes
WHERE user_id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_all(&mut *conn)
        .await?;

        assert_eq!(result.len(), 10);

        Ok(())
    }

    #[sqlx::test]
    async fn can_delete_old_recovery_codes(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Insert the user.
        let result = sqlx::query(
            r#"
INSERT INTO users
    (id, name, username, email, password, mfa_enabled)
VALUES
    ($1, $2, $3, $4, $5, TRUE)
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

        // Insert a recovery code.
        let result = sqlx::query(
            r#"
INSERT INTO mfa_recovery_codes(code, user_id)
VALUES ($1, $2)
"#,
        )
        .bind("0".repeat(12))
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

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
SELECT EXISTS (
    SELECT 1 FROM mfa_recovery_codes
    WHERE code = $1
)
"#,
        )
        .bind("0".repeat(12))
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_generate_recovery_codes_request_for_a_user_without_password(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/mfa/generate-codes")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "You need to set a password to generate recovery codes")
            .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_generate_recovery_codes_request_for_a_user_with_mfa_disabled(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Insert the user
        let result = sqlx::query(
            r#"
INSERT INTO users
    (id, name, username, email, password, mfa_enabled)
VALUES
    ($1, $2, $3, $4, $5, FALSE)
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
            .uri("/v1/me/settings/mfa/generate-codes")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(
            res,
            "2-factor authentication is not enabled for your account",
        )
        .await;

        Ok(())
    }
}
