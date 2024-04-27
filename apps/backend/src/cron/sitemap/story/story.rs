use crate::{
    constants::buckets::S3_SITEMAPS_BUCKET,
    cron::sitemap::GenerateSitemapResponse,
    utils::{
        deflate_bytes_gzip::deflate_bytes_gzip,
        get_sitemap_change_freq::get_sitemap_change_freq,
    },
    S3Client,
};
use apalis::prelude::Error;
use async_recursion::async_recursion;
use chrono::DateTime;
use sitemap_rs::{
    url::Url,
    url_set::UrlSet,
};
use sqlx::{
    FromRow,
    Pool,
    Postgres,
};
use time::OffsetDateTime;
use tracing::debug;

/// The maximum number of story entries per sitemap file.
const CHUNK_SIZE: u32 = 50_000;

#[derive(Debug, FromRow)]
struct Story {
    change_freq: String,
    url: String,
    edited_at: Option<OffsetDateTime>,
}

/// Generates story sitemaps.
///
/// * `db_pool` - The Postgres connection pool.
/// * `s3_client` - The S3 client instance.
/// * `web_server_url` - The URL of the web server, used to generate story URLs.
/// * `index` - (Private) An index counter used to keep track of the generated sitemap files.
/// * `offset` - (Private) An offset value used to skip the specified number of rows during the
///   generation of different chunked sitemap files.
#[async_recursion]
pub async fn generate_story_sitemap(
    db_pool: &Pool<Postgres>,
    s3_client: &S3Client,
    web_server_url: &str,
    index: Option<u16>,
    offset: Option<u32>,
) -> Result<GenerateSitemapResponse, Error> {
    // We can currently generate entries for upto 750 million stories (15_000 files x 50_0000
    // entries per file) across 15,000 sitemap files. Raise this value (would require multiple
    // sitemap index files) when we exceed this limit :)
    if index.unwrap_or_default() >= 15_000 {
        return Ok(GenerateSitemapResponse::default());
    }

    debug!("starting to generate sitemap at index: {index:?} with offset: {offset:?}");

    let mut generated_result = GenerateSitemapResponse::default();

    let mut result = sqlx::query_as::<_, Story>(
        r#"
SELECT
    s.edited_at,
    CASE
        WHEN COALESCE(s.edited_at, s.published_at) >= (NOW() - INTERVAL '1 week')
            THEN 'weekly'
        WHEN COALESCE(s.edited_at, s.published_at) >= (NOW() - INTERVAL '6 months')
            THEN 'monthly'
        ELSE 'yearly'
    END AS change_freq,
    $3 || '/' || "s->user".username || '/' || s.slug AS url
FROM
    stories s
        INNER JOIN users AS "s->user"
            ON s.user_id = "s->user".id
            -- Ignore stories from private users
            AND "s->user".is_private IS FALSE
WHERE
      s.published_at IS NOT NULL
      -- Public
  AND s.visibility = 2
  AND s.deleted_at IS NULL
ORDER BY
    s.read_count DESC
LIMIT $1 OFFSET $2
"#,
    )
    // Return a maximum of 50,000 rows for a single sitemap file. (+1) is added to determine whether
    // there are more rows to return.
    .bind((CHUNK_SIZE + 1) as i32)
    .bind((offset.unwrap_or_default() * CHUNK_SIZE) as i32)
    .bind(web_server_url)
    .fetch_all(db_pool)
    .await
    .map_err(Box::new)
    .map_err(|err| Error::Failed(err))?
    .iter()
    .filter_map(|row| {
        let mut url_builder = Url::builder(row.url.to_string());

        url_builder
            .change_frequency(get_sitemap_change_freq(&row.change_freq))
            .priority(0.4);

        if let Some(edited_at) = row.edited_at {
            if let Some(last_mod) = DateTime::from_timestamp(edited_at.unix_timestamp(), 0) {
                url_builder.last_modified(last_mod.fixed_offset());
            }
        }

        // This should never error as the priority is a constant value and there are no images.
        url_builder.build().ok()
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
            .key(format!("stories-{}.xml", index.unwrap_or_default()))
            .content_type("application/xml")
            .content_encoding("gzip")
            .content_disposition(format!(
                r#"attachment; filename="stories-{}.xml""#,
                index.unwrap_or_default()
            ))
            .body(compressed_bytes.into())
            .send()
            .await
            .map_err(|error| Box::new(error.into_service_error()))
            .map_err(|err| Error::Failed(err))?;

        generated_result.url_count += result_length;
        generated_result.file_count += 1;
    }

    // Recurse if there are more rows to return.
    if has_more_rows {
        let next_result = generate_story_sitemap(
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
                Some("stories-".to_string()),
                None,
            )
            .await
            .unwrap();
        }
    }

    mod serial {
        use super::*;

        #[test_context(LocalTestContext)]
        #[sqlx::test(fixtures("story"))]
        async fn can_generate_story_sitemap(
            ctx: &mut LocalTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let config = get_app_config().unwrap();
            let s3_client = &ctx.s3_client;
            let result =
                generate_story_sitemap(&pool, s3_client, &config.web_server_url, None, None).await;

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
                Some("stories-".to_string()),
                None,
            )
            .await
            .unwrap();

            assert_eq!(sitemap_count, 1);

            Ok(())
        }

        #[test_context(LocalTestContext)]
        #[sqlx::test(fixtures("large_dataset"))]
        async fn can_generate_story_sitemap_for_large_dataset(
            ctx: &mut LocalTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let config = get_app_config().unwrap();
            let s3_client = &ctx.s3_client;
            let result =
                generate_story_sitemap(&pool, s3_client, &config.web_server_url, None, None).await;

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
                Some("stories-".to_string()),
                None,
            )
            .await
            .unwrap();

            assert_eq!(sitemap_count, 3);

            Ok(())
        }
    }
}
