use crate::{
    providers::PROVIDERS,
    spec::Provider,
};
use url::Url;

/// Resolves the provider based on the provided URL, matching it against
/// every schema that the provider provides.
///
/// * `input_url` - The input URL.
pub fn resolve_provider(input_url: &str) -> Option<&'static Provider> {
    let url = Url::parse(input_url).ok()?;

    PROVIDERS.iter().find(|&provider| {
        provider
            .matchers
            .iter()
            .any(|matcher| matcher.is_match(url.as_ref()))
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn can_resolve_provider() {
        let url = "https://twitter.com/user/status/12345?s=20";
        let provider = resolve_provider(url).unwrap();

        assert_eq!(provider.name, "Twitter");
    }

    #[test]
    fn can_resolve_provider_with_query() {
        let url = "https://www.youtube.com/watch?v=abcd";
        let provider = resolve_provider(url).unwrap();

        assert_eq!(provider.name, "YouTube");
    }

    #[test]
    fn can_resolve_non_standard_provider() {
        let url = "spotify:abcd";
        let provider = resolve_provider(url).unwrap();

        assert_eq!(provider.name, "Spotify");
    }

    #[test]
    fn can_reject_invalid_providers() {
        let url = "https://youtube.com/watch_now?v=abcd";
        assert!(resolve_provider(url).is_none());

        let url = "https://www.unknown.com/path";
        assert!(resolve_provider(url).is_none());
    }
}
