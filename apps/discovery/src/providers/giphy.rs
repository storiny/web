use super::Provider;
use lazy_regex::regex;

/// Giphy embed provider
pub static GIPHY_PROVIDER: Provider = Provider {
    name: "Giphy",
    endpoint: "giphy.com/services/oembed",
    padding: None,
    schemas: (&[
        regex!("giphy\\.com/gifs/(.*)"),
        regex!("giphy\\.com/clips/(.*)"),
        regex!("gph\\.is/(.*)"),
        regex!("media\\.giphy\\.com/media/(.*)/giphy\\.gif"),
    ]),
    supports_binary_theme: false,
    iframe_params: None,
    origin_params: None,
};
