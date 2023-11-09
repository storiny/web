use oauth2::{basic::BasicClient, AuthUrl, ClientId, ClientSecret, RedirectUrl, TokenUrl};

/// Builds and returns YouTube oauth client.
///
/// * `api_server_url` - The public URL of the API server.
/// * `google_client_id` - The Google client ID.
/// * `google_client_secret` - The Google client secret.
pub fn get_youtube_oauth_client(
    api_server_url: &str,
    google_client_id: String,
    google_client_secret: String,
) -> BasicClient {
    BasicClient::new(
        ClientId::new(google_client_id),
        Some(ClientSecret::new(google_client_secret)),
        AuthUrl::new("https://accounts.google.com/o/oauth2/v2/auth".to_string()).unwrap(),
        Some(TokenUrl::new("https://www.googleapis.com/oauth2/v3/token".to_string()).unwrap()),
    )
    .set_redirect_uri(
        RedirectUrl::new(format!("{}/{}", api_server_url, "oauth/youtube/callback")).unwrap(),
    )
}
