use crate::{
    AppState,
    ConnectionTemplate,
    constants::connection_provider::ConnectionProvider,
    error::AppError,
    middlewares::identity::identity::Identity,
    oauth::icons::youtube::YOUTUBE_LOGO,
    routes::oauth::{
        AuthRequest,
        ConnectionError,
    },
};
use actix_web::{
    HttpResponse,
    get,
    http::header::ContentType,
    web,
};
use actix_web_validator::QsQuery;
use http::header;
use oauth2::{
    AuthorizationCode,
    TokenResponse,
};
use sailfish::TemplateOnce;
use serde::Deserialize;
use storiny_session::Session;

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

#[tracing::instrument(skip_all, fields(user_id), err)]
async fn handle_youtube_oauth_request(
    data: &web::Data<AppState>,
    session: &Session,
    params: &QsQuery<AuthRequest>,
    user_id: i64,
) -> Result<(), ConnectionError> {
    let oauth_token = session
        .get::<String>("oauth_token")
        .map_err(|error| ConnectionError::Other(error.to_string()))?;

    // Check whether the CSRF token is missing or has been tampered.
    if oauth_token.is_none() || oauth_token.unwrap_or_default() != params.state {
        return Err(ConnectionError::StateMismatch);
    }

    session.remove("oauth_token");

    let reqwest_client = &data.reqwest_client;
    let code = AuthorizationCode::new(params.code.clone());
    let token_res = data
        .oauth_client_map
        .youtube
        .exchange_code(code)
        .request_async(&data.oauth_client)
        .await
        .map_err(|error| ConnectionError::Other(error.to_string()))?;

    // Check if the `youtube.readonly` scope is granted, required for obtaining the channel details.
    if !token_res
        .scopes()
        .ok_or(ConnectionError::InsufficientScopes)?
        .iter()
        .any(|scope| scope.as_str() == "https://www.googleapis.com/auth/youtube.readonly")
    {
        return Err(ConnectionError::InsufficientScopes);
    }

    // Fetch the channel details.
    let channel_res = reqwest_client
        .get(format!(
            "https://youtube.googleapis.com/youtube/v3/channels?{}&{}&{}&key={}",
            "part=snippet", "maxResults=1", "mine=true", &data.config.youtube_data_api_key
        ))
        .header("Content-type", ContentType::json().to_string())
        .header(
            header::AUTHORIZATION,
            format!("Bearer {}", token_res.access_token().secret()),
        )
        .send()
        .await
        .map_err(|err| ConnectionError::Other(err.to_string()))?
        .json::<Response>()
        .await
        .map_err(|err| ConnectionError::Other(err.to_string()))?;

    if channel_res.items.is_empty() {
        return Err(ConnectionError::Other(
            "no channel items received from YouTube".to_string(),
        ));
    }

    handle_youtube_data(channel_res, data, &user_id).await
}

/// Handles YouTube channel response and saves the connection to the database.
///
/// * `youtube_data` - The YouTube channel endpoint response.
/// * `data` - The shared app state.
/// * `user_id` - The ID of the user who requested this flow.
#[tracing::instrument(skip_all, fields(user_id), err)]
async fn handle_youtube_data(
    youtube_data: Response,
    data: &web::Data<AppState>,
    user_id: &i64,
) -> Result<(), ConnectionError> {
    let provider_identifier = youtube_data.items[0].id.to_string();
    let display_name = youtube_data.items[0].snippet.title.to_string();

    // Save the connection.
    match sqlx::query(
        r#"
INSERT INTO connections
    (provider, provider_identifier, display_name, user_id)
VALUES ($1, $2, $3, $4)
"#,
    )
    .bind(ConnectionProvider::YouTube.to_string())
    .bind(provider_identifier)
    .bind(display_name)
    .bind(user_id)
    .execute(&data.db_pool)
    .await
    {
        Ok(result) => match result.rows_affected() {
            0 => Err(ConnectionError::Other(
                "no connection row was inserted into the database".to_string(),
            )),
            _ => Ok(()),
        },
        Err(err) => {
            if let Some(db_err) = err.as_database_error() {
                match db_err.kind() {
                    sqlx::error::ErrorKind::UniqueViolation => Err(ConnectionError::Duplicate),
                    _ => Err(ConnectionError::Other(err.to_string())),
                }
            } else {
                Err(ConnectionError::Other(err.to_string()))
            }
        }
    }
}

#[get("/oauth/youtube/callback")]
#[tracing::instrument(
    name = "GET /oauth/youtube/callback",
    skip_all,
    fields(user = user.id().ok()),
    err
)]
async fn get(
    data: web::Data<AppState>,
    params: QsQuery<AuthRequest>,
    session: Session,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    ConnectionTemplate {
        error: match user.id() {
            Ok(user_id) => handle_youtube_oauth_request(&data, &session, &params, user_id)
                .await
                .err(),
            Err(error) => Some(ConnectionError::Other(error.to_string())),
        },
        provider_icon: YOUTUBE_LOGO.to_string(),
        provider_name: "YouTube".to_string(),
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
        Responder,
        test,
    };
    use sqlx::{
        PgPool,
        Row,
    };

    #[get("/connect-youtube-account")]
    async fn get(data: web::Data<AppState>, user: Identity) -> impl Responder {
        let user_id = user.id().unwrap();

        match handle_youtube_data(
            Response {
                items: vec![Item {
                    id: "123".to_string(),
                    snippet: Snippet {
                        title: "youtube_channel".to_string(),
                    },
                }],
            },
            &data,
            &user_id,
        )
        .await
        {
            Ok(_) => HttpResponse::Ok().finish(),
            Err(error) => match error {
                ConnectionError::Duplicate => HttpResponse::BadRequest().body("duplicate"),
                _ => HttpResponse::InternalServerError().finish(),
            },
        }
    }

    #[sqlx::test]
    async fn can_connect_a_youtube_account(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/connect-youtube-account")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Connection should be present in the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM connections
    WHERE
        user_id = $1
        AND provider = $2
)
"#,
        )
        .bind(user_id.unwrap())
        .bind(ConnectionProvider::YouTube.to_string())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_connecting_a_duplicate_youtube_account(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Add connection for the user.
        let result = sqlx::query(
            r#"
INSERT INTO connections
    (provider, provider_identifier, display_name, user_id)
VALUES ($1, $2, $3, $4)
"#,
        )
        .bind(ConnectionProvider::YouTube.to_string())
        .bind("0")
        .bind("youtube_channel")
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/connect-youtube-account")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "duplicate").await;

        Ok(())
    }
}
