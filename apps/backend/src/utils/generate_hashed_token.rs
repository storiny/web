use crate::constants::token::TOKEN_LENGTH;
use anyhow::anyhow;
use argon2::{
    password_hash::SaltString,
    Argon2,
    PasswordHasher,
};
use nanoid::nanoid;

/// Generates a unique token ID and hashes it using the provided salt (should be constant).
///
/// * `salt` - The constant salt secret value.
pub fn generate_hashed_token(salt: &str) -> anyhow::Result<(String, String)> {
    let token_id = nanoid!(TOKEN_LENGTH);

    let salt = SaltString::from_b64(salt)
        .map_err(|error| anyhow!("unable parse the salt string: {:?}", error))?;

    let hashed_token = Argon2::default()
        .hash_password(token_id.as_bytes(), &salt)
        .map_err(|error| anyhow!("unable to hash the token: {:?}", error))?;

    Ok((token_id, hashed_token.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn can_generate_hashed_token() {
        // This is just a random base64-encoded v4 UUID.
        let salt = "MmUzYjIxNGMtYWExMi00MjFkLTk5MjUtNzAyOWVlODhmNTAy";
        let result = generate_hashed_token(salt);

        assert!(result.is_ok());
    }
}
