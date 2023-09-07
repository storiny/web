use super::Provider;
use lazy_regex::regex;

/// Coub embed provider
pub static COUB_PROVIDER: Provider = Provider {
    name: "Coub",
    endpoint: "coub.com/api/oembed.json",
    padding: None,
    schemas: &[
        regex!("coub\\.com/view/(.*)"),
        regex!("coub\\.com/embed/(.*)"),
    ],
    supports_binary_theme: false,
    iframe_params: None,
    origin_params: None,
};
