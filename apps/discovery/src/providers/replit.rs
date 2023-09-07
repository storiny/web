use super::Provider;
use lazy_regex::regex;

/// Replit embed provider
pub static REPLIT_PROVIDER: Provider = Provider {
    name: "Replit",
    endpoint: "replit.com/data/oembed",
    padding: None,
    schemas: &[
        regex!("repl\\.it/@(.*)/(.*)"),
        regex!("replit\\.com/@(.*)/(.*)"),
    ],
    supports_binary_theme: false,
    iframe_params: None,
    origin_params: None,
};
