use super::Provider;
use lazy_regex::regex;

/// Pinterest embed provider
pub static PINTEREST_PROVIDER: Provider = Provider {
    name: "Pinterest",
    endpoint: "pinterest.com/oembed.json",
    padding: None,
    schemas: &[regex!("pinterest\\.com/(.*)")],
    supports_binary_theme: false,
    iframe_params: None,
    origin_params: None,
};
