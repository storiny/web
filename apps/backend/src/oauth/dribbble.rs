use crate::oauth::OAuthClient;
use oauth2::{
    basic::BasicClient,
    AuthUrl,
    ClientId,
    ClientSecret,
    RedirectUrl,
    TokenUrl,
};

/// Builds and returns Dribbble oauth client.
///
/// * `api_server_url` - The public URL of the API server.
/// * `dribbble_client_id` - The Dribbble client ID.
/// * `dribbble_client_secret` - The Dribbble client secret.
pub fn get_dribbble_oauth_client(
    api_server_url: &str,
    dribbble_client_id: &str,
    dribbble_client_secret: &str,
) -> OAuthClient {
    BasicClient::new(ClientId::new(dribbble_client_id.to_string()))
        .set_client_secret(ClientSecret::new(dribbble_client_secret.to_string()))
        .set_auth_uri(
            #[allow(clippy::unwrap_used)]
            AuthUrl::new("https://dribbble.com/oauth/authorize".to_string()).unwrap(),
        )
        .set_token_uri(
            #[allow(clippy::unwrap_used)]
            TokenUrl::new("https://dribbble.com/oauth/token".to_string()).unwrap(),
        )
        .set_redirect_uri(
            #[allow(clippy::unwrap_used)]
            RedirectUrl::new(format!("{}/{}", api_server_url, "oauth/dribbble/callback")).unwrap(),
        )
}
