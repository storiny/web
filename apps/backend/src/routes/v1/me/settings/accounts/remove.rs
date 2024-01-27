use crate::{
    constants::account_activity_type::AccountActivityType,
    error::{
        AppError,
        FormErrorResponse,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_web::{
    http::StatusCode,
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
use lazy_static::lazy_static;
use regex::Regex;
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::Row;
use validator::Validate;

// TODO: Modify once we support Apple as an identity provider.
lazy_static! {
    static ref VENDOR_REGEX: Regex = {
        #[allow(clippy::unwrap_used)]
        Regex::new(r"^(google)$").unwrap()
    };
}

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(regex = "VENDOR_REGEX")]
    vendor: String,
    #[validate(length(min = 6, max = 64, message = "Invalid password length"))]
    current_password: String,
}

#[post("/v1/me/settings/accounts/remove")]
#[tracing::instrument(
    name = "POST /v1/me/settings/accounts/remove",
    skip_all,
    fields(
        user_id = user.id().ok(),
        vendor = %payload.vendor
    ),
    err
)]
async fn post(
    payload: Json<Request>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;

    let user = sqlx::query(
        r#"
SELECT password FROM users
WHERE id = $1
"#,
    )
    .bind(user_id)
    .fetch_one(&data.db_pool)
    .await?;

    let user_password = user.get::<Option<String>, _>("password");

    if user_password.is_none() {
        return Err(ToastErrorResponse::new(
            None,
            "You need to set a password to remove your login accounts",
        )
        .into());
    }

    let user_password = user_password.unwrap_or_default();
    let password_hash = PasswordHash::new(&user_password)
        .map_err(|error| AppError::InternalError(error.to_string()))?;

    Argon2::default()
        .verify_password(payload.current_password.as_bytes(), &password_hash)
        .map_err(|_| {
            AppError::FormError(FormErrorResponse::new(
                Some(StatusCode::FORBIDDEN),
                vec![("current_password", "Invalid password")],
            ))
        })?;

    if payload.vendor == "apple" {
        sqlx::query(
            r#"
WITH updated_user AS (
    UPDATE users
    SET login_apple_id = NULL
    WHERE id = $1
)
INSERT INTO account_activities (type, description, user_id)
VALUES ($2, 'You removed <m>Apple</m> as a third-party login method.', $1)
"#,
        )
        .bind(user_id)
        .bind(AccountActivityType::ThirdPartyLogin as i16)
        .execute(&data.db_pool)
        .await?;
    } else {
        sqlx::query(
            r#"
WITH updated_user AS (
    UPDATE users
    SET login_google_id = NULL
    WHERE id = $1
)
INSERT INTO account_activities (type, description, user_id)
VALUES ($2, 'You removed <m>Google</m> as a third-party login method.', $1)
"#,
        )
        .bind(user_id)
        .bind(AccountActivityType::ThirdPartyLogin as i16)
        .execute(&data.db_pool)
        .await?;
    }

    Ok(HttpResponse::NoContent().finish())
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_form_error_response,
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

    /// Returns a sample hashed password.
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
    async fn can_remove_login_accounts(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;
        let (password_hash, password) = get_sample_password();

        // Insert the user.
        let result = sqlx::query(
            r#"
INSERT INTO users
    (id, name, username, email, password, login_apple_id, login_google_id)
VALUES
    ($1, $2, $3, $4, $5, $6, $7)
"#,
        )
        .bind(user_id.unwrap())
        .bind("Sample user")
        .bind("sample_user")
        .bind("sample@example.com")
        .bind(password_hash)
        .bind("sample-apple-id")
        .bind("sample-google-id")
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // TODO: Uncomment when we support Apple as an identity provider.
        // // Remove Apple login account
        // let req = test::TestRequest::post()
        //     .cookie(cookie.clone().unwrap())
        //     .uri("/v1/me/settings/accounts/remove")
        //     .set_json(Request {
        //         vendor: "apple".to_string(),
        //         current_password: password.to_string(),
        //     })
        //     .to_request();
        // let res = test::call_service(&app, req).await;
        //
        // assert!(res.status().is_success());
        //
        // // Login account should not be present in the database
        // let result = sqlx::query(
        //     r#"
        //     SELECT login_apple_id FROM users
        //     WHERE id = $1
        //     "#,
        // )
        // .bind(user_id.unwrap())
        // .fetch_one(&mut *conn)
        // .await?;
        //
        // assert!(result.get::<Option<String>, _>("login_apple_id").is_none());
        //
        // // Should also insert an account activity (for Apple)
        // let result = sqlx::query(
        //     r#"
        //     SELECT description FROM account_activities
        //     WHERE user_id = $1 AND type = $2
        //     ORDER BY created_at DESC
        //     LIMIT 1
        //     "#,
        // )
        // .bind(user_id.unwrap())
        // .bind(AccountActivityType::ThirdPartyLogin as i16)
        // .fetch_one(&mut *conn)
        // .await?;
        //
        // assert_eq!(
        //     result.get::<String, _>("description"),
        //     "You removed <m>Apple</m> as a third-party login method.".to_string()
        // );

        // Remove Google login account
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/accounts/remove")
            .set_json(Request {
                vendor: "google".to_string(),
                current_password: password.to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Login account should not be present in the database.
        let result = sqlx::query(
            r#"
SELECT login_google_id FROM users
WHERE id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<Option<String>, _>("login_google_id").is_none());

        // Should also insert an account activity (for Google).
        let result = sqlx::query(
            r#"
SELECT description FROM account_activities
WHERE user_id = $1 AND type = $2
ORDER BY created_at DESC
LIMIT 1
"#,
        )
        .bind(user_id.unwrap())
        .bind(AccountActivityType::ThirdPartyLogin as i16)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("description"),
            "You removed <m>Google</m> as a third-party login method.".to_string()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_removing_a_login_account_for_a_user_without_password(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/accounts/remove")
            .set_json(Request {
                vendor: "google".to_string(),
                current_password: "sample".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(
            res,
            "You need to set a password to remove your login accounts",
        )
        .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_removing_a_login_account_for_an_invalid_password(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;
        let (password_hash, _) = get_sample_password();

        // Insert the user.
        let result = sqlx::query(
            r#"
INSERT INTO users
    (id, name, username, email, password, login_apple_id, login_google_id)
VALUES
    ($1, $2, $3, $4, $5, $6, $7)
"#,
        )
        .bind(user_id.unwrap())
        .bind("Sample user")
        .bind("sample_user")
        .bind("sample@example.com")
        .bind(password_hash)
        .bind("sample-apple-id")
        .bind("sample-google-id")
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Remove Google login account
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/settings/accounts/remove")
            .set_json(Request {
                vendor: "google".to_string(),
                current_password: "invalid".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(res, vec![("current_password", "Invalid password")]).await;

        Ok(())
    }
}
