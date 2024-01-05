use crate::{
    error::AppError,
    grpc::defs::connection_def::v1::Provider,
    middlewares::identity::identity::Identity,
    oauth::icons::spotify::SPOTIFY_LOGO,
    routes::oauth::{
        AuthRequest,
        ConnectionError,
    },
    AppState,
    ConnectionTemplate,
};
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
use storiny_session::Session;

/// A [Spotify User Profile](https://developer.spotify.com/documentation/web-api/reference/get-current-users-profile) endpoint response.
#[derive(Debug, Deserialize)]
struct Response {
    /// The ID of the Spotify user.
    id: String,
    /// The name displayed on the user's profile. `null` if not available.
    display_name: Option<String>,
}

#[tracing::instrument(skip_all, fields(user_id), err)]
async fn handle_spotify_oauth_request(
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

    // Fetch the profile details.
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

    handle_spotify_data(profile_res, data, &user_id).await
}

/// Handles Spotify profile response and saves the connection to the database.
///
/// * `spotify_data` - The Spotify profile endpoint response.
/// * `data` - The shared app state.
/// * `user_id` - The ID of the user who requested this flow.
#[tracing::instrument(skip_all, fields(user_id), err)]
async fn handle_spotify_data(
    spotify_data: Response,
    data: &web::Data<AppState>,
    user_id: &i64,
) -> Result<(), ConnectionError> {
    let provider_identifier = spotify_data.id;
    let display_name = spotify_data
        .display_name
        .unwrap_or(provider_identifier.clone());

    // Save the connection.
    match sqlx::query(
        r#"
INSERT INTO connections
    (provider, provider_identifier, display_name, user_id)
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
#[tracing::instrument(
    name = "GET /oauth/spotify/callback",
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
    Ok(HttpResponse::Ok().content_type(ContentType::html()).body(
        ConnectionTemplate {
            error: if let Ok(user_id) = user.id() {
                handle_spotify_oauth_request(&data, &session, &params, user_id)
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

    #[get("/connect-spotify-account")]
    async fn get(data: web::Data<AppState>, user: Identity) -> impl Responder {
        let user_id = user.id().unwrap();

        match handle_spotify_data(
            Response {
                id: "123".to_string(),
                display_name: Some("spotify_user".to_string()),
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
    async fn can_connect_a_spotify_account(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/connect-spotify-account")
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
        .bind(Provider::Spotify as i16)
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_connecting_a_duplicate_spotify_account(pool: PgPool) -> sqlx::Result<()> {
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
        .bind(Provider::Spotify as i16)
        .bind("0")
        .bind("spotify_user")
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/connect-spotify-account")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "duplicate").await;

        Ok(())
    }
}
