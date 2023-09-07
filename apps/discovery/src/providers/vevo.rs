use super::Provider;
use lazy_regex::regex;

/// Vevo embed provider
pub static VEVO_PROVIDER: Provider = Provider {
    name: "Vevo",
    endpoint: "vevo.com/oembed",
    padding: None,
    schemas: &[regex!("vevo\\.com/(.*)")],
    supports_binary_theme: false,
    iframe_params: None,
    origin_params: None,
};
