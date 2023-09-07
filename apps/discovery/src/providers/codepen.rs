use super::Provider;
use lazy_regex::regex;
use phf::phf_map;

/// Codepen embed provider
pub static CODEPEN_PROVIDER: Provider = Provider {
    name: "CodePen",
    endpoint: "codepen.io/api/oembed",
    padding: Some(52.25),
    schemas: &[regex!("codepen\\.io/(.*)")],
    supports_binary_theme: true,
    iframe_params: Some(phf_map! { "theme-id" => "{theme}" }),
    origin_params: None,
};
