use super::Provider;
use lazy_regex::regex;

/// Sketchfab embed provider
pub static SKETCHFAB_PROVIDER: Provider = Provider {
    name: "Sketchfab",
    endpoint: "sketchfab.com/oembed",
    padding: None,
    schemas: &[
        regex!("sketchfab\\.com/(.*)models/(.*)"),
        regex!("sketchfab\\.com/(.*)/folders/(.*)"),
    ],
    supports_binary_theme: false,
    iframe_params: None,
    origin_params: None,
};
