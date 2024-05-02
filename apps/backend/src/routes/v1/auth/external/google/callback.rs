use crate::{
    constants::{
        notification_entity_type::NotificationEntityType,
        user_flag::UserFlag,
    },
    error::{
        AppError,
        ExternalAuthError,
    },
    middlewares::identity::identity::Identity,
    oauth::{
        icons::google::GOOGLE_LOGO,
        GoogleOAuthResponse,
    },
    routes::oauth::AuthRequest,
    utils::{
        clear_user_sessions::clear_user_sessions,
        flag::{
            Flag,
            Mask,
        },
        generate_random_username::generate_random_username,
        get_client_device::get_client_device,
        get_client_location::get_client_location,
        get_user_sessions::get_user_sessions,
        truncate_str::truncate_str,
    },
    AppState,
    ExternalAuthTemplate,
};
use actix_http::{
    header,
    HttpMessage,
};
use actix_web::{
    get,
    http::header::ContentType,
    web,
    HttpRequest,
    HttpResponse,
};
use actix_web_validator::QsQuery;
use oauth2::{
    AuthorizationCode,
    TokenResponse,
};
use sailfish::TemplateOnce;
use sqlx::Row;
use std::net::IpAddr;
use storiny_session::Session;
use time::OffsetDateTime;
use tracing::{
    debug,
    error,
};
use url::Url;
use validator::Validate;

#[tracing::instrument(skip_all, err)]
async fn handle_oauth_request(
    req: HttpRequest,
    data: &web::Data<AppState>,
    session: &Session,
    params: &QsQuery<AuthRequest>,
) -> Result<bool, ExternalAuthError> {
    let reqwest_client = &data.reqwest_client;

    let oauth_token = session
        .get::<String>("oauth_token")
        .map_err(|error| ExternalAuthError::Other(error.to_string()))?;

    // Check whether the CSRF token is missing or has been tampered.
    if oauth_token.is_none() || oauth_token.unwrap_or_default() != params.state {
        return Err(ExternalAuthError::StateMismatch);
    }

    session.remove("oauth_token");

    let code = AuthorizationCode::new(params.code.clone());
    let token_res = data
        .oauth_client_map
        .google
        .exchange_code(code)
        .request_async(&data.oauth_client)
        .await
        .map_err(|error| ExternalAuthError::Other(error.to_string()))?;

    // Check if the `userinfo.email` and `userinfo.profile` scopes were granted, required for
    // obtaining the account details.
    let received_scopes = token_res
        .scopes()
        .ok_or(ExternalAuthError::InsufficientScopes)?
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
        return Err(ExternalAuthError::InsufficientScopes);
    }

    let access_token = token_res.access_token().secret().to_string();

    // Fetch the account details.
    let google_data = reqwest_client
        .get("https://www.googleapis.com/oauth2/v2/userinfo?alt=json")
        .header("Content-type", ContentType::json().to_string())
        .header(
            http::header::AUTHORIZATION,
            format!("Bearer {access_token}"),
        )
        .send()
        .await
        .map_err(|err| ExternalAuthError::Other(err.to_string()))?
        .json::<GoogleOAuthResponse>()
        .await
        .map_err(|err| ExternalAuthError::Other(err.to_string()))?;

    // Sanity check.
    google_data
        .validate()
        .map_err(|err| ExternalAuthError::Other(err.to_string()))?;

    handle_google_profile_data(google_data, req, data, session).await
}

/// Handles Google account profile data response. It creates a session if the user has previously
/// signed-in using Google, otherwise inserts a new user with the data based on the Google
/// account profile response into the database.
///
/// * `google_data` - The response from the Google OAuth API call.
/// * `req` - The HTTP request.
/// * `data` - The shared API server data.
/// * `session` - The session instance for the user.
async fn handle_google_profile_data(
    google_data: GoogleOAuthResponse,
    req: HttpRequest,
    data: &web::Data<AppState>,
    session: &Session,
) -> Result<bool, ExternalAuthError> {
    let pg_pool = &data.db_pool;
    let mut txn = pg_pool
        .begin()
        .await
        .map_err(|err| ExternalAuthError::Other(err.to_string()))?;

    let mut is_first_login = false;

    let user_data = match sqlx::query(
        r#"
SELECT
    id,
    public_flags,
    deleted_at,
    deactivated_at
FROM users
WHERE login_google_id = $1
"#,
    )
    .bind(&google_data.id)
    .fetch_one(&mut *txn)
    .await
    {
        Ok(result) => (
            result.get::<i64, _>("id"),
            result.get::<i32, _>("public_flags"),
            result.get::<Option<OffsetDateTime>, _>("deactivated_at"),
            result.get::<Option<OffsetDateTime>, _>("deleted_at"),
        ),
        Err(err) => {
            if matches!(err, sqlx::Error::RowNotFound) {
                is_first_login = true;

                let insert_result = sqlx::query(
                    r#"
INSERT INTO users (name, username, email, login_google_id, last_login_at, email_verified)
VALUES ($1, $2, $3, $4, NOW(), TRUE)
RETURNING
    id,
    public_flags
"#,
                )
                .bind(truncate_str(&google_data.name, 32))
                .bind(
                    generate_random_username(&google_data.name, &mut txn)
                        .await
                        .map_err(|error| {
                            ExternalAuthError::Other(format!(
                                "unable to generate a random username: {:?}",
                                error
                            ))
                        })?,
                )
                .bind(&google_data.email)
                .bind(&google_data.id)
                .fetch_one(&mut *txn)
                .await
                .map_err(|error| {
                    if let Some(db_err) = error.as_database_error() {
                        let error_kind = db_err.kind();

                        // Email is already used by some other Storiny account.
                        if matches!(error_kind, sqlx::error::ErrorKind::UniqueViolation) {
                            return ExternalAuthError::DuplicateEmail;
                        }
                    }

                    ExternalAuthError::Other(error.to_string())
                })?;

                (
                    insert_result.get::<i64, _>("id"),
                    insert_result.get::<i32, _>("public_flags"),
                    None,
                    None,
                )
            } else {
                return Err(ExternalAuthError::Other(err.to_string()));
            }
        }
    };

    let user_id = user_data.0;

    // Check whether the user can currently log in.
    {
        let (_, public_flags, deactivated_at, deleted_at) = user_data;

        if deleted_at.is_some() {
            return Err(ExternalAuthError::UserDeleted);
        } else if deactivated_at.is_some() {
            return Err(ExternalAuthError::UserDeactivated);
        }

        let user_flags = Flag::new(public_flags as u32);

        // User suspended
        if user_flags.has_any_of(Mask::Multiple(vec![
            UserFlag::TemporarilySuspended,
            UserFlag::PermanentlySuspended,
        ])) {
            return Err(ExternalAuthError::UserSuspended);
        }
    }

    let mut client_device_value = "Unknown device".to_string();
    let mut client_location_value: Option<String> = None;

    // Insert additional data into the session.
    {
        if let Some(ip) = req.connection_info().realip_remote_addr() {
            if let Ok(parsed_ip) = ip.parse::<IpAddr>() {
                if let Some(client_location_result) = get_client_location(parsed_ip, &data.geo_db) {
                    client_location_value = Some(client_location_result.display_name.to_string());

                    if let Ok(client_location) = serde_json::to_value(client_location_result) {
                        session.insert("location", client_location);
                    }
                }
            }
        }

        if let Some(origin) = req.headers().get(actix_http::header::ORIGIN) {
            if let Ok(url) = Url::parse(origin.to_str().unwrap_or_default()) {
                if let Some(domain) = url.domain() {
                    match domain {
                        "storiny.com" => {}
                        "www.storiny.com" => {}
                        _ => {
                            if domain.chars().count() < 256 {
                                if let Ok(domain) = serde_json::to_value(domain) {
                                    session.insert("domain", domain);
                                }
                            }
                        }
                    }
                }
            }
        }

        if let Some(ua_header) = req.headers().get("user-agent") {
            if let Ok(ua) = ua_header.to_str() {
                let client_device_result = get_client_device(ua, &data.ua_parser);
                client_device_value = client_device_result.display_name.to_string();

                if let Ok(client_device) = serde_json::to_value(client_device_result) {
                    session.insert("device", client_device);
                }
            }
        }
    }

    if !is_first_login {
        // Update the `last_login_at` column and insert a login notification for the user.
        sqlx::query(
            r#"
WITH updated_user AS (
    UPDATE users
    SET last_login_at = NOW()
    WHERE id = $2
), inserted_notification AS (
    INSERT INTO notifications (entity_type)
    VALUES ($1)
    RETURNING id
)
INSERT
INTO
    notification_outs (
        notified_id,
        notification_id,
        rendered_content
    )
SELECT
    $2, (SELECT id FROM inserted_notification), $3
"#,
        )
        .bind(NotificationEntityType::LoginAttempt as i16)
        .bind(user_id)
        .bind(if let Some(location) = client_location_value {
            format!("{client_device_value}:{location}")
        } else {
            client_device_value
        })
        .execute(&mut *txn)
        .await?;
    }

    txn.commit().await?;

    // Check if the user maintains more than or equal to 10 sessions, and
    // delete all the previous sessions if the current number of active
    // sessions for the user exceeds the per user session limit (10).
    match get_user_sessions(&data.redis, user_id).await {
        Ok(sessions) => {
            if sessions.len() >= 10 {
                match clear_user_sessions(&data.redis, user_id).await {
                    Ok(_) => {}
                    Err(error) => {
                        error!(?error, "unable to clear user sessions");

                        return Err(ExternalAuthError::Other(
                            "unable to clear user sessions".to_string(),
                        ));
                    }
                };
            }
        }
        Err(error) => {
            error!(?error, "unable to fetch user sessions");

            return Err(ExternalAuthError::Other(
                "unable to fetch user sessions".to_string(),
            ));
        }
    };

    Identity::login(&req.extensions(), user_id)
        .map(|_| ())
        .map_err(|err| ExternalAuthError::Other(err.to_string()))?;

    Ok(is_first_login)
}

#[get("/v1/auth/external/google/callback")]
#[tracing::instrument(name = "GET /v1/auth/external/google/callback", skip_all, err)]
async fn get(
    req: HttpRequest,
    data: web::Data<AppState>,
    params: QsQuery<AuthRequest>,
    session: Session,
) -> Result<HttpResponse, AppError> {
    match handle_oauth_request(req, &data, &session, &params).await {
        // Redirect to the web server location on successful login.
        Ok(is_first_login) => Ok(HttpResponse::Found()
            .append_header((
                header::LOCATION,
                if is_first_login {
                    format!("{}?onboarding=true", data.config.web_server_url)
                } else {
                    data.config.web_server_url.to_string()
                },
            ))
            .finish()),
        Err(error) => ExternalAuthTemplate {
            provider_name: "Google".to_string(),
            provider_icon: GOOGLE_LOGO.to_string(),
            error,
        }
        .render_once()
        .map(|body| {
            HttpResponse::Ok()
                .content_type(ContentType::html())
                .body(body)
        })
        .map_err(|error| AppError::InternalError(error.to_string())),
    }
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

    #[get("/google-login")]
    async fn get(req: HttpRequest, data: web::Data<AppState>, session: Session) -> impl Responder {
        match handle_google_profile_data(
            GoogleOAuthResponse {
                id: "1".to_string(),
                email: "someone@example.com".to_string(),
                name: "Test Google account".to_string(),
            },
            req,
            &data,
            &session,
        )
        .await
        {
            Ok(_) => HttpResponse::Ok().finish(),
            Err(error) => match error {
                ExternalAuthError::UserDeleted => HttpResponse::BadRequest().body("user_deleted"),
                ExternalAuthError::UserDeactivated => {
                    HttpResponse::BadRequest().body("user_deactivated")
                }
                ExternalAuthError::UserSuspended => {
                    HttpResponse::BadRequest().body("user_suspended")
                }
                ExternalAuthError::DuplicateEmail => {
                    HttpResponse::BadRequest().body("duplicate_email")
                }
                _ => HttpResponse::InternalServerError().finish(),
            },
        }
    }

    #[sqlx::test]
    async fn can_login_using_google(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, _) = init_app_for_test(get, pool, false, false, None).await;

        let req = test::TestRequest::get().uri("/google-login").to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // New user should be present in the database.
        let result = sqlx::query(
            r#"
SELECT email_verified FROM users
WHERE login_google_id = $1
"#,
        )
        .bind("1")
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("email_verified"));

        // Should not insert a notification for new user.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT
        1
    FROM
        notification_outs
    WHERE
        notification_id = (
            SELECT id FROM notifications
            WHERE entity_type = $1
        )
    )
"#,
        )
        .bind(NotificationEntityType::LoginAttempt as i16)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        // Should set `last_login_at` for the new user.
        let result = sqlx::query(
            r#"
SELECT last_login_at
FROM users
WHERE login_google_id = $1
"#,
        )
        .bind("1")
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("last_login_at")
                .is_some()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_login_using_google_for_an_existing_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Update `login_google_id` for the current user.
        let result = sqlx::query(
            r#"
UPDATE users
SET login_google_id = $1
WHERE id = $2
"#,
        )
        .bind("1")
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get().uri("/google-login").to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // New user should not be inserted in the database.
        let result = sqlx::query(r#"SELECT 1 FROM users"#)
            .fetch_all(&mut *conn)
            .await?;

        assert_eq!(result.len(), 1);

        // Should insert a notification
        let result = sqlx::query(
            r#"
SELECT
EXISTS (
    SELECT
        1
    FROM
        notification_outs
    WHERE
        notification_id = (
            SELECT id FROM notifications
            WHERE entity_type = $1
    )
)
"#,
        )
        .bind(NotificationEntityType::LoginAttempt as i16)
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("exists"));

        // Should update `last_login_at` for the user.
        let result = sqlx::query(
            r#"
SELECT last_login_at
FROM users
WHERE id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("last_login_at")
                .is_some()
        );

        Ok(())
    }

    //

    #[sqlx::test]
    async fn can_reject_google_login_for_a_temporarily_suspended_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, user_id) = init_app_for_test(get, pool, true, false, None).await;

        let mut flags = Flag::new(0);
        flags.add_flag(UserFlag::TemporarilySuspended);

        // Update the current user.
        let result = sqlx::query(
            r#"
UPDATE users
SET
    public_flags = $1,
    login_google_id = $2
WHERE id = $3
"#,
        )
        .bind(flags.get_flags() as i32)
        .bind("1")
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get().uri("/google-login").to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "user_suspended").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_google_login_for_a_permanently_suspended_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, user_id) = init_app_for_test(get, pool, true, false, None).await;

        let mut flags = Flag::new(0);
        flags.add_flag(UserFlag::PermanentlySuspended);

        // Update the current user.
        let result = sqlx::query(
            r#"
UPDATE users
SET
    public_flags = $1,
    login_google_id = $2
WHERE id = $3
"#,
        )
        .bind(flags.get_flags() as i32)
        .bind("1")
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get().uri("/google-login").to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "user_suspended").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_google_login_for_a_soft_deleted_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Update `login_google_id` and soft-delete the current user.
        let result = sqlx::query(
            r#"
UPDATE users
SET
    deleted_at = NOW(),
    login_google_id = $1
WHERE id = $2
"#,
        )
        .bind("1")
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get().uri("/google-login").to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "user_deleted").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_google_login_for_a_deactivated_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Update `login_google_id` and deactivate the current user.
        let result = sqlx::query(
            r#"
UPDATE users
SET
    deactivated_at = NOW(),
    login_google_id = $1
WHERE id = $2
"#,
        )
        .bind("1")
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get().uri("/google-login").to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "user_deactivated").await;

        Ok(())
    }

    //

    #[sqlx::test]
    async fn can_reject_a_new_google_login_for_a_duplicate_email(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, _) = init_app_for_test(get, pool, false, false, None).await;

        // Insert a random user with the same email.
        let result = sqlx::query(
            r#"
INSERT INTO
users (name, username, email)
VALUES ('Sample user 2', 'sample_user_2', $1)
"#,
        )
        .bind("someone@example.com")
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get().uri("/google-login").to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "duplicate_email").await;

        Ok(())
    }
}
