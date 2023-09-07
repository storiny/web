use super::Provider;
use lazy_regex::regex;

/// Gfycat embed provider
pub static GFYCAT_PROVIDER: Provider = Provider {
    name: "Gfycat",
    endpoint: "api.gfycat.com/v1/oembed",
    padding: None,
    schemas: &[regex!("gfycat\\.com/(.*)"), regex!("gfycat\\.com/(.*)")],
    supports_binary_theme: false,
    iframe_params: None,
    origin_params: None,
};
