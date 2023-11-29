use async_compression::tokio::write::GzipDecoder;
use tokio::io::AsyncWriteExt;

/// Decompresses the given slice of bytes compressed with the DEFLATE compression. Returns a
/// `Vec<u8>` of the decompressed data.
///
/// * `data` - The slice of bytes to decompress.
pub async fn inflate_bytes_gzip(data: &[u8]) -> std::io::Result<Vec<u8>> {
    let mut decoder = GzipDecoder::new(Vec::new());

    decoder.write_all(data).await?;
    decoder.shutdown().await?;

    Ok(decoder.into_inner())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::utils::deflate_bytes_gzip::deflate_bytes_gzip;

    #[tokio::test]
    async fn can_inflate_bytes() {
        let data = "hello".as_bytes();
        let deflated = deflate_bytes_gzip(data, None).await.unwrap();
        let inflated = inflate_bytes_gzip(&deflated).await;

        assert!(inflated.is_ok());
        assert_eq!(
            String::from_utf8(inflated.unwrap()).unwrap(),
            "hello".to_string()
        );
    }
}
