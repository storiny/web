use super::Provider;
use lazy_regex::regex;
use phf::phf_map;

/// Twitter embed provider
pub static TWITTER_PROVIDER: Provider = Provider {
    name: "Twitter",
    endpoint: "publish.twitter.com/oembed",
    padding: None,
    schemas: &[
        regex!("twitter\\.com/(.*)"),
        regex!("twitter\\.com/(.*)/status/(.*)"),
        regex!("(.*)\\.twitter\\.com/(.*)/status/(.*)"),
    ],
    supports_binary_theme: true,
    iframe_params: None,
    origin_params: Some(phf_map! { "align" => "center", "dnt" => "true", "theme" => "{theme}" }),
};
