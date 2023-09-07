use super::Provider;
use lazy_regex::regex;

/// Flickr embed provider
pub static FLICKR_PROVIDER: Provider = Provider {
    name: "Flickr",
    endpoint: "flickr.com/services/oembed",
    padding: None,
    schemas: &[
        regex!("(.*)\\.flickr\\.com/photos/(.*)"),
        regex!("flic\\.kr/p/(.*)"),
        regex!("(.*)\\.(.*)\\.flickr\\.com/(.*)/(.*)"),
    ],
    supports_binary_theme: false,
    iframe_params: None,
    origin_params: None,
};
