use super::Provider;
use lazy_regex::regex;

/// Kickstarter embed provider
pub static KICKSTARTER_PROVIDER: Provider = Provider {
    name: "Kickstarter",
    endpoint: "kickstarter.com/services/oembed",
    padding: None,
    schemas: &[regex!("kickstarter\\.com/projects/(.*)")],
    supports_binary_theme: false,
    iframe_params: None,
    origin_params: None,
};
