/// Returns a blog's public URL.
///
/// * `slug` - The slug of the blog.
/// * `domain` - The optional domain name associated with the blog.
pub fn get_blog_url(slug: String, domain: Option<String>) -> String {
    match domain {
        Some(domain) => format!("https://{domain}"),
        None => format!("https://{slug}.storiny.com"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn can_return_blog_url() {
        let blog_url = get_blog_url("test".to_string(), None);
        assert_eq!(blog_url, "https://test.storiny.com".to_string());
    }

    #[test]
    fn can_return_blog_url_with_custom_domain() {
        let blog_url = get_blog_url("test".to_string(), Some("example.com".to_string()));
        assert_eq!(blog_url, "https://example.com".to_string());
    }
}
