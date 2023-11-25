use oauth2::{
    basic::BasicClient,
    AuthUrl,
    ClientId,
    ClientSecret,
    RedirectUrl,
    TokenUrl,
};

/// Builds and returns Google oauth client. Used for the "Sign in with Google" auth flow.
///
/// * `api_server_url` - The public URL of the API server.
/// * `google_client_id` - The Google client ID.
/// * `google_client_secret` - The Google client secret.
pub fn get_google_oauth_client(
    api_server_url: &str,
    google_client_id: &str,
    google_client_secret: &str,
) -> BasicClient {
    BasicClient::new(
        ClientId::new(google_client_id.to_string()),
        Some(ClientSecret::new(google_client_secret.to_string())),
        AuthUrl::new("https://accounts.google.com/o/oauth2/v2/auth".to_string()).unwrap(),
        Some(TokenUrl::new("https://www.googleapis.com/oauth2/v3/token".to_string()).unwrap()),
    )
    .set_redirect_uri(
        RedirectUrl::new(format!(
            "{}/{}",
            api_server_url, "v1/auth/external/google/callback"
        ))
        .unwrap(),
    )
}
