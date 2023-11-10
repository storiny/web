use crate::oauth::icons::spotify::SPOTIFY_LOGO;
use crate::{
    error::AppError,
    grpc::defs::connection_def::v1::Provider,
    middleware::identity::identity::Identity,
    routes::oauth::{AuthRequest, ConnectionError},
    AppState, ConnectionTemplate,
};
use actix_session::Session;
use actix_web::http::header::{self, ContentType};
use actix_web::{get, web, HttpResponse};
use actix_web_validator::QsQuery;
use oauth2::{reqwest::async_http_client, AuthorizationCode, TokenResponse};
use sailfish::TemplateOnce;
use serde::Deserialize;

/// A [Spotify User Profile](https://developer.spotify.com/documentation/web-api/reference/get-current-users-profile) endpoint response.
#[derive(Debug, Deserialize)]
struct Response {
    /// The ID of the Spotify user.
    id: String,
    /// The name displayed on the user's profile. `null` if not available.
    display_name: Option<String>,
}

async fn handle_oauth_request(
    data: &web::Data<AppState>,
    session: &Session,
    params: &QsQuery<AuthRequest>,
    user_id: i64,
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
    let token_res = (&data.oauth_client_map.spotify)
        .exchange_code(code)
        .request_async(async_http_client)
        .await
        .map_err(|_| ConnectionError::Other)?;

    // Check if the `user-read-email` scope is granted, required for obtaining the profile details.
    if !token_res
        .scopes()
        .ok_or(ConnectionError::InsufficientScopes)?
        .iter()
        .any(|scope| scope.as_str() == "user-read-email")
    {
        return Err(ConnectionError::InsufficientScopes);
    }

    // Fetch the profile details
    let profile_res = reqwest_client
        .get("https://api.spotify.com/v1/me")
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

    let provider_identifier = profile_res.id;
    let display_name = profile_res
        .display_name
        .unwrap_or(provider_identifier.clone());

    // Save the connection
    match sqlx::query(
        r#"
        INSERT INTO connections(provider, provider_identifier, display_name, user_id)
        VALUES ($1, $2, $3, $4)
        "#,
    )
    .bind(Provider::Spotify as i16)
    .bind(provider_identifier)
    .bind(display_name)
    .bind(user_id)
    .execute(&data.db_pool)
    .await
    {
        Ok(result) => match result.rows_affected() {
            0 => Err(ConnectionError::Other),
            _ => Ok(()),
        },
        Err(err) => {
            if let Some(db_err) = err.into_database_error() {
                match db_err.kind() {
                    sqlx::error::ErrorKind::UniqueViolation => Err(ConnectionError::Duplicate),
                    _ => Err(ConnectionError::Other),
                }
            } else {
                Err(ConnectionError::Other)
            }
        }
    }
}

#[get("/oauth/spotify/callback")]
async fn get(
    data: web::Data<AppState>,
    params: QsQuery<AuthRequest>,
    session: Session,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().content_type(ContentType::html()).body(
        ConnectionTemplate {
            error: if let Ok(user_id) = user.id() {
                handle_oauth_request(&data, &session, &params, user_id)
                    .await
                    .err()
            } else {
                Some(ConnectionError::Other)
            },
            provider_icon: SPOTIFY_LOGO.to_string(),
            provider_name: "Spotify".to_string(),
        }
        .render_once()
        .unwrap(),
    ))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}
