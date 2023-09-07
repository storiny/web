use super::Provider;
use lazy_regex::regex;

/// Getty images embed provider
pub static GETTY_IMAGES_PROVIDER: Provider = Provider {
    name: "Getty Images",
    endpoint: "embed.gettyimages.com/oembed",
    padding: None,
    schemas: &[regex!("gty\\.im/(.*)")],
    supports_binary_theme: false,
    iframe_params: None,
    origin_params: None,
};
