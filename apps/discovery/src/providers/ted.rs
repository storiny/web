use super::Provider;
use lazy_regex::regex;

/// TED embed provider
pub static TED_PROVIDER: Provider = Provider {
    name: "TED",
    endpoint: "ted.com/services/v1/oembed.json",
    padding: None,
    schemas: &[regex!("ted\\.com/talks/(.*)")],
    supports_binary_theme: false,
    iframe_params: None,
    origin_params: None,
};
