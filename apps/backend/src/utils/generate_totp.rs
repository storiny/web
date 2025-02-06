use totp_rs::{
    Algorithm,
    TOTP,
    TotpUrlError,
};

/// Generates a new TOTP instance using the provided secret and username.
///
/// * `secret` - The secret value (bytes).
/// * `username` - The username of the target user.
pub fn generate_totp(secret: Vec<u8>, username: &str) -> Result<TOTP, TotpUrlError> {
    TOTP::new(
        Algorithm::SHA1,
        6,
        1,
        30,
        secret,
        Some("Storiny".to_string()),
        username.to_string(),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use totp_rs::Secret;

    #[test]
    fn can_generate_totp_instance() {
        let secret = Secret::generate_secret();
        let totp = generate_totp(secret.to_bytes().unwrap(), "some_username");

        assert!(totp.is_ok());
    }
}
