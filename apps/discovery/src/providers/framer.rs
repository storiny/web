use super::Provider;
use lazy_regex::regex;

/// Framer embed provider
pub static FRAMER_PROVIDER: Provider = Provider {
    name: "Framer",
    endpoint: "api.framer.com/web/oembed",
    padding: None,
    schemas: &[
        regex!("framer\\.com/share/(.*)"),
        regex!("framer\\.com/embed/(.*)"),
    ],
    supports_binary_theme: false,
    iframe_params: None,
    origin_params: None,
};
