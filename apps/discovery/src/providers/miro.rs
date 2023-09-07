use super::Provider;
use lazy_regex::regex;

/// Miro embed provider
pub static MIRO_PROVIDER: Provider = Provider {
    name: "Miro",
    endpoint: "miro.com/api/v1/oembed",
    padding: None,
    schemas: &[regex!("miro\\.com/app/board/(.*)")],
    supports_binary_theme: false,
    iframe_params: None,
    origin_params: None,
};
