use dotenv;
use hex::encode as encode_hex;
use hmac::{
    Hmac,
    Mac,
};
use sha1::Sha1;

type HmacSha1 = Hmac<Sha1>;

/// Signs a third-party image URL with the private IMG_PROXY_KEY to serve them through the CDN,
/// preventing unsecure context warnings and providing cached versions.
///
/// * `url` - URL of the image
/// * `key` - Optional IMG_PROXY_KEY for testing
pub fn encode_cdn_url(url: &str, key: Option<String>) -> String {
    let cdn_url = dotenv::var("CDN_URL").expect("CDN_URL is not set").clone();
    let proxy_key = key.unwrap_or_else(|| {
        dotenv::var("IMG_PROXY_KEY")
            .expect("IMG_PROXY_KEY is not set")
            .clone()
    });

    let mut mac = HmacSha1::new_from_slice(&proxy_key.as_bytes()).unwrap();
    mac.update(url.as_bytes());

    let result = mac.finalize();
    let code_bytes = result.into_bytes();

    format!(
        "{cdn_url}/remote/{}/{}",
        encode_hex(code_bytes),
        encode_hex(url.as_bytes())
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn can_generate_cdn_url() {
        let key = "db1309802eadfb86741d3d9f1a900852";
        let digest = "31ec5d578efd842ff5890422325fb8ea029224c7";
        let url_hex = "687474703a2f2f73746f72696e792e636f6d2f6578616d706c652e6a7067";
        let cdn_url = dotenv::var("CDN_URL").expect("CDN_URL is not set").clone();

        assert_eq!(
            encode_cdn_url("http://storiny.com/example.jpg", Some(key.to_string())),
            format!(
                "{cdn_url}/remote/{}/{}",
                digest.to_string(),
                url_hex.to_string()
            )
        );
    }
}
