use crate::{
    constants::{
        account_activity_type::AccountActivityType,
        reserved_keywords::RESERVED_KEYWORDS,
        sql_states::SqlState,
        username_regex::USERNAME_REGEX,
    },
    error::{
        AppError,
        FormErrorResponse,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_http::StatusCode;
use actix_web::{
    patch,
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
use slugify::slugify;
use sqlx::Row;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(regex = "USERNAME_REGEX")]
    #[validate(length(min = 3, max = 24, message = "Invalid username length"))]
    new_username: String,
    #[validate(length(min = 6, max = 64, message = "Invalid password length"))]
    current_password: String,
}

#[patch("/v1/me/settings/username")]
#[tracing::instrument(
    name = "PATCH /v1/me/settings/username",
    skip_all,
    fields(
        user = user.id().ok(),
        new_username = %payload.new_username
    ),
    err
)]
async fn patch(
    payload: Json<Request>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    let user = sqlx::query(
        r#"
SELECT password FROM users
WHERE id = $1
"#,
    )
    .bind(user_id)
    .fetch_one(&mut *txn)
    .await?;

    let user_password = user.get::<Option<String>, _>("password");

    if user_password.is_none() {
        return Err(ToastErrorResponse::new(
            None,
            "You need to set a password to change your username",
        )
        .into());
    }

    // Validate the current password.
    {
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
    }

    let slugged_username = slugify!(&payload.new_username, separator = "_", max_length = 24);

    // Check if username is reserved.
    if RESERVED_KEYWORDS.contains(&slugged_username.as_str()) {
        return Err(FormErrorResponse::new(
            Some(StatusCode::FORBIDDEN),
            vec![("new_username", "This username is not available")],
        )
        .into());
    }

    match sqlx::query(
        r#"
WITH updated_user AS (
    UPDATE users
    SET
        username = $2,
        username_modified_at = NOW()
    WHERE id = $1
)
INSERT INTO account_activities (type, description, user_id)
VALUES (
    $3,
    'You changed your username to <m>' || '@' || $2 || '</m>',
    $1
)
"#,
    )
    .bind(user_id)
    .bind(&slugged_username)
    .bind(AccountActivityType::Username as i16)
    .execute(&mut *txn)
    .await
    {
        Ok(_) => {
            txn.commit().await?;

            Ok(HttpResponse::NoContent().finish())
        }
        Err(error) => {
            if let Some(db_err) = error.as_database_error() {
                // Check whether the new username is already in use.
                if matches!(db_err.kind(), sqlx::error::ErrorKind::UniqueViolation) {
                    return Err(AppError::FormError(FormErrorResponse::new(
                        Some(StatusCode::CONFLICT),
                        vec![("new_username", "This username is already in use")],
                    )));
                }

                let error_code = db_err.code().unwrap_or_default();

                // Check if the username is on a cooldown period.
                if error_code == SqlState::UsernameCooldown.to_string() {
                    return Err(AppError::FormError(FormErrorResponse::new(
                        Some(StatusCode::TOO_MANY_REQUESTS),
                        vec![(
                            "new_username",
                            "You can only change your username once a month",
                        )],
                    )));
                }
            }

            Err(AppError::SqlxError(error))
        }
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(patch);
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
    use time::OffsetDateTime;

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
    async fn can_update_username(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, true, Some(1_i64)).await;
        let (password_hash, password) = get_sample_password();

        // Insert the user.
        let result = sqlx::query(
            r#"
INSERT INTO users (id, name, username, email, password)
VALUES ($1, $2, $3, $4, $5)
"#,
        )
        .bind(user_id.unwrap())
        .bind("Sample user")
        .bind("old_username")
        .bind("sample@example.com")
        .bind(password_hash)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/username")
            .set_json(Request {
                new_username: "new_username".to_string(),
                current_password: password.to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Username should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT username, username_modified_at FROM users
WHERE id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("username"),
            "new_username".to_string()
        );
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("username_modified_at")
                .is_some()
        );

        // Should also insert an account activity.
        let result = sqlx::query(
            r#"
SELECT description FROM account_activities
WHERE user_id = $1 AND type = $2
"#,
        )
        .bind(user_id.unwrap())
        .bind(AccountActivityType::Username as i16)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("description"),
            "You changed your username to <m>@new_username</m>".to_string()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_an_update_username_request_for_a_user_without_password(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(patch, pool, true, false, None).await;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/username")
            .set_json(Request {
                new_username: "sample_username".to_string(),
                current_password: "sample".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "You need to set a password to change your username")
            .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_an_update_username_request_for_an_invalid_password(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, true, Some(1_i64)).await;

        let (password_hash, _) = get_sample_password();

        // Insert the user.
        let result = sqlx::query(
            r#"
INSERT INTO users (id, name, username, email, password)
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
            .uri("/v1/me/settings/username")
            .set_json(Request {
                new_username: "new_username".to_string(),
                current_password: "invalid".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(res, vec![("current_password", "Invalid password")]).await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_an_update_username_request_for_a_duplicate_username(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, true, Some(1_i64)).await;

        let (password_hash, password) = get_sample_password();

        // Insert the user.
        let result = sqlx::query(
            r#"
INSERT INTO users (id, name, username, email, password)
VALUES ($1, $2, $3, $4, $5)
"#,
        )
        .bind(user_id.unwrap())
        .bind("Sample user 1")
        .bind("old_username")
        .bind("sample.1@example.com")
        .bind(password_hash)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Insert another user.
        let result = sqlx::query(
            r#"
INSERT INTO users (id, name, username, email)
VALUES ($1, $2, $3, $4)
"#,
        )
        .bind(2_i64)
        .bind("Sample user 2")
        .bind("new_username")
        .bind("sample.2@example.com")
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/username")
            .set_json(Request {
                new_username: "new_username".to_string(),
                current_password: password.to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(
            res,
            vec![("new_username", "This username is already in use")],
        )
        .await;

        // Should not insert an account activity.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM account_activities
    WHERE user_id = $1 AND type = $2
)
"#,
        )
        .bind(user_id.unwrap())
        .bind(AccountActivityType::Username as i16)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_an_update_username_request_for_a_reserved_username(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, true, Some(1_i64)).await;

        let (password_hash, password) = get_sample_password();

        // Insert the user.
        let result = sqlx::query(
            r#"
INSERT INTO users (id, name, username, email, password)
VALUES ($1, $2, $3, $4, $5)
"#,
        )
        .bind(user_id.unwrap())
        .bind("Sample user 1")
        .bind("old_username")
        .bind("sample.1@example.com")
        .bind(password_hash)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/username")
            .set_json(Request {
                new_username: RESERVED_KEYWORDS[10].to_string(),
                current_password: password.to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(
            res,
            vec![("new_username", "This username is not available")],
        )
        .await;

        // Should not insert an account activity.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM account_activities
    WHERE user_id = $1 AND type = $2
)
"#,
        )
        .bind(user_id.unwrap())
        .bind(AccountActivityType::Username as i16)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_an_update_username_request_for_an_account_on_cooldown_period(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, true, Some(1_i64)).await;

        let (password_hash, password) = get_sample_password();

        // Insert the user with recent `username_modified_at`.
        let result = sqlx::query(
            r#"
INSERT INTO users (id, name, username, email, password, username_modified_at)
VALUES ($1, $2, $3, $4, $5, NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind("Sample user 1")
        .bind("old_username")
        .bind("sample.1@example.com")
        .bind(password_hash)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/username")
            .set_json(Request {
                new_username: "new_username".to_string(),
                current_password: password.to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(
            res,
            vec![(
                "new_username",
                "You can only change your username once a month",
            )],
        )
        .await;

        Ok(())
    }
}
