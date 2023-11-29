use async_compression::tokio::write::GzipEncoder;
use tokio::io::AsyncWriteExt;

pub use async_compression::Level as CompressionLevel;

/// Compresses the given slice of bytes with DEFLATE compression. Returns a `Vec<u8>` of the
/// compressed data.
///
/// * `data` - The slice of bytes to compress.
/// * `level` - The compression level. Defaults to [CompressionLevel::Fastest].
pub async fn deflate_bytes_gzip(
    data: &[u8],
    level: Option<CompressionLevel>,
) -> std::io::Result<Vec<u8>> {
    let mut encoder =
        GzipEncoder::with_quality(Vec::new(), level.unwrap_or(CompressionLevel::Fastest));

    encoder.write_all(data).await?;
    encoder.shutdown().await?;

    Ok(encoder.into_inner())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::utils::inflate_bytes_gzip::inflate_bytes_gzip;

    #[tokio::test]
    async fn can_deflate_bytes() {
        let data = "hello".as_bytes();
        let deflated = deflate_bytes_gzip(data, None).await;

        assert!(deflated.is_ok());

        let inflated = inflate_bytes_gzip(&deflated.unwrap()).await.unwrap();

        assert_eq!(String::from_utf8(inflated).unwrap(), "hello".to_string());
    }
}
