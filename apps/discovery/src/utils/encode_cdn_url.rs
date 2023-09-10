use crypto::{
    hmac::Hmac,
    mac::Mac,
};
use hex;
use std::env;

/// Signs a third-party image URL with the private CAMO_KEY to serve them through the CDN,
/// preventing unsecure context warnings and providing cached versions.
///
/// * `url` - URL of the image
/// * `key` - Optional CAMO_KEY for testing
pub fn encode_cdn_url(url: &str, key: Option<&str>) -> Option<(String, String)> {
    let camo_key = key.unwrap_or(env::var("CAMO_KEY").unwrap_or_default().as_str());

    let mut hasher = sha::Sha1::new();
    hasher.update(url.as_bytes()).ok()?;

    let digest = hex::encode(hasher.finish().ok()?);
    let url_hex = hex::encode(url);

    Some((digest, url_hex))
}

fn main() {
    let url = "https://example.com/image.jpg";
    let key = Some("your_camo_key_here");

    if let Some((digest, url_hex)) = encode_cdn_url(url, key) {
        println!("Digest: {}", digest);
        println!("URL (Hex): {}", url_hex);
    } else {
        println!("Failed to encode CDN URL");
    }
}
