use crate::oauth::OAuthClient;
use oauth2::{
    basic::BasicClient,
    AuthUrl,
    ClientId,
    ClientSecret,
    RedirectUrl,
    TokenUrl,
};

/// Builds and returns YouTube oauth client.
///
/// * `api_server_url` - The public URL of the API server.
/// * `google_client_id` - The Google client ID.
/// * `google_client_secret` - The Google client secret.
pub fn get_youtube_oauth_client(
    api_server_url: &str,
    google_client_id: &str,
    google_client_secret: &str,
) -> OAuthClient {
    BasicClient::new(ClientId::new(google_client_id.to_string()))
        .set_client_secret(ClientSecret::new(google_client_secret.to_string()))
        .set_auth_uri(
            #[allow(clippy::unwrap_used)]
            AuthUrl::new("https://accounts.google.com/o/oauth2/v2/auth".to_string()).unwrap(),
        )
        .set_token_uri(
            #[allow(clippy::unwrap_used)]
            TokenUrl::new("https://www.googleapis.com/oauth2/v3/token".to_string()).unwrap(),
        )
        .set_redirect_uri(
            #[allow(clippy::unwrap_used)]
            RedirectUrl::new(format!("{}/{}", api_server_url, "oauth/youtube/callback")).unwrap(),
        )
}
