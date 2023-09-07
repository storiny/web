use super::Provider;
use lazy_regex::regex;

/// TikTok embed provider
pub static TIKTOK_PROVIDER: Provider = Provider {
    name: "TikTok",
    endpoint: "tiktok.com/oembed",
    padding: None,
    schemas: &[
        regex!("tiktok\\.com/(.*)"),
        regex!("tiktok\\.com/(.*)/video/(.*)"),
    ],
    supports_binary_theme: false,
    iframe_params: None,
    origin_params: None,
};
