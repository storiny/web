use crate::{
    config::Config,
    OAuthClientMap,
};

pub mod icons;

mod discord;
mod dribbble;
mod github;
mod google;
mod spotify;
mod youtube;

/// Builds and returns OAuth client map using the provided configuration.
///
/// * `config` - The environment configuration.
pub fn get_oauth_client_map(config: Config) -> OAuthClientMap {
    OAuthClientMap {
        youtube: youtube::get_youtube_oauth_client(
            &config.api_server_url,
            &config.google_client_id,
            &config.google_client_secret,
        ),
        google: google::get_google_oauth_client(
            &config.api_server_url,
            &config.google_client_id,
            &config.google_client_secret,
        ),
        github: github::get_github_oauth_client(
            &config.api_server_url,
            &config.github_client_id,
            &config.github_client_secret,
        ),
        spotify: spotify::get_spotify_oauth_client(
            &config.api_server_url,
            &config.spotify_client_id,
            &config.spotify_client_secret,
        ),
        discord: discord::get_discord_oauth_client(
            &config.api_server_url,
            &config.discord_client_id,
            &config.discord_client_secret,
        ),
        dribbble: dribbble::get_dribbble_oauth_client(
            &config.api_server_url,
            &config.dribbble_client_id,
            &config.dribbble_client_secret,
        ),
    }
}
