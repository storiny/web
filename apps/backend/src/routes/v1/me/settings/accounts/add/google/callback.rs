use crate::{
    constants::account_activity_type::AccountActivityType,
    error::{
        AddAccountError,
        AppError,
    },
    middlewares::identity::identity::Identity,
    oauth::{
        icons::google::GOOGLE_LOGO,
        GoogleOAuthResponse,
    },
    routes::oauth::AuthRequest,
    AddAccountTemplate,
    AppState,
};
use actix_web::{
    get,
    http::header::ContentType,
    web,
    HttpResponse,
};
use actix_web_validator::QsQuery;
use http::header;
use oauth2::{
    AuthorizationCode,
    TokenResponse,
};
use sailfish::TemplateOnce;
use sqlx::Row;
use storiny_session::Session;
use tracing::debug;
use validator::Validate;

#[tracing::instrument(
    skip_all,
    fields(
        user_id = user.id().ok()
    ),
    err
)]
async fn handle_google_callback(
    data: &web::Data<AppState>,
    session: &Session,
    params: &QsQuery<AuthRequest>,
    user: &Identity,
) -> Result<(), AddAccountError> {
    let user_id = user
        .id()
        .map_err(|error| AddAccountError::Other(error.to_string()))?;
    let reqwest_client = &data.reqwest_client;

    let oauth_token = session
        .get::<String>("oauth_token")
        .map_err(|error| AddAccountError::Other(error.to_string()))?;

    // Check whether the CSRF token is missing or has been tampered.
    if oauth_token.is_none() || oauth_token.unwrap_or_default() != params.state {
        return Err(AddAccountError::StateMismatch);
    }

    session.remove("oauth_token");

    let code = AuthorizationCode::new(params.code.clone());
    let token_res = data
        .oauth_client_map
        .google_alt
        .exchange_code(code)
        .request_async(&data.oauth_client)
        .await
        .map_err(|error| AddAccountError::Other(error.to_string()))?;

    // Check if the `userinfo.email` and `userinfo.profile` scopes were granted, required for
    // obtaining the account details.
    let received_scopes = token_res
        .scopes()
        .ok_or(AddAccountError::InsufficientScopes)?
        .iter()
        .map(|scope| scope.as_str())
        .collect::<Vec<_>>();

    debug!(?received_scopes, "scopes received from Google");

    if ![
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
    ]
    .iter()
    .all(|scope| received_scopes.contains(scope))
    {
        return Err(AddAccountError::InsufficientScopes);
    }

    let access_token = token_res.access_token().secret().to_string();

    // Fetch the account details.
    let google_data = reqwest_client
        .get("https://www.googleapis.com/oauth2/v2/userinfo?alt=json")
        .header("Content-type", ContentType::json().to_string())
        .header(header::AUTHORIZATION, format!("Bearer {access_token}"))
        .send()
        .await
        .map_err(|err| AddAccountError::Other(err.to_string()))?
        .json::<GoogleOAuthResponse>()
        .await
        .map_err(|err| AddAccountError::Other(err.to_string()))?;

    // Sanity check.
    google_data
        .validate()
        .map_err(|err| AddAccountError::Other(err.to_string()))?;

    handle_google_profile_data(google_data, data, &user_id).await
}

/// Handles Google account profile data response.
///
/// * `google_data` - The response from the Google OAuth API call.
/// * `data` - The shared API server data.
/// * `user_id` - The ID of the user.
async fn handle_google_profile_data(
    google_data: GoogleOAuthResponse,
    data: &web::Data<AppState>,
    user_id: &i64,
) -> Result<(), AddAccountError> {
    let pg_pool = &data.db_pool;
    let mut txn = pg_pool
        .begin()
        .await
        .map_err(|err| AddAccountError::Other(err.to_string()))?;

    // Checks
    let result = sqlx::query(
        r#"
WITH duplicate_vendor_id AS (
    SELECT 1 FROM users
    WHERE login_google_id = $2
), duplicate_vendor_email AS (
    SELECT 1 FROM users
    WHERE
        email = $3
        AND id <> $1
), current_google_id AS (
    SELECT login_google_id
    FROM users
    WHERE id = $1
)
SELECT
    login_google_id,
    EXISTS (SELECT 1 FROM duplicate_vendor_id) AS "is_duplicate_vendor_id",
    EXISTS (SELECT 1 FROM duplicate_vendor_email) AS "is_duplicate_vendor_email"
FROM current_google_id
"#,
    )
    .bind(user_id)
    .bind(&google_data.id)
    .bind(&google_data.email)
    .fetch_one(&mut *txn)
    .await?;

    if result.get::<Option<String>, _>("login_google_id").is_some() {
        return Err(AddAccountError::DuplicateAccount);
    }

    if result.get::<bool, _>("is_duplicate_vendor_id") {
        return Err(AddAccountError::DuplicateVendorID);
    }

    if result.get::<bool, _>("is_duplicate_vendor_email") {
        return Err(AddAccountError::DuplicateVendorEmail);
    }

    // Update the user and insert an account activity.
    sqlx::query(
        r#"
WITH updated_user AS (
    UPDATE users
    SET login_google_id = $3
    WHERE id = $1
)
INSERT INTO account_activities (type, description, user_id)
VALUES ($2, 'You added <m>Google</m> as a third-party login method.', $1)
"#,
    )
    .bind(user_id)
    .bind(AccountActivityType::ThirdPartyLogin as i16)
    .bind(&google_data.id)
    .execute(&mut *txn)
    .await?;

    txn.commit().await?;

    Ok(())
}

#[get("/v1/me/settings/accounts/add/google/callback")]
#[tracing::instrument(
    name = "GET /v1/me/settings/accounts/add/google/callback",
    skip_all,
    fields(
        user_id = user.id().ok()
    ),
    err
)]
async fn get(
    data: web::Data<AppState>,
    session: Session,
    params: QsQuery<AuthRequest>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    AddAccountTemplate {
        provider_name: "Google".to_string(),
        provider_icon: GOOGLE_LOGO.to_string(),
        error: handle_google_callback(&data, &session, &params, &user)
            .await
            .err(),
    }
    .render_once()
    .map(|body| {
        HttpResponse::Ok()
            .content_type(ContentType::html())
            .body(body)
    })
    .map_err(|error| AppError::InternalError(error.to_string()))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_response_body_text,
        init_app_for_test,
    };
    use actix_web::{
        test,
        Responder,
    };
    use sqlx::PgPool;

    #[get("/add-google-account")]
    async fn get(data: web::Data<AppState>, user: Identity) -> impl Responder {
        let user_id = user.id().unwrap();

        match handle_google_profile_data(
            GoogleOAuthResponse {
                id: "123".to_string(),
                email: "local@example.com".to_string(),
                name: "Test Google account".to_string(),
            },
            &data,
            &user_id,
        )
        .await
        {
            Ok(_) => HttpResponse::Ok().finish(),
            Err(error) => match error {
                AddAccountError::DuplicateAccount => {
                    HttpResponse::BadRequest().body("duplicate_account")
                }
                AddAccountError::DuplicateVendorID => {
                    HttpResponse::BadRequest().body("duplicate_vendor_id")
                }
                AddAccountError::DuplicateVendorEmail => {
                    HttpResponse::BadRequest().body("duplicate_vendor_email")
                }
                _ => HttpResponse::InternalServerError().finish(),
            },
        }
    }

    #[sqlx::test]
    async fn can_add_a_google_account(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/add-google-account")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // User should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT login_google_id
FROM users WHERE id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<Option<String>, _>("login_google_id").is_some());

        // Should insert an account activity.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1
    FROM account_activities
    WHERE type = $1
)
"#,
        )
        .bind(AccountActivityType::ThirdPartyLogin as i16)
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_add_a_google_account_for_the_same_email(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Update email for the current user.
        let result = sqlx::query(
            r#"
UPDATE users
SET email = $2
WHERE id = $1
"#,
        )
        .bind(user_id.unwrap())
        .bind("local@example.com")
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/add-google-account")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // User should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT login_google_id
FROM users WHERE id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<Option<String>, _>("login_google_id").is_some());

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_adding_a_duplicate_google_account(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Add `login_google_id` for the user.
        let result = sqlx::query(
            r#"
UPDATE users
SET login_google_id = '0'
WHERE id = $1
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/add-google-account")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "duplicate_account").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_adding_a_google_account_with_duplicate_id(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, false, None).await;

        // Add another user with the same `login_google_id`.
        let result = sqlx::query(
            r#"
INSERT INTO
users (name, username, email, login_google_id)
VALUES ('Sample user 2', 'sample_user_2', 'sample.2@example.com', $1)
"#,
        )
        .bind("123")
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/add-google-account")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "duplicate_vendor_id").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_adding_a_google_account_with_duplicate_email(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, false, None).await;

        // Add another user with the same email.
        let result = sqlx::query(
            r#"
INSERT INTO
users (name, username, email)
VALUES ('Sample user 2', 'sample_user_2', $1)
"#,
        )
        .bind("local@example.com")
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/add-google-account")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "duplicate_vendor_email").await;

        Ok(())
    }
}
