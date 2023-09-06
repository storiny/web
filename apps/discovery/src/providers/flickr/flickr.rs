use super::super::Provider;
use lazy_regex::regex;

/// Flickr embed provider
pub fn flickr_provider() {
    Provider {
        name: "Flickr",
        endpoint: "flickr.com/services/oembed",
        padding: None,
        schemas: &[
            regex!("*\\.flickr\\.com/photos/(.*)"),
            regex!("flic\\.kr/p/(.*)"),
            regex!("(.*)\\.(.*)\\.flickr\\.com/(.*)/(.*)"),
        ],
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    };
}
