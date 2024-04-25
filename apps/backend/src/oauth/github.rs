use crate::oauth::OAuthClient;
use oauth2::{
    basic::BasicClient,
    AuthUrl,
    ClientId,
    ClientSecret,
    RedirectUrl,
    TokenUrl,
};

/// Builds and returns GitHub oauth client.
///
/// * `api_server_url` - The public URL of the API server.
/// * `github_client_id` - The GitHub client ID.
/// * `github_client_secret` - The GitHub client secret.
pub fn get_github_oauth_client(
    api_server_url: &str,
    github_client_id: &str,
    github_client_secret: &str,
) -> OAuthClient {
    BasicClient::new(ClientId::new(github_client_id.to_string()))
        .set_client_secret(ClientSecret::new(github_client_secret.to_string()))
        .set_auth_uri(
            #[allow(clippy::unwrap_used)]
            AuthUrl::new("https://github.com/login/oauth/authorize".to_string()).unwrap(),
        )
        .set_token_uri(
            #[allow(clippy::unwrap_used)]
            TokenUrl::new("https://github.com/login/oauth/access_token".to_string()).unwrap(),
        )
        .set_redirect_uri(
            #[allow(clippy::unwrap_used)]
            RedirectUrl::new(format!("{}/{}", api_server_url, "oauth/github/callback")).unwrap(),
        )
}
