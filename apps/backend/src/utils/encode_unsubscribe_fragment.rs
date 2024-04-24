use hex::encode as encode_hex;
use hmac::{
    Hmac,
    Mac,
};
use sha1::Sha1;

type HmacSha1 = Hmac<Sha1>;

/// Generates a personalized unsubscribe fragment for a newsletter email.
///
/// # Structure of fragment
///
/// The fragment is returned as `digest/hex-encoded-fragment`, where `digest` is the hash value of
/// `blog_id:email` and the latter part is the hex encoded representation of the same.
///
/// During decoding,
///
/// * `secret` - The secret key to sign the fragment.
/// * `blog_id` - The ID of the blog to which the newsletter belongs.
/// * `email` - The target email to which the newsletter was sent.
pub fn encode_unsubscribe_fragment<S>(secret: S, blog_id: S, email: S) -> String
where
    S: Into<String>,
{
    let mut mac = match HmacSha1::new_from_slice(secret.as_bytes()) {
        Ok(value) => value,
        Err(_) => return "".to_string(),
    };
    let fragment = format!("{blog_id}:{email}");

    mac.update(fragment.as_bytes());

    let result = mac.finalize();
    let bytes = result.into_bytes();

    format!("{}/{}", encode_hex(bytes), encode_hex(fragment.as_bytes()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn can_generate_cdn_url() {
        let key = "db1309802eadfb86741d3d9f1a900852";
        let digest = "33e1441c8e5ea28b89ed18d99f1bb4b56f03f33f";
        let url_hex = "68747470733a2f2f73746f72696e792e636f6d2f6578616d706c652e6a7067";
        let cdn_url = "https://cdn.storiny.com";

        assert_eq!(
            encode_cdn_url(cdn_url, "https://storiny.com/example.jpg", key, "w@640"),
            format!("{cdn_url}/remote/{}/{digest}/{url_hex}", "w@640")
        );
    }
}
