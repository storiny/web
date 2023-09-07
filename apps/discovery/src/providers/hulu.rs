use super::Provider;
use lazy_regex::regex;

/// Hulu embed provider
pub static HULU_PROVIDER: Provider = Provider {
    name: "Hulu",
    endpoint: "hulu.com/api/oembed.json",
    padding: None,
    schemas: &[regex!("hulu\\.com/watch/(.*)")],
    supports_binary_theme: false,
    iframe_params: None,
    origin_params: None,
};
