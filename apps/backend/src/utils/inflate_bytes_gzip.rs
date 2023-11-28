use async_compression::tokio::write::GzipDecoder;
use tokio::io::AsyncWriteExt;

// TODO: Write tests

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
