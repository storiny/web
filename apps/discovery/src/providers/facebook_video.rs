use super::Provider;
use lazy_regex::regex;

/// Facebook video embed provider
pub static FACEBOOK_VIDEO_PROVIDER: Provider = Provider {
    name: "Facebook Video",
    endpoint: "graph.facebook.com/v10.0/oembed_video",
    padding: None,
    schemas: &[
        regex!("facebook\\.com/(.*)/videos/(.*)"),
        regex!("facebook\\.com/video\\.php\\?id=(.*)"),
        regex!("facebook\\.com/video\\.php\\?v=(.*)"),
    ],
    supports_binary_theme: false,
    iframe_params: None,
    origin_params: None,
};
