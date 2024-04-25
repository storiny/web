use crate::{
    constants::connection_provider::ConnectionProvider,
    error::AppError,
    middlewares::identity::identity::Identity,
    oauth::icons::discord::DISCORD_LOGO,
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
use sailfish::TemplateOnce;
use serde::Deserialize;
use storiny_session::Session;

/// A [Discord User](https://discord.com/developers/docs/resources/user#get-current-user) endpoint response.
#[derive(Debug, Deserialize)]
struct Response {
    /// The ID of the Discord user.
    id: String,
    /// The username of the Discord user.
    username: String,
}

#[tracing::instrument(skip_all, fields(user_id), err)]
async fn handle_discord_oauth_request(
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
        .discord
        .exchange_code(code)
        .request_async(&data.oauth_client)
        .await
        .map_err(|error| ConnectionError::Other(error.to_string()))?;

    // Check if the `identify` scope is granted, required for obtaining the account details.
    if !token_res
        .scopes()
        .ok_or(ConnectionError::InsufficientScopes)?
        .iter()
        .any(|scope| scope.as_str() == "identify")
    {
        return Err(ConnectionError::InsufficientScopes);
    }

    // Fetch the account details.
    let account_res = reqwest_client
        .get("https://discord.com/api/v10/users/@me")
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

    handle_discord_data(account_res, data, &user_id).await
}

/// Handles Discord profile response and saves the connection to the database.
///
/// * `discord_data` - The Discord profile endpoint response.
/// * `data` - The shared app state.
/// * `user_id` - The ID of the user who requested this flow.
#[tracing::instrument(skip_all, fields(user_id), err)]
async fn handle_discord_data(
    discord_data: Response,
    data: &web::Data<AppState>,
    user_id: &i64,
) -> Result<(), ConnectionError> {
    let provider_identifier = discord_data.id;
    let display_name = discord_data.username;

    // Save the connection.
    match sqlx::query(
        r#"
INSERT INTO connections
    (provider, provider_identifier, display_name, user_id)
VALUES ($1, $2, $3, $4)
"#,
    )
    .bind(ConnectionProvider::Discord.to_string())
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

#[get("/oauth/discord/callback")]
#[tracing::instrument(
    name = "GET /oauth/discord/callback",
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
            Ok(user_id) => handle_discord_oauth_request(&data, &session, &params, user_id)
                .await
                .err(),
            Err(error) => Some(ConnectionError::Other(error.to_string())),
        },
        provider_icon: DISCORD_LOGO.to_string(),
        provider_name: "Discord".to_string(),
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

    #[get("/connect-discord-account")]
    async fn get(data: web::Data<AppState>, user: Identity) -> impl Responder {
        let user_id = user.id().unwrap();

        match handle_discord_data(
            Response {
                id: "123".to_string(),
                username: "discord_user".to_string(),
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
    async fn can_connect_a_discord_account(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/connect-discord-account")
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
        .bind(ConnectionProvider::Discord.to_string())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_connecting_a_duplicate_discord_account(pool: PgPool) -> sqlx::Result<()> {
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
        .bind(ConnectionProvider::Discord.to_string())
        .bind("0")
        .bind("discord_user")
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/connect-discord-account")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "duplicate").await;

        Ok(())
    }
}
