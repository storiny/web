use super::Provider;
use lazy_regex::regex;

/// SlideShare embed provider
pub static SLIDESHARE_PROVIDER: Provider = Provider {
    name: "SlideShare",
    endpoint: "slideshare.net/api/oembed/2",
    padding: None,
    schemas: &[
        regex!("slideshare\\.net/(.*)/(.*)"),
        regex!("(.*)\\.slideshare\\.net/(.*)/(.*)"),
    ],
    supports_binary_theme: false,
    iframe_params: None,
    origin_params: None,
};
