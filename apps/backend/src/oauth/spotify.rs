use crate::oauth::OAuthClient;
use oauth2::{
    basic::BasicClient,
    AuthUrl,
    ClientId,
    ClientSecret,
    RedirectUrl,
    TokenUrl,
};

/// Builds and returns Spotify oauth client.
///
/// * `api_server_url` - The public URL of the API server.
/// * `spotify_client_id` - The Spotify client ID.
/// * `spotify_client_secret` - The Spotify client secret.
pub fn get_spotify_oauth_client(
    api_server_url: &str,
    spotify_client_id: &str,
    spotify_client_secret: &str,
) -> OAuthClient {
    BasicClient::new(ClientId::new(spotify_client_id.to_string()))
        .set_client_secret(ClientSecret::new(spotify_client_secret.to_string()))
        .set_auth_uri(
            #[allow(clippy::unwrap_used)]
            AuthUrl::new("https://accounts.spotify.com/authorize".to_string()).unwrap(),
        )
        .set_token_uri(
            #[allow(clippy::unwrap_used)]
            TokenUrl::new("https://accounts.spotify.com/api/token".to_string()).unwrap(),
        )
        .set_redirect_uri(
            #[allow(clippy::unwrap_used)]
            RedirectUrl::new(format!("{}/{}", api_server_url, "oauth/spotify/callback")).unwrap(),
        )
}
