use super::Provider;
use lazy_regex::regex;

/// SoundCloud embed provider
pub static SOUNDCLOUD_PROVIDER: Provider = Provider {
    name: "SoundCloud",
    endpoint: "soundcloud.com/oembed",
    padding: None,
    schemas: &[
        regex!("soundcloud\\.com/(.*)"),
        regex!("on\\.soundcloud\\.com/(.*)"),
        regex!("soundcloud\\.app\\.goog\\.gl/(.*)"),
    ],
    supports_binary_theme: false,
    iframe_params: None,
    origin_params: None,
};
