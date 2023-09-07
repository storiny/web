use lz_str::decompress_from_encoded_uri_component;
use std::string::FromUtf16Error;

/// Decompresses a compressed URL
///
/// * `compressed_url` - Compressed URL
pub fn decompress_url(compressed_url: &str) -> Option<Result<String, FromUtf16Error>> {
    match decompress_from_encoded_uri_component(&compressed_url.to_string()) {
        Some(url_utf16) => Some(String::from_utf16(&url_utf16)),
        None => None,
    }
}
