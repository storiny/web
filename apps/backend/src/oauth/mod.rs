use crate::{config::Config, OAuthClientMap};

pub mod icons;
mod youtube;

/// Builds and returns OAuth client map using the provided configuration.
///
/// * `config` - The environment configuration.
pub fn get_oauth_client_map(config: Config) -> OAuthClientMap {
    OAuthClientMap {
        youtube: youtube::get_youtube_oauth_client(
            config.google_client_id,
            config.google_client_secret,
        ),
    }
}
