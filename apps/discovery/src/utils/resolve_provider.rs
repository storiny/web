use crate::providers::{
    Provider,
    PROVIDERS,
};
use url::Url;

/// Resolves the provider based on the provided URL, matching it against
/// every schema that the provider provides.
///
/// * `input_url` - Input URL
pub fn resolve_provider(input_url: &str) -> Option<&'static Provider> {
    // Url sanity check
    return match Url::parse(input_url) {
        Ok(url) => {
            match PROVIDERS.iter().find(|&&provider| {
                provider
                    .schemas
                    .iter()
                    .any(|schema| schema.is_match(&url.to_string()))
            }) {
                None => None,
                Some(provider) => Some(provider),
            }
        }
        Err(_) => None,
    };
}
