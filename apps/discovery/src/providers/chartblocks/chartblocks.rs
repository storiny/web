use super::super::Provider;
use lazy_regex::regex;

/// ChartBlocks embed provider
pub fn chartblocks_provider() -> Provider {
    return Provider {
        name: "ChartBlocks",
        endpoint: "embed.chartblocks.com/1.0/oembed",
        schemas: &[regex!("public\\.chartblocks\\.com/c/(.*)")],
        padding: None,
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    };
}
