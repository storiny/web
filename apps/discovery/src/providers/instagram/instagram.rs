use super::super::Provider;
use lazy_regex::regex;

/// Instagram embed provider
pub fn instagram_provider() {
    Provider {
        name: "Instagram",
        endpoint: "graph.facebook.com/v10.0/instagram_oembed",
        padding: None,
        schemas: &[
            regex!("instagram\\.com/p/(.*)"),
            regex!("instagram\\.com/tv/(.*)"),
            regex!("instagram\\.com/reel/(.*)"),
            regex!("instagr\\.am/p/(.*)"),
            regex!("instagr\\.am/tv/(.*)"),
            regex!("instagr\\.am/reel/(.*)"),
        ],
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    };
}
