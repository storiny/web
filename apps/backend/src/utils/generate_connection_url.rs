/// Generates a URL for the specified provider using the provider identifier.
///
/// * `provider` - The provider of the connection.
/// * `identifier` - The provider identifier of the connection.
pub fn generate_connection_url(provider: &str, identifier: &str) -> String {
    match provider {
        "github" => format!("https://github.com/{}", identifier),
        "spotify" => format!("https://open.spotify.com/user/{}", identifier),
        "discord" => format!("https://discord.com/users/{}", identifier),
        "youtube" => format!("https://youtube.com/channel/{}", identifier),
        "dribbble" => format!("https://dribbble.com/{}", identifier),
        _ => "/".to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn can_generate_connection_url() {
        let url = generate_connection_url("github", "storiny");
        assert_eq!(url, "https://github.com/storiny".to_string());
    }
}
