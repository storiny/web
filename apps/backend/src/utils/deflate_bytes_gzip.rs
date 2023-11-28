use async_compression::tokio::write::GzipEncoder;
use tokio::io::AsyncWriteExt;

pub use async_compression::Level as CompressionLevel;

// TODO: Write tests

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
