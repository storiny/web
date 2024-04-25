use crate::{
    constants::connection_provider::ConnectionProvider,
    error::AppError,
    middlewares::identity::identity::Identity,
    oauth::icons::github::GITHUB_LOGO,
    routes::oauth::{
        AuthRequest,
        ConnectionError,
    },
    AppState,
    ConnectionTemplate,
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
use reqwest::StatusCode;
use sailfish::TemplateOnce;
use serde::Deserialize;
use storiny_session::Session;

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
#[tracing::instrument(skip_all, err)]
async fn github_async_http_client(
    request: oauth2::HttpRequest,
) -> Result<oauth2::HttpResponse, reqwest::Error> {
    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .build()?;
    let mut request_builder = client
        .request(request.method().clone(), request.uri().to_string())
        .body(request.body().clone());

    for (name, value) in request.headers() {
        request_builder = request_builder.header(name.as_str(), value.as_bytes());
    }

    let request = request_builder.build()?;
    let response = client.execute(request).await?;

    let status_code = response.status();
    let headers = response.headers().to_owned();
    let chunks = response.bytes().await?;

    let mut res = oauth2::HttpResponse::new(chunks.to_vec());

    res.headers_mut().extend(headers);
    // GitHub returns 200 status code for errors, with a JSON body describing the error details.
    // It needs to be mapped to a 400 error code to remain compliant with the OAuth spec.
    // https://github.com/ramosbugs/oauth2-rs/issues/218
    *res.status_mut() = if serde_json::from_slice::<GitHubTokenErrorResponse>(&chunks).is_ok() {
        StatusCode::BAD_REQUEST
    } else {
        status_code
    };

    Ok(res)
}

#[tracing::instrument(skip_all, fields(user_id), err)]
async fn handle_github_oauth_request(
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
        .github
        .exchange_code(code)
        .request_async(&github_async_http_client)
        .await
        .map_err(|error| ConnectionError::Other(error.to_string()))?;

    // Github returns a single comma-separated "scope" parameter instead of multiple
    // space-separated scopes.
    let scopes = if let Some(scopes_vec) = token_res.scopes() {
        scopes_vec
            .iter()
            .flat_map(|comma_separated| comma_separated.split(','))
            .collect::<Vec<_>>()
    } else {
        Vec::new()
    };

    // Check if the `read:user` scope is granted, required for obtaining the profile details.
    if !scopes.iter().any(|&scope| scope == "read:user") {
        return Err(ConnectionError::InsufficientScopes);
    }

    // Fetch the profile details.
    let profile_res = reqwest_client
        .get("https://api.github.com/user")
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

    handle_github_data(profile_res, data, &user_id).await
}

/// Handles GitHub profile response and saves the connection to the database.
///
/// * `github_data` - The GitHub profile endpoint response.
/// * `data` - The shared app state.
/// * `user_id` - The ID of the user who requested this flow.
#[tracing::instrument(skip_all, fields(user_id), err)]
async fn handle_github_data(
    github_data: Response,
    data: &web::Data<AppState>,
    user_id: &i64,
) -> Result<(), ConnectionError> {
    let provider_identifier = github_data.login;
    let display_name = github_data.name;

    // Save the connection.
    match sqlx::query(
        r#"
INSERT INTO connections
    (provider, provider_identifier, display_name, user_id)
VALUES ($1, $2, $3, $4)
"#,
    )
    .bind(ConnectionProvider::GitHub.to_string())
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

#[get("/oauth/github/callback")]
#[tracing::instrument(
    name = "GET /oauth/github/callback",
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
            Ok(user_id) => handle_github_oauth_request(&data, &session, &params, user_id)
                .await
                .err(),
            Err(error) => Some(ConnectionError::Other(error.to_string())),
        },
        provider_icon: GITHUB_LOGO.to_string(),
        provider_name: "GitHub".to_string(),
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
    use sqlx::{
        PgPool,
        Row,
    };

    #[get("/connect-github-account")]
    async fn get(data: web::Data<AppState>, user: Identity) -> impl Responder {
        let user_id = user.id().unwrap();

        match handle_github_data(
            Response {
                login: "github_user".to_string(),
                name: "GitHub user".to_string(),
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
    async fn can_connect_a_github_account(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/connect-github-account")
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
        .bind(ConnectionProvider::GitHub.to_string())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_connecting_a_duplicate_github_account(pool: PgPool) -> sqlx::Result<()> {
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
        .bind(ConnectionProvider::GitHub.to_string())
        .bind("0")
        .bind("github_user")
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/connect-github-account")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "duplicate").await;

        Ok(())
    }
}
