use super::Provider;
use lazy_regex::regex;

/// Vimeo embed provider
pub static VIMEO_PROVIDER: Provider = Provider {
    name: "Vimeo",
    endpoint: "vimeo.com/api/oembed.json",
    padding: None,
    schemas: &[
        regex!("vimeo\\.com/(.*)"),
        regex!("vimeo\\.com/album/(.*)/video/(.*)"),
        regex!("vimeo\\.com/channels/(.*)/(.*)"),
        regex!("vimeo\\.com/groups/(.*)/videos/(.*)"),
        regex!("vimeo\\.com/ondemand/(.*)/(.*)"),
        regex!("player\\.vimeo\\.com/video/(.*)"),
    ],
    supports_binary_theme: false,
    iframe_params: None,
    origin_params: None,
};
