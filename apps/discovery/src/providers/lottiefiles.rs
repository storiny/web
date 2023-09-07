use super::Provider;
use lazy_regex::regex;

/// Lottiefiles embed provider
pub static LOTTIEFILES_PROVIDER: Provider = Provider {
    name: "Lottiefiles",
    endpoint: "embed.lottiefiles.com/oembed",
    padding: None,
    schemas: &[
        regex!("lottiefiles\\.com/(.*)"),
        regex!("(.*)\\.lottiefiles\\.com/(.*)"),
    ],
    supports_binary_theme: false,
    iframe_params: None,
    origin_params: None,
};
