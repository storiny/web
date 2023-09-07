use super::Provider;
use lazy_regex::regex;

/// YouTube embed provider
pub static YOUTUBE_PROVIDER: Provider = Provider {
    name: "YouTube",
    endpoint: "youtube.com/oembed",
    padding: None,
    schemas: &[
        regex!("(.*)\\.youtube\\.com/watch(.*)"),
        regex!("(.*)\\.youtube\\.com/v/(.*)"),
        regex!("(.*)\\.youtube\\.com/playlist\\?list=(.*)"),
        regex!("(.*)\\.youtube\\.com/shorts(.*)"),
        regex!("youtu\\.be/(.*)"),
        regex!("youtube\\.com/playlist\\?list=(.*)"),
    ],
    supports_binary_theme: false,
    iframe_params: None,
    origin_params: None,
};
