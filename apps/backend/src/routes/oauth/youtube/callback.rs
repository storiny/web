use crate::{
    error::AppError,
    grpc::defs::connection_def::v1::Provider,
    middlewares::identity::identity::Identity,
    oauth::icons::youtube::YOUTUBE_LOGO,
    routes::oauth::{
        AuthRequest,
        ConnectionError,
    },
    AppState,
    ConnectionTemplate,
};
use actix_extended_session::Session;
use actix_web::{
    get,
    http::header::{
        self,
        ContentType,
    },
    web,
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

/// A [YouTube Channel Snippet](https://developers.google.com/youtube/v3/docs/channels#snippet).
#[derive(Debug, Deserialize)]
struct Snippet {
    /// The channel's title.
    /// https://developers.google.com/youtube/v3/docs/channels#snippet.title
    title: String,
}

/// A [YouTube Channel Resource](https://developers.google.com/youtube/v3/docs/channels#resource) item.
#[derive(Debug, Deserialize)]
struct Item {
    /// The ID that YouTube uses to uniquely identify the channel.
    /// https://developers.google.com/youtube/v3/docs/channels#id
    id: String,
    /// An object that contains the details about the YouTube channel.
    /// https://developers.google.com/youtube/v3/docs/channels#snippet
    snippet: Snippet,
}

/// A [YouTube Channels List](https://developers.google.com/youtube/v3/docs/channels/list) endpoint response.
#[derive(Debug, Deserialize)]
struct Response {
    /// A list of YouTube channels.
    items: Vec<Item>,
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
    let token_res = (&data.oauth_client_map.youtube)
        .exchange_code(code)
        .request_async(async_http_client)
        .await
        .map_err(|_| ConnectionError::Other)?;

    // Check if the `youtube.readonly` scope is granted, required for obtaining the channel details.
    if !token_res
        .scopes()
        .ok_or(ConnectionError::InsufficientScopes)?
        .iter()
        .any(|scope| scope.as_str() == "https://www.googleapis.com/auth/youtube.readonly")
    {
        return Err(ConnectionError::InsufficientScopes);
    }

    // Fetch the channel details
    let channel_res = reqwest_client
        .get(&format!(
            "https://youtube.googleapis.com/youtube/v3/channels?{}&{}&{}&{}",
            "part=snippet",
            "maxResults=1",
            "mine=true",
            format!("key={}", &data.config.youtube_data_api_key)
        ))
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

    if channel_res.items.len() == 0 {
        return Err(ConnectionError::Other);
    }

    let provider_identifier = channel_res.items[0].id.to_string();
    let display_name = channel_res.items[0].snippet.title.to_string();

    // Save the connection
    match sqlx::query(
        r#"
        INSERT INTO connections(provider, provider_identifier, display_name, user_id)
        VALUES ($1, $2, $3, $4)
        "#,
    )
    .bind(Provider::Youtube as i16)
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

#[get("/oauth/youtube/callback")]
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
