use crate::HmacSha1;
use anyhow::anyhow;
use hex::{
    decode as decode_hex,
    encode as encode_hex,
};
use hmac::Mac;
use validator::validate_email;

/// Decodes an unsubscribe fragment for a newsletter email generated using the
/// [encode_unsubscribe_fragment] function. Returns `(blog_id, email)`.
///
/// * `secret` - The secret key.
/// * `digest` - The incoming digest value.
/// * `hex_value` - The hex-encoded value.
pub fn decode_unsubscribe_fragment<S>(
    secret: S,
    digest: S,
    hex_value: S,
) -> anyhow::Result<(i64, String)>
where
    S: Into<String>,
{
    let decoded = decode_hex(hex_value.into())
        .map_err(|error| anyhow!("unable to decode the hex value: {error:?}"))?;

    let fragment =
        String::from_utf8(decoded).map_err(|error| anyhow!("invalid hex value: {error:?}"))?;

    // Verify with the digest value.
    {
        let mut mac = HmacSha1::new_from_slice(secret.into().as_bytes())?;
        mac.update(fragment.as_bytes());

        let result = mac.finalize();
        let bytes = result.into_bytes();

        if digest.into() != encode_hex(bytes) {
            return Err(anyhow!("digest or hex value is invalid"));
        }
    }

    let (blog_id, email) = fragment
        .split_once(':')
        .ok_or(anyhow!("missing fragment delimiter"))?;

    let blog_id = blog_id
        .parse::<i64>()
        .map_err(|_| anyhow!("unable to parse `{blog_id}` as `i64`"))?;

    if !validate_email(email) {
        return Err(anyhow!("invalid email value: `{email}`"));
    }

    Ok((blog_id, email.to_owned()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn can_decode_unsubscribe_fragment() {
        let key = "db1309802eadfb86741d3d9f1a900852";
        let digest = "9728f9c5560a8883faf01cacdb6cf73638d4f84c";
        let fragment_hex = "313233343536373839303a736f6d656f6e65406578616d706c652e636f6d";

        assert_eq!(
            decode_unsubscribe_fragment(key, digest, fragment_hex).unwrap(),
            (1234567890_i64, "someone@example.com".to_string())
        );
    }
}
