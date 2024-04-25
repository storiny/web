use crate::oauth::OAuthClient;
use oauth2::{
    basic::BasicClient,
    AuthUrl,
    ClientId,
    ClientSecret,
    RedirectUrl,
    TokenUrl,
};
use serde::Deserialize;
use validator::Validate;

/// A [Google OAuth V2 API](https://www.googleapis.com/oauth2/v2/userinfo) endpoint response.
#[derive(Debug, Deserialize, Validate)]
pub struct GoogleOAuthResponse {
    /// The name of the Google account.
    #[validate(length(min = 3))]
    pub name: String,
    /// The email address of the Google account.
    #[validate(email)]
    #[validate(length(min = 3, max = 300))]
    pub email: String,
    /// The unique ID that identifies this Google account.
    #[validate(length(min = 3, max = 256))]
    pub id: String,
}

/// Builds and returns Google oauth client. Used for the "Sign in with Google" auth flow.
///
/// * `api_server_url` - The public URL of the API server.
/// * `google_client_id` - The Google client ID.
/// * `google_client_secret` - The Google client secret.
/// * `redirect_path` - The redirect path for the callback endpoint.
pub fn get_google_oauth_client(
    api_server_url: &str,
    google_client_id: &str,
    google_client_secret: &str,
    redirect_path: &str,
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
            RedirectUrl::new(format!("{api_server_url}/{redirect_path}")).unwrap(),
        )
}
