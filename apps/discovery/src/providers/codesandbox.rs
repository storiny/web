use super::Provider;
use lazy_regex::regex;
use phf::phf_map;

/// CodeSandbox embed provider
pub static CODESANDBOX_PROVIDER: Provider = Provider {
    name: "CodeSandbox",
    endpoint: "codesandbox.io/oembed",
    padding: None,
    schemas: &[
        regex!("codesandbox\\.io/s/(.*)"),
        regex!("codesandbox\\.io/embed/(.*)"),
    ],
    supports_binary_theme: true,
    iframe_params: Some(phf_map! { "codemirror" => "1", "theme" => "{theme}" }),
    origin_params: None,
};
