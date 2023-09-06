use super::super::Provider;
use lazy_regex::regex;

/// Facebook page embed provider
pub fn facebook_page_provider() {
    Provider {
        name: "Facebook Page",
        endpoint: "graph.facebook.com/v10.0/oembed_page",
        padding: None,
        schemas: &[regex!("facebook.com/(.*)")],
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    };
}
