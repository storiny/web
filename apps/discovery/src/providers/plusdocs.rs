use super::Provider;
use lazy_regex::regex;

/// Plusdocs embed provider
pub static PLUSDOCS_PROVIDER: Provider = Provider {
    name: "Plus Docs",
    endpoint: "app.plusdocs.com/oembed",
    padding: None,
    schemas: &[
        regex!("app\\.plusdocs\\.com/(.*)/snapshots/(.*)"),
        regex!("app\\.plusdocs\\.com/(.*)/pages/edit/(.*)"),
        regex!("app\\.plusdocs\\.com/(.*)/pages/share/(.*)"),
    ],
    supports_binary_theme: false,
    iframe_params: None,
    origin_params: None,
};
