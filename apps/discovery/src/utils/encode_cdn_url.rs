use hex::encode as encode_hex;
use hmac::{
    Hmac,
    Mac,
};
use sha1::Sha1;

type HmacSha1 = Hmac<Sha1>;

/// Signs a third-party image URL with the provided `proxy_key` to serve them through the CDN,
/// preventing unsecure context warnings and providing cached versions.
///
/// * `cdn_url` - The public URL of the CDN server.
/// * `image_url` - The URL of the image.
/// * `proxy_key` - The private proxy key secret.
/// * `size` - The desired image size.
pub fn encode_cdn_url(cdn_url: &str, image_url: &str, proxy_key: &str, size: &str) -> String {
    let mut mac = match HmacSha1::new_from_slice(proxy_key.as_bytes()) {
        Ok(value) => value,
        Err(_) => return "".to_string(),
    };

    mac.update(image_url.as_bytes());

    let result = mac.finalize();
    let code_bytes = result.into_bytes();

    format!(
        "{cdn_url}/remote/{}/{}/{}",
        size,
        encode_hex(code_bytes),
        encode_hex(image_url.as_bytes())
    )
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
