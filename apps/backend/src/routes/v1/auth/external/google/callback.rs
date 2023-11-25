use crate::{
    error::AppError,
    middlewares::identity::identity::Identity,
    models::notification::NotificationEntityType,
    oauth::icons::youtube::YOUTUBE_LOGO,
    routes::oauth::{
        AuthRequest,
        ConnectionError,
    },
    utils::{
        clear_user_sessions::clear_user_sessions,
        get_client_device::get_client_device,
        get_client_location::get_client_location,
        get_user_sessions::get_user_sessions,
        truncate_str::truncate_str,
    },
    AppState,
    ConnectionTemplate,
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
use itertools::Itertools;
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
) -> Result<(), ConnectionError> {
    let oauth_token = session
        .get::<String>("oauth_token")
        .map_err(|_| ConnectionError::Other)?
        .ok_or(ConnectionError::Other)?;

    // Check whether the CSRF token has been tampered
    if oauth_token != params.state {
        return Err(ConnectionError::StateMismatch);
    }

    // Remove the CSRF token from the session.
    session.remove("oauth_token");

    let reqwest_client = &data.reqwest_client;
    let code = AuthorizationCode::new(params.code.clone());
    let token_res = (&data.oauth_client_map.youtube)
        .exchange_code(code)
        .request_async(async_http_client)
        .await
        .map_err(|_| ConnectionError::Other)?;

    // Check if the `userinfo.email` and `userinfo.profile` scopes were granted, required for
    // obtaining the account details.
    if !token_res
        .scopes()
        .ok_or(ConnectionError::InsufficientScopes)?
        .iter()
        .all(|scope| {
            vec![
                "https://www.googleapis.com/auth/userinfo.email",
                "https://www.googleapis.com/auth/userinfo.profile",
            ]
            .contains(&scope.as_str())
        })
    {
        return Err(ConnectionError::InsufficientScopes);
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
        .map_err(|_| ConnectionError::Other)?
        .json::<Response>()
        .await
        .map_err(|_| ConnectionError::Other)?;

    // Check if Google returned an invalid response.
    if google_data.validate().is_err() {
        return Err(ConnectionError::Other);
    }

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await.map_err(|_| ConnectionError::Other)?;
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
                // TODO: Change this errors
                return Err(ConnectionError::Other);
            } else if result
                .get::<Option<OffsetDateTime>, _>("deactivated_at")
                .is_some()
            {
                return Err(ConnectionError::Other);
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
                    // TODO:
                    "random_username",
                )
                .bind(&google_data.email)
                .bind(&google_data.id)
                .fetch_one(&mut *txn)
                .await
                .map_err(|_| ConnectionError::Other)?
                .get::<i64, _>("id")
            } else {
                return Err(ConnectionError::Other);
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
    .await?;

    txn.commit().await.map_err(|_| ConnectionError::Other)?;

    if !is_new_user {
        // Check if the user maintains more than or equal to 10 sessions, and
        // delete all the previous sessions if the current number of active
        // sessions for the user exceeds the per user session limit (10).
        match get_user_sessions(&data.redis, user_id).await {
            Ok(sessions) => {
                if sessions.len() >= 10 {
                    match clear_user_sessions(&data.redis, user_id).await {
                        Ok(_) => {}
                        Err(_) => return Err(ConnectionError::Other),
                    };
                }
            }
            Err(_) => return Err(ConnectionError::Other),
        };
    }

    Identity::login(&req.extensions(), user_id)
        .and_then(|_| Ok(()))
        .map_err(|_| ConnectionError::Other)
}

#[get("/v1/auth/external/google/callback")]
async fn get(
    data: web::Data<AppState>,
    params: QsQuery<AuthRequest>,
    session: Session,
    user: Option<Identity>,
) -> Result<HttpResponse, AppError> {
    // Redirect to the web server if already logged-in
    if user.is_some() {
        return Ok(HttpResponse::Found()
            .append_header((header::LOCATION, &data.config.web_server_url.to_string()))
            .finish());
    }

    Ok(HttpResponse::Ok().content_type(ContentType::html()).body(
        ConnectionTemplate {
            error: if let Ok(user_id) = user.id() {
                handle_oauth_request(&data, &session, &params, user_id)
                    .await
                    .err()
            } else {
                Some(ConnectionError::Other)
            },
            provider_icon: YOUTUBE_LOGO.to_string(),
            provider_name: "YouTube".to_string(),
        }
        .render_once()
        .unwrap(),
    ))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}
