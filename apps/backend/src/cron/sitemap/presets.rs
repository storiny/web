use crate::{
    constants::buckets::S3_SITEMAPS_BUCKET,
    cron::sitemap::GenerateSitemapResponse,
    utils::deflate_bytes_gzip::deflate_bytes_gzip,
    S3Client,
};
use apalis::prelude::Error;
use sitemap_rs::{
    url::{
        ChangeFrequency,
        Url,
    },
    url_set::UrlSet,
};
use tracing::debug;

/// Generates a URL entry for the provided path.
///
/// * `web_server_url` - The URL of the web server.
/// * `path` - The path string appended to the web server URL.
/// * `priority` - The priority value for the URL entry.
/// * `change_frequency` - An optional change frequency value for the URL entry.
fn build_url_entry(
    web_server_url: &str,
    path: &str,
    priority: f32,
    change_frequency: Option<ChangeFrequency>,
) -> Result<Url, Error> {
    Url::builder(format!("{web_server_url}{path}"))
        .change_frequency(change_frequency.unwrap_or(ChangeFrequency::Yearly))
        .priority(priority)
        .build()
        .map_err(Box::new)
        .map_err(|err| Error::Failed(err))
}

/// Generates the preset sitemap.
///
/// * `s3_client` - The S3 client instance.
/// * `web_server_url` - The URL of the web server.
pub async fn generate_preset_sitemap(
    s3_client: &S3Client,
    web_server_url: &str,
) -> Result<GenerateSitemapResponse, Error> {
    let presets = vec![
        build_url_entry(web_server_url, "/", 1.0, Some(ChangeFrequency::Always))?,
        build_url_entry(web_server_url, "/about", 0.8, None)?,
        build_url_entry(web_server_url, "/branding", 0.8, None)?,
        build_url_entry(web_server_url, "/login", 0.7, None)?,
        build_url_entry(web_server_url, "/signup", 0.7, None)?,
        build_url_entry(web_server_url, "/explore", 0.7, None)?,
        build_url_entry(web_server_url, "/terms", 0.7, None)?,
        build_url_entry(web_server_url, "/privacy", 0.7, None)?,
        build_url_entry(web_server_url, "/guidelines", 0.7, None)?,
        build_url_entry(web_server_url, "/cookies", 0.7, None)?,
        build_url_entry(web_server_url, "/membership", 0.7, None)?,
    ];

    let preset_count = presets.len();
    // Throws error when the number of presets are > 50,000
    let url_set: UrlSet = UrlSet::new(presets)
        .map_err(Box::new)
        .map_err(|err| Error::Failed(err))?;
    let mut buffer = Vec::new();

    url_set
        .write(&mut buffer)
        .map_err(Box::new)
        .map_err(|err| Error::Failed(err))?;

    let compressed_bytes = deflate_bytes_gzip(&buffer, None)
        .await
        .map_err(Box::new)
        .map_err(|err| Error::Failed(err))?;

    debug!(
        "sitemap size after compression: {} bytes",
        compressed_bytes.len()
    );

    s3_client
        .put_object()
        .bucket(S3_SITEMAPS_BUCKET)
        .key("presets.xml")
        .content_type("application/xml")
        .content_encoding("gzip")
        .content_disposition(r#"attachment; filename="presets.xml""#)
        .body(compressed_bytes.into())
        .send()
        .await
        .map_err(|error| Box::new(error.into_service_error()))
        .map_err(|error| Error::Failed(error))?;

    Ok(GenerateSitemapResponse {
        url_count: preset_count as u32,
        file_count: 1,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        config::get_app_config,
        test_utils::{
            count_s3_objects,
            get_s3_client,
            TestContext,
        },
    };
    use storiny_macros::test_context;

    struct LocalTestContext {
        s3_client: S3Client,
    }

    #[async_trait::async_trait]
    impl TestContext for LocalTestContext {
        async fn setup() -> LocalTestContext {
            LocalTestContext {
                s3_client: get_s3_client().await,
            }
        }

        async fn teardown(self) {
            let _ = &self
                .s3_client
                .delete_object()
                .bucket(S3_SITEMAPS_BUCKET)
                .key("presets.xml")
                .send()
                .await
                .unwrap();
        }
    }

    mod serial {
        use super::*;

        #[test_context(LocalTestContext)]
        #[tokio::test]
        async fn can_generate_preset_sitemap(ctx: &mut LocalTestContext) {
            let config = get_app_config().unwrap();
            let s3_client = &ctx.s3_client;
            let result = generate_preset_sitemap(s3_client, &config.web_server_url).await;

            assert!(result.is_ok());

            // Sitemap file should be present in the bucket.
            let sitemap_count = count_s3_objects(
                s3_client,
                S3_SITEMAPS_BUCKET,
                Some("presets.xml".to_string()),
                None,
            )
            .await
            .unwrap();

            assert_eq!(sitemap_count, 1);
        }
    }
}
