use crate::{
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
use oauth2::{
    CsrfToken,
    Scope,
};
use serde::{
    Deserialize,
    Serialize,
};
use serde_json::Value;
use sqlx::Row;
use storiny_session::Session;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(length(min = 6, max = 64, message = "Invalid password length"))]
    current_password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Response {
    url: String,
}

#[post("/v1/me/settings/accounts/add/google")]
#[tracing::instrument(
    name = "POST /v1/me/settings/accounts/add/google",
    skip_all,
    fields(
        user_id = user.id().ok()
    ),
    err
)]
async fn post(
    payload: Json<Request>,
    data: web::Data<AppState>,
    user: Identity,
    session: Session,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;

    let user = sqlx::query(
        r#"
SELECT
    password,
    login_google_id
FROM users
WHERE id = $1
"#,
    )
    .bind(user_id)
    .fetch_one(&data.db_pool)
    .await?;

    {
        let login_google_id = user.get::<Option<String>, _>("login_google_id");

        if login_google_id.is_some() {
            return Err(
                ToastErrorResponse::new(None, "You have already added a Google account").into(),
            );
        }
    }

    let user_password = user.get::<Option<String>, _>("password");

    if user_password.is_none() {
        return Err(ToastErrorResponse::new(
            None,
            "You need to set a password to add a login account",
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

    let (authorize_url, csrf_token) = &data
        .oauth_client_map
        .google_alt
        .authorize_url(CsrfToken::new_random)
        .add_scopes(vec![
            Scope::new("https://www.googleapis.com/auth/userinfo.email".to_string()),
            Scope::new("https://www.googleapis.com/auth/userinfo.profile".to_string()),
        ])
        .add_extra_param("prompt", "consent")
        .url();

    // Insert the CSRF token into the session. This is validated at the callback endpoint.
    session.insert("oauth_token", Value::from(csrf_token.secret().to_string()));

    Ok(HttpResponse::Ok().json(Response {
        url: authorize_url.to_string(),
    }))
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
        res_to_string,
    };
    use actix_web::test;
    use argon2::{
        password_hash::{
            rand_core::OsRng,
            SaltString,
        },
        PasswordHasher,
    };
    use sqlx::PgPool;

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
    async fn can_request_adding_a_google_account(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, None).await;
        let (password_hash, password) = get_sample_password();

        // Insert the user.
        let result = sqlx::query(
            r#"
INSERT INTO users
    (id, name, username, email, password)
VALUES
    ($1, $2, $3, $4, $5)
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
            .uri("/v1/me/settings/accounts/add/google")
            .set_json(Request {
                current_password: password,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Response>(&res_to_string(res).await);

        assert!(json.is_ok());

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_an_add_google_account_request_for_a_duplicate_account(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, None).await;
        let (password_hash, password) = get_sample_password();

        // Insert the user with `login_google_id`.
        let result = sqlx::query(
            r#"
INSERT INTO users
    (id, name, username, email, password, login_google_id)
VALUES
    ($1, $2, $3, $4, $5, $6)
"#,
        )
        .bind(user_id.unwrap())
        .bind("Sample user")
        .bind("sample_user")
        .bind("sample@example.com")
        .bind(password_hash)
        .bind("0")
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/accounts/add/google")
            .set_json(Request {
                current_password: password,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "You have already added a Google account").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_an_add_google_account_request_for_a_user_without_password(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/accounts/add/google")
            .set_json(Request {
                current_password: "some_random_password".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "You need to set a password to add a login account").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_an_add_google_account_request_for_an_invalid_password(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, None).await;
        let (password_hash, _) = get_sample_password();

        // Insert the user.
        let result = sqlx::query(
            r#"
INSERT INTO users
    (id, name, username, email, password)
VALUES
    ($1, $2, $3, $4, $5)
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
            .uri("/v1/me/settings/accounts/add/google")
            .set_json(Request {
                current_password: "invalid_password".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(res, vec![("current_password", "Invalid password")]).await;

        Ok(())
    }
}
