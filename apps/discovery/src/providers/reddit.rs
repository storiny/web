use super::Provider;
use lazy_regex::regex;

/// Reddit embed provider
pub static REDDIT_PROVIDER: Provider = Provider {
    name: "Reddit",
    endpoint: "reddit.com/oembed",
    padding: None,
    schemas: &[regex!("reddit\\.com/r/(.*)/comments/(.*)/(.*)")],
    supports_binary_theme: false,
    iframe_params: None,
    origin_params: None,
};
