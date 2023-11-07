use crate::OAuthClientMap;

pub mod icons;
mod youtube;

pub fn get_oauth_client_map() -> OAuthClientMap {
    OAuthClientMap {
        youtube: youtube::get_youtube_oauth_client(),
    }
}
