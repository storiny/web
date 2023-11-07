use crate::{config::Config, OAuthClientMap};

pub mod icons;
mod youtube;

pub fn get_oauth_client_map(config: Config) -> OAuthClientMap {
    OAuthClientMap {
        youtube: youtube::get_youtube_oauth_client(
            config.google_client_id,
            config.google_client_secret,
        ),
    }
}
