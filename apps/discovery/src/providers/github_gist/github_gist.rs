use super::super::Provider;
use lazy_regex::regex;

/// Github gist embed provider
pub fn github_gist_provider() {
    Provider {
        name: "GitHub Gist",
        endpoint: "gist.github.com/$1/$2.json",
        padding: None,
        schemas: &[regex!("gist\\.github\\.com/(.*)/(.*)")],
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    };
}
