use crate::{
    constants::buckets::S3_SITEMAPS_BUCKET,
    cron::sitemap::GenerateSitemapResponse,
    utils::deflate_bytes_gzip::deflate_bytes_gzip,
    S3Client,
};
use apalis::prelude::Error;
use async_recursion::async_recursion;
use sitemap_rs::{
    url::{
        ChangeFrequency,
        Url,
    },
    url_set::UrlSet,
};
use sqlx::{
    FromRow,
    Pool,
    Postgres,
};
use tracing::debug;

/// The maximum number of tag entries per sitemap file.
const CHUNK_SIZE: u32 = 50_000;

#[derive(Debug, FromRow)]
struct Tag {
    name: String,
}

/// Generates tag sitemaps.
///
/// * `db_pool` - The Postgres connection pool.
/// * `s3_client` - The S3 client instance.
/// * `web_server_url` - The URL of the web server, used to generate tag page URLs.
/// * `index` - (Private) An index counter used to keep track of the generated sitemap files.
/// * `offset` - (Private) An offset value used to skip the specified number of rows during the
///   generation of different chunked sitemap files.
#[async_recursion]
pub async fn generate_tag_sitemap(
    db_pool: &Pool<Postgres>,
    s3_client: &S3Client,
    web_server_url: &str,
    index: Option<u16>,
    offset: Option<u32>,
) -> Result<GenerateSitemapResponse, Error> {
    // We can currently generate entries for upto 500 million tags (10_000 files x 50_0000
    // entries per file) across 10,000 sitemap files. Raise this value (would require multiple
    // sitemap index files) when we exceed this limit :)
    if index.unwrap_or_default() >= 10_000 {
        return Ok(GenerateSitemapResponse::default());
    }

    debug!("starting to generate sitemap at index: {index:?} with offset: {offset:?}");

    let mut generated_result = GenerateSitemapResponse::default();

    let mut result = sqlx::query_as::<_, Tag>(
        r#"
SELECT t.name
FROM tags t
ORDER BY t.follower_count DESC
LIMIT $1 OFFSET $2
"#,
    )
    // Return a maximum of 50,000 rows for a single sitemap file. (+1) is added to determine whether
    // there are more rows to return.
    .bind((CHUNK_SIZE + 1) as i32)
    .bind((offset.unwrap_or_default() * CHUNK_SIZE) as i32)
    .fetch_all(db_pool)
    .await
    .map_err(Box::new)
    .map_err(|err| Error::Failed(err))?
    .iter()
    .filter_map(|row| {
        Url::builder(format!("{web_server_url}/tag/{}", row.name))
            .change_frequency(ChangeFrequency::Monthly)
            .priority(0.4)
            .build()
            // This should never error as the priority is a constant value and there are no images.
            .ok()
    })
    .collect::<Vec<_>>();

    let mut result_length = result.len() as u32;
    let has_more_rows = result_length > CHUNK_SIZE;

    debug!("received {result_length} rows from the database");

    // Upload the sitemap to S3 if it is non-empty.
    if !result.is_empty() {
        if has_more_rows {
            result.pop(); // Remove the extra row
            result_length -= 1;
        }

        // This should never error as the number of rows are always <= 50,000
        let url_set = UrlSet::new(result)
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
            .key(format!("tags-{}.xml", index.unwrap_or_default()))
            .content_type("application/xml")
            .content_encoding("gzip")
            .content_disposition(format!(
                r#"attachment; filename="tags-{}.xml""#,
                index.unwrap_or_default()
            ))
            .body(compressed_bytes.into())
            .send()
            .await
            .map_err(|error| Box::new(error.into_service_error()))
            .map_err(|error| Error::Failed(error))?;

        generated_result.url_count += result_length;
        generated_result.file_count += 1;
    }

    // Recurse if there are more rows to return.
    if has_more_rows {
        let next_result = generate_tag_sitemap(
            db_pool,
            s3_client,
            web_server_url,
            Some(index.unwrap_or_default() + 1),
            Some(offset.unwrap_or_default() + 1),
        )
        .await?;

        generated_result.url_count += next_result.url_count;
        generated_result.file_count += next_result.file_count;
    }

    Ok(generated_result)
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
        utils::delete_s3_objects_using_prefix::delete_s3_objects_using_prefix,
    };
    use sqlx::PgPool;
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
            delete_s3_objects_using_prefix(
                &self.s3_client,
                S3_SITEMAPS_BUCKET,
                Some("tags-".to_string()),
                None,
            )
            .await
            .unwrap();
        }
    }

    mod serial {
        use super::*;

        #[test_context(LocalTestContext)]
        #[sqlx::test(fixtures("tag"))]
        async fn can_generate_tag_sitemap(
            ctx: &mut LocalTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let config = get_app_config().unwrap();
            let s3_client = &ctx.s3_client;
            let result =
                generate_tag_sitemap(&pool, s3_client, &config.web_server_url, None, None).await;

            assert!(result.is_ok());
            assert_eq!(
                result.unwrap(),
                GenerateSitemapResponse {
                    url_count: 5,
                    file_count: 1,
                }
            );

            // Sitemaps should be present in the bucket.
            let sitemap_count = count_s3_objects(
                s3_client,
                S3_SITEMAPS_BUCKET,
                Some("tags-".to_string()),
                None,
            )
            .await
            .unwrap();

            assert_eq!(sitemap_count, 1);

            Ok(())
        }

        #[test_context(LocalTestContext)]
        #[sqlx::test(fixtures("large_dataset"))]
        async fn can_generate_tag_sitemap_for_large_dataset(
            ctx: &mut LocalTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let config = get_app_config().unwrap();
            let s3_client = &ctx.s3_client;
            let result =
                generate_tag_sitemap(&pool, s3_client, &config.web_server_url, None, None).await;

            assert!(result.is_ok());
            assert_eq!(
                result.unwrap(),
                GenerateSitemapResponse {
                    url_count: 125700,
                    file_count: 3,
                }
            );

            // Sitemaps should be present in the bucket.
            let sitemap_count = count_s3_objects(
                s3_client,
                S3_SITEMAPS_BUCKET,
                Some("tags-".to_string()),
                None,
            )
            .await
            .unwrap();

            assert_eq!(sitemap_count, 3);

            Ok(())
        }
    }
}
