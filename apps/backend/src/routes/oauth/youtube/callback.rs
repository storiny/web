use super::AuthRequest;
use crate::connection_def::v1::Provider;
use crate::middleware::identity::identity::Identity;
use crate::{error::AppError, oauth::icons::youtube::YOUTUBE_LOGO, AppState, ConnectionTemplate};
use actix_session::Session;
use actix_web::http::header::{self, ContentType};
use actix_web::{get, web, HttpResponse};
use actix_web_validator::QsQuery;
use oauth2::{reqwest::async_http_client, AuthorizationCode, TokenResponse};
use sailfish::TemplateOnce;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct Snippet {
    title: String,
}

#[derive(Debug, Deserialize)]
struct Item {
    id: String,
    snippet: Snippet,
}

#[derive(Debug, Deserialize)]
struct Response {
    items: Vec<Item>,
}

async fn handle_oauth_request(
    data: &web::Data<AppState>,
    session: &Session,
    params: &QsQuery<AuthRequest>,
    user_id: i64,
) -> Result<(), ()> {
    let oauth_token = session
        .get::<String>("oauth_token")
        .map_err(|_| ())?
        .ok_or(())?;

    // Check whether the CSRF token has been tampered
    if oauth_token != params.state {
        return Err(());
    }

    // Remove the CSRF token from the session.
    session.remove("oauth_token");

    let reqwest_client = &data.reqwest_client;
    let code = AuthorizationCode::new(params.code.clone());

    let token = (&data.oauth_client_map.youtube).exchange_code(code);
    let token_res = token
        .request_async(async_http_client)
        .await
        .map_err(|_| ())?;

    // Check if the `youtube.readonly` scope is granted, required for obtaining the channel details.
    if !token_res
        .scopes()
        .ok_or(())?
        .iter()
        .any(|scope| scope.as_str() == "https://www.googleapis.com/auth/youtube.readonly")
    {
        return Err(());
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
        .map_err(|_| ())?
        .json::<Response>()
        .await
        .map_err(|_| ())?;

    let provider_identifier = channel_res.items[0].id.to_string();
    let display_name = channel_res.items[0].snippet.title.to_string();

    // Save the connection
    sqlx::query(
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
    .map_err(|_| ())?;

    Ok(())
}

#[get("/oauth/youtube/callback")]
async fn get(
    data: web::Data<AppState>,
    params: QsQuery<AuthRequest>,
    session: Session,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => Ok(HttpResponse::Ok().content_type(ContentType::html()).body(
            ConnectionTemplate {
                is_error: handle_oauth_request(&data, &session, &params, user_id)
                    .await
                    .is_err(),
                provider_icon: YOUTUBE_LOGO.to_string(),
                provider_name: "YouTube".to_string(),
            }
            .render_once()
            .unwrap(),
        )),
        Err(_) => Ok(HttpResponse::InternalServerError().body("Something went wrong")),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}
