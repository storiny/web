use super::Provider;
use lazy_regex::regex;

/// Microsoft stream embed provider
pub static MICROSOFT_STREAM_PROVIDER: Provider = Provider {
    name: "Microsoft Stream",
    endpoint: "web.microsoftstream.com/oembed",
    padding: None,
    schemas: &[
        regex!("(.*)\\.microsoftstream\\.com/video/(.*)"),
        regex!("(.*)\\.microsoftstream\\.com/channel/(.*)"),
    ],
    supports_binary_theme: false,
    iframe_params: None,
    origin_params: None,
};
