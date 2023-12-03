use crate::{
    error::AppError,
    grpc::defs::connection_def::v1::Provider,
    middlewares::identity::identity::Identity,
    oauth::icons::github::GITHUB_LOGO,
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
    AuthorizationCode,
    TokenResponse,
};
use reqwest::StatusCode;
use sailfish::TemplateOnce;
use serde::Deserialize;

/// A [GitHub User](https://docs.github.com/en/rest/users/users?apiVersion=2022-11-28#get-the-authenticated-user) endpoint response.
#[derive(Debug, Deserialize)]
struct Response {
    /// The username of the GitHub user.
    login: String,
    /// The name of the GitHub user.
    name: String,
}

/// An error response received when exchanging code with an access token.
#[derive(Deserialize, Debug)]
#[allow(dead_code)]
struct GitHubTokenErrorResponse {
    error: String,
}

/// Asynchronous HTTP client. (GitHub shim)
async fn github_async_http_client(
    request: oauth2::HttpRequest,
) -> Result<oauth2::HttpResponse, oauth2::reqwest::Error<reqwest::Error>> {
    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(oauth2::reqwest::Error::Reqwest)?;
    let mut request_builder = client
        .request(request.method, request.url.as_str())
        .body(request.body);

    for (name, value) in &request.headers {
        request_builder = request_builder.header(name.as_str(), value.as_bytes());
    }

    let request = request_builder
        .build()
        .map_err(oauth2::reqwest::Error::Reqwest)?;

    let response = client
        .execute(request)
        .await
        .map_err(oauth2::reqwest::Error::Reqwest)?;

    let status_code = response.status();
    let headers = response.headers().to_owned();
    let chunks = response
        .bytes()
        .await
        .map_err(oauth2::reqwest::Error::Reqwest)?;

    Ok(oauth2::HttpResponse {
        // GitHub returns 200 status code for errors, with a JSON body describing the error details.
        // It needs to be mapped to a 400 error code to remain compliant with the OAuth spec.
        // https://github.com/ramosbugs/oauth2-rs/issues/218
        status_code: if serde_json::from_slice::<GitHubTokenErrorResponse>(&chunks.to_vec()).is_ok()
        {
            StatusCode::BAD_REQUEST
        } else {
            status_code
        },
        headers,
        body: chunks.to_vec(),
    })
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

    // Check whether the CSRF token has been tampered.
    if oauth_token != params.state {
        return Err(ConnectionError::StateMismatch);
    }

    session.remove("oauth_token");

    let reqwest_client = &data.reqwest_client;
    let code = AuthorizationCode::new(params.code.clone());
    let token_res = (&data.oauth_client_map.github)
        .exchange_code(code)
        .request_async(github_async_http_client)
        .await
        .map_err(|_| ConnectionError::Other)?;

    // Github returns a single comma-separated "scope" parameter instead of multiple
    // space-separated scopes.
    let scopes = if let Some(scopes_vec) = token_res.scopes() {
        scopes_vec
            .iter()
            .map(|comma_separated| comma_separated.split(','))
            .flatten()
            .collect::<Vec<_>>()
    } else {
        Vec::new()
    };

    // Check if the `read:user` scope is granted, required for obtaining the profile details.
    if !scopes.iter().any(|&scope| scope == "read:user") {
        return Err(ConnectionError::InsufficientScopes);
    }

    // Fetch the profile details
    let profile_res = reqwest_client
        .get("https://api.github.com/user")
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

    let provider_identifier = profile_res.login;
    let display_name = profile_res.name;

    // Save the connection
    match sqlx::query(
        r#"
        INSERT INTO connections(provider, provider_identifier, display_name, user_id)
        VALUES ($1, $2, $3, $4)
        "#,
    )
    .bind(Provider::Github as i16)
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

#[get("/oauth/github/callback")]
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
            provider_icon: GITHUB_LOGO.to_string(),
            provider_name: "GitHub".to_string(),
        }
        .render_once()
        .unwrap(),
    ))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}
