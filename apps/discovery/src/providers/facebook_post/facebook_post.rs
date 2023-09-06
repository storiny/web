use super::super::Provider;
use lazy_regex::regex;

/// Facebook post embed provider
pub fn facebook_post_provider() {
    Provider {
        name: "Facebook Post",
        endpoint: "graph.facebook.com/v10.0/oembed_post",
        padding: None,
        schemas: &[
            regex!("facebook\\.com/(.*)/posts/(.*)"),
            regex!("facebook\\.com/(.*)/activity/(.*)"),
            regex!("facebook\\.com/(.*)/photos/(.*)"),
            regex!("facebook\\.com/photo\\.php\\?fbid=*"),
            regex!("facebook\\.com/photos/(.*)"),
            regex!("facebook\\.com/permalink\\.php\\?story_fbid=*"),
            regex!("facebook\\.com/media/set\\?set=*"),
            regex!("facebook\\.com/questions/(.*)"),
            regex!("facebook\\.com/notes/(.*)/(.*)/(.*)"),
        ],
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    };
}
