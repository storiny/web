use crate::HmacSha1;
use hex::encode as encode_hex;
use hmac::{
    digest::InvalidLength,
    Mac,
};

/// Generates a personalized unsubscribe fragment for a newsletter email.
///
/// # Structure of fragment
///
/// The fragment is returned as `digest/hex-encoded-fragment`, where `digest` is the hash value of
/// `blog_id:email`, and the latter part is the hex-encoded representation of the same.
///
/// * `secret` - The secret key to sign the fragment.
/// * `blog_id` - The ID of the blog to which the newsletter belongs.
/// * `email` - The target email to which the newsletter was sent.
pub fn encode_unsubscribe_fragment(
    secret: impl Into<String>,
    blog_id: impl Into<String>,
    email: impl Into<String>,
) -> Result<String, InvalidLength> {
    let mut mac = HmacSha1::new_from_slice(secret.into().as_bytes())?;
    let fragment = format!("{}:{}", blog_id.into(), email.into());

    mac.update(fragment.as_bytes());

    let result = mac.finalize();
    let bytes = result.into_bytes();

    Ok(format!(
        "{}/{}",
        encode_hex(bytes),
        encode_hex(fragment.as_bytes())
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn can_encode_unsubscribe_fragment() {
        let key = "db1309802eadfb86741d3d9f1a900852";
        let digest = "9728f9c5560a8883faf01cacdb6cf73638d4f84c";
        let fragment_hex = "313233343536373839303a736f6d656f6e65406578616d706c652e636f6d";

        assert_eq!(
            encode_unsubscribe_fragment(key, "1234567890", "someone@example.com").unwrap(),
            format!("{digest}/{fragment_hex}")
        );
    }
}
