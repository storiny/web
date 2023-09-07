use super::Provider;
use lazy_regex::regex;

/// Spotify embed provider
pub static SPOTIFY_PROVIDER: Provider = Provider {
    name: "Spotify",
    endpoint: "open.spotify.com/oembed",
    padding: None,
    schemas: &[regex!("open\\.spotify\\.com/(.*)"), regex!("spotify:(.*)")],
    supports_binary_theme: false,
    iframe_params: None,
    origin_params: None,
};
