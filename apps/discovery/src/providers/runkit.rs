use super::Provider;
use lazy_regex::regex;

/// Runkit embed provider
pub static RUNKIT_PROVIDER: Provider = Provider {
    name: "Runkit",
    endpoint: "embed.runkit.com/oembed",
    padding: None,
    schemas: &[regex!("embed\\.runkit\\.com/(.*)")],
    supports_binary_theme: false,
    iframe_params: None,
    origin_params: None,
};
