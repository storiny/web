use lz_str::decompress_from_encoded_uri_component;
use std::string::FromUtf16Error;

/// Decompresses a URL compressed using [lz_str::compress_to_encoded_uri_component].
///
/// * `compressed_url` - The Compressed URL.
pub fn decompress_url(compressed_url: &str) -> Option<Result<String, FromUtf16Error>> {
    decompress_from_encoded_uri_component(&compressed_url.to_string())
        .map(|url_utf16| String::from_utf16(&url_utf16))
}

#[cfg(test)]
mod tests {
    use super::*;
    use lz_str::compress_to_encoded_uri_component;

    #[test]
    fn can_decompress_url() {
        let url = "https://storiny.com/some-path?with=query";
        let compressed_url = compress_to_encoded_uri_component(url);
        let decompressed_url = decompress_url(&compressed_url).unwrap().unwrap();

        assert_eq!(decompressed_url, url);
    }
}
