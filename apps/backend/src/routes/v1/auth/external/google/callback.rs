use crate::{
    error::{
        AppError,
        ExternalAuthError,
    },
    middlewares::identity::identity::Identity,
    models::notification::NotificationEntityType,
    routes::oauth::AuthRequest,
    utils::{
        clear_user_sessions::clear_user_sessions,
        generate_random_username::generate_random_username,
        get_client_device::get_client_device,
        get_client_location::get_client_location,
        get_user_sessions::get_user_sessions,
        truncate_str::truncate_str,
    },
    AppState,
    ExternalAuthErrorTemplate,
};
use actix_extended_session::Session;
use actix_http::HttpMessage;
use actix_web::{
    get,
    http::header::{
        self,
        ContentType,
    },
    web,
    HttpRequest,
    HttpResponse,
};
use actix_web_validator::QsQuery;
use oauth2::{
    reqwest::async_http_client,
    AuthorizationCode,
    TokenResponse,
};
use sailfish::TemplateOnce;
use serde::Deserialize;
use sqlx::Row;
use std::net::IpAddr;
use time::OffsetDateTime;
use validator::Validate;

/// A [Google OAuth V2 API](https://www.googleapis.com/oauth2/v2/userinfo) endpoint response.
#[derive(Debug, Deserialize, Validate)]
struct Response {
    /// The name of the Google account.
    #[validate(length(min = 3))]
    name: String,
    /// The email address of the Google account.
    #[validate(email)]
    #[validate(length(min = 3, max = 300))]
    email: String,
    /// The unique ID that identifies this Google account.
    #[validate(length(min = 3, max = 256))]
    id: String,
}

async fn handle_oauth_request(
    req: HttpRequest,
    data: &web::Data<AppState>,
    session: &Session,
    params: &QsQuery<AuthRequest>,
) -> Result<(), ExternalAuthError> {
    let oauth_token = session
        .get::<String>("oauth_token")
        .map_err(|_| ExternalAuthError::Other)?
        .ok_or(ExternalAuthError::Other)?;

    // Check whether the CSRF token has been tampered
    if oauth_token != params.state {
        return Err(ExternalAuthError::StateMismatch);
    }

    // Remove the CSRF token from the session.
    session.remove("oauth_token");

    let reqwest_client = &data.reqwest_client;
    let code = AuthorizationCode::new(params.code.clone());
    let token_res = (&data.oauth_client_map.youtube)
        .exchange_code(code)
        .request_async(async_http_client)
        .await
        .map_err(|_| ExternalAuthError::Other)?;

    // Check if the `userinfo.email` and `userinfo.profile` scopes were granted, required for
    // obtaining the account details.
    if !token_res
        .scopes()
        .ok_or(ExternalAuthError::InsufficientScopes)?
        .iter()
        .all(|scope| {
            vec![
                "https://www.googleapis.com/auth/userinfo.email",
                "https://www.googleapis.com/auth/userinfo.profile",
            ]
            .contains(&scope.as_str())
        })
    {
        return Err(ExternalAuthError::InsufficientScopes);
    }

    // Fetch the account details
    let google_data = reqwest_client
        .get("https://www.googleapis.com/oauth2/v2/userinfo?alt=json")
        .header("Content-type", ContentType::json().to_string())
        .header(
            header::AUTHORIZATION,
            format!("Bearer {}", token_res.access_token().secret()),
        )
        .send()
        .await
        .map_err(|_| ExternalAuthError::Other)?
        .json::<Response>()
        .await
        .map_err(|_| ExternalAuthError::Other)?;

    // Check if Google returned an invalid response.
    if google_data.validate().is_err() {
        return Err(ExternalAuthError::Other);
    }

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
    google_data: Response,
    req: HttpRequest,
    data: &web::Data<AppState>,
    session: &Session,
) -> Result<(), ExternalAuthError> {
    let pg_pool = &data.db_pool;
    let mut txn = pg_pool
        .begin()
        .await
        .map_err(|_| ExternalAuthError::Other)?;
    let mut is_new_user = false;

    let user_id = match sqlx::query(
        r#"
        SELECT
            id,
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
        Ok(result) => {
            if result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
            {
                return Err(ExternalAuthError::UserDeleted);
            } else if result
                .get::<Option<OffsetDateTime>, _>("deactivated_at")
                .is_some()
            {
                return Err(ExternalAuthError::UserDeactivated);
            }

            result.get::<i64, _>("id")
        }
        Err(err) => {
            // Create a new user
            if matches!(err, sqlx::error::Error::RowNotFound) {
                is_new_user = true;

                sqlx::query(
                    r#"
                    INSERT INTO users (name, username, email, login_google_id)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id
                    "#,
                )
                .bind(truncate_str(&google_data.name, 32))
                .bind(
                    generate_random_username(&google_data.name, &mut txn)
                        .await
                        .map_err(|_| ExternalAuthError::Other)?,
                )
                .bind(&google_data.email)
                .bind(&google_data.id)
                .fetch_one(&mut *txn)
                .await
                .map_err(|_| ExternalAuthError::Other)?
                .get::<i64, _>("id")
            } else {
                return Err(ExternalAuthError::Other);
            }
        }
    };

    let mut client_device_value = "Unknown device".to_string();
    let mut client_location_value: Option<String> = None;

    // Insert additional data to the session
    {
        if let Some(ip) = req.connection_info().realip_remote_addr() {
            if let Ok(parsed_ip) = ip.parse::<IpAddr>() {
                let client_location_result = get_client_location(parsed_ip, &data.geo_db);
                client_location_value = Some(client_location_result.display_name.to_string());

                if let Ok(client_location) = serde_json::to_value(client_location_result) {
                    session.insert("location", client_location);
                }
            }
        }

        if let Some(ua_header) = (&req.headers()).get("user-agent") {
            if let Ok(ua) = ua_header.to_str() {
                let client_device_result = get_client_device(ua, &data.ua_parser);
                client_device_value = client_device_result.display_name.to_string();

                if let Ok(client_device) = serde_json::to_value(client_device_result) {
                    session.insert("device", client_device);
                }
            }
        }
    }

    if !is_new_user {
        // Insert a login notification
        sqlx::query(
            r#"
            WITH inserted_notification AS (
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
        .await
        .map_err(|_| ExternalAuthError::Other)?;

        txn.commit().await.map_err(|_| ExternalAuthError::Other)?;

        // Check if the user maintains more than or equal to 10 sessions, and
        // delete all the previous sessions if the current number of active
        // sessions for the user exceeds the per user session limit (10).
        match get_user_sessions(&data.redis, user_id).await {
            Ok(sessions) => {
                if sessions.len() >= 10 {
                    match clear_user_sessions(&data.redis, user_id).await {
                        Ok(_) => {}
                        Err(_) => return Err(ExternalAuthError::Other),
                    };
                }
            }
            Err(_) => return Err(ExternalAuthError::Other),
        };
    } else {
        txn.commit().await.map_err(|_| ExternalAuthError::Other)?;
    }

    Identity::login(&req.extensions(), user_id)
        .and_then(|_| Ok(()))
        .map_err(|_| ExternalAuthError::Other)
}

#[get("/v1/auth/external/google/callback")]
async fn get(
    req: HttpRequest,
    data: web::Data<AppState>,
    params: QsQuery<AuthRequest>,
    session: Session,
    user: Option<Identity>,
) -> Result<HttpResponse, AppError> {
    // Redirect to the web server if already logged-in
    if user.is_some() {
        return Ok(HttpResponse::Found()
            .append_header((header::LOCATION, data.config.web_server_url.to_string()))
            .finish());
    }

    match handle_oauth_request(req, &data, &session, &params).await {
        // Redirect to the web server location on successful login.
        Ok(_) => Ok(HttpResponse::Found()
            .append_header((header::LOCATION, data.config.web_server_url.to_string()))
            .finish()),
        Err(error) => Ok(HttpResponse::Ok().content_type(ContentType::html()).body(
            ExternalAuthErrorTemplate {
                error,
                provider_name: "Google".to_string(),
            }
            .render_once()
            .unwrap(),
        )),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::init_app_for_test;
    use actix_web::{
        test,
        Responder,
    };
    use sqlx::PgPool;

    #[get("/google-login")]
    async fn post(req: HttpRequest, data: web::Data<AppState>, session: Session) -> impl Responder {
        match handle_google_profile_data(
            Response {
                id: "1".to_string(),
                email: "test@example.com".to_string(),
                name: "Test Google account".to_string(),
            },
            req,
            &data,
            &session,
        )
        .await
        {
            Ok(_) => HttpResponse::Ok().finish(),
            Err(_) => HttpResponse::InternalServerError().finish(),
        }
    }

    #[sqlx::test]
    async fn can_login_using_google(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, _) = init_app_for_test(post, pool, false, false, None).await;

        let req = test::TestRequest::get().uri("/google-login").to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // New user should be present in the database
        let result = sqlx::query(
            r#"
            SELECT EXISTS (
                SELECT 1 FROM users
                WHERE login_google_id = $1
            )
            "#,
        )
        .bind("1")
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("exists"));

        // Should not insert a notification for new user
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

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_login_using_google_for_an_existing_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Update `login_google_id` for the current user
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

        // New user should not be inserted in the database
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

        Ok(())
    }
}
