use super::super::Provider;
use lazy_regex::regex;

/// Dailymotion embed provider
pub fn dailymotion_provider() {
    Provider {
        name: "Dailymotion",
        endpoint: "dailymotion.com/services/oembed",
        padding: None,
        schemas: &[regex!("dailymotion\\.com/video/(.*)")],
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    };
}
