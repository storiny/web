use crate::grpc::defs::connection_def::v1::Provider;

/// Generates a URL for the specified provider using the provider identifier.
///
/// * `provider` - The provider of the connection.
/// * `identifier` - The provider identifier of the connection.
pub fn generate_connection_url(provider: Provider, identifier: &str) -> String {
    match provider {
        Provider::Github => format!("https://github.com/{}", identifier),
        Provider::Spotify => format!("https://open.spotify.com/user/{}", identifier),
        Provider::Discord => format!("https://discord.com/users/{}", identifier),
        Provider::Youtube => format!("https://youtube.com/channel/{}", identifier),
        Provider::Dribbble => format!("https://dribbble.com/{}", identifier),
        _ => "/".to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn can_generate_connection_url() {
        let url = generate_connection_url(Provider::Github, "storiny");
        assert_eq!(url, "https://github.com/storiny".to_string());
    }
}
