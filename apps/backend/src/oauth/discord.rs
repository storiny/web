use oauth2::{basic::BasicClient, AuthUrl, ClientId, ClientSecret, RedirectUrl, TokenUrl};

/// Builds and returns Discord oauth client.
///
/// * `api_server_url` - The public URL of the API server.
/// * `discord_client_id` - The Discord client ID.
/// * `discord_client_secret` - The Discord client secret.
pub fn get_discord_oauth_client(
    api_server_url: &str,
    discord_client_id: String,
    discord_client_secret: String,
) -> BasicClient {
    BasicClient::new(
        ClientId::new(discord_client_id),
        Some(ClientSecret::new(discord_client_secret)),
        AuthUrl::new("https://discord.com/oauth2/authorize".to_string()).unwrap(),
        Some(TokenUrl::new("https://discord.com/api/oauth2/token".to_string()).unwrap()),
    )
    .set_redirect_uri(
        RedirectUrl::new(format!("{}/{}", api_server_url, "oauth/discord/callback")).unwrap(),
    )
}
