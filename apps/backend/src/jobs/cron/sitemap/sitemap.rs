use crate::{
    constants::buckets::S3_SITEMAPS_BUCKET,
    jobs::{
        cron::sitemap::{
            presets::generate_preset_sitemap,
            story::generate_story_sitemap,
            tag::generate_tag_sitemap,
            user::generate_user_sitemap,
            GenerateSitemapResponse,
        },
        init::SharedJobState,
    },
    utils::delete_s3_objects::delete_s3_objects,
};
use apalis::prelude::*;
use chrono::{
    DateTime,
    Utc,
};
use deflate::{
    deflate_bytes_gzip_conf,
    Compression,
};
use futures::future;
use gzip_header::GzBuilder;
use rusoto_s3::{
    PutObjectRequest,
    S3,
};
use sitemap_rs::{
    sitemap::Sitemap,
    sitemap_index::SitemapIndex,
};
use std::sync::Arc;

pub const SITEMAP_JOB_NAME: &'static str = "j:sitemap";

#[derive(Debug, Clone)]
pub struct SitemapJob(DateTime<Utc>);

impl From<DateTime<Utc>> for SitemapJob {
    fn from(dt: DateTime<Utc>) -> Self {
        SitemapJob(dt)
    }
}

impl Job for SitemapJob {
    const NAME: &'static str = SITEMAP_JOB_NAME;
}

/// Regenerates all the sitemaps.
pub async fn refresh_sitemap(
    _: SitemapJob,
    ctx: JobContext,
) -> Result<GenerateSitemapResponse, JobError> {
    log::info!("Attempting to refresh sitemaps");

    let state = ctx.data::<Arc<SharedJobState>>()?;
    let s3_client = &state.s3_client;
    let deleted_sitemaps = delete_s3_objects(s3_client, S3_SITEMAPS_BUCKET, None, None)
        .await
        .map_err(|err| Box::from(err.to_string()))
        .map_err(|err| JobError::Failed(err))?;

    log::trace!("Deleted {} old sitemap files", deleted_sitemaps);

    // Generate individual sitemap files.

    let preset_sitemap_future = generate_preset_sitemap(s3_client, &state.config.web_server_url);

    let story_sitemap_future = generate_story_sitemap(
        &state.db_pool,
        s3_client,
        &state.config.web_server_url,
        None,
        None,
    );

    let user_sitemap_future = generate_user_sitemap(
        &state.db_pool,
        s3_client,
        &state.config.web_server_url,
        &state.config.cdn_server_url,
        None,
        None,
    );

    let tag_sitemap_future = generate_tag_sitemap(
        &state.db_pool,
        s3_client,
        &state.config.web_server_url,
        None,
        None,
    );

    let (preset_sitemap_result, story_sitemap_result, user_sitemap_result, tag_sitemap_result) =
        future::try_join4(
            preset_sitemap_future,
            story_sitemap_future,
            user_sitemap_future,
            tag_sitemap_future,
        )
        .await?;

    let total_sitemap_file_count = preset_sitemap_result.file_count
        + story_sitemap_result.file_count
        + user_sitemap_result.file_count
        + tag_sitemap_result.file_count;
    let total_sitemap_url_count = preset_sitemap_result.url_count
        + story_sitemap_result.url_count
        + user_sitemap_result.url_count
        + tag_sitemap_result.url_count;

    log::trace!(
        r#"
        Regenerated sitemap files:
        - {} preset sitemap file(s) with {} entrie(s)
        - {} story sitemap file(s) with {} entrie(s)
        - {} user sitemap file(s) with {} entrie(s)
        - {} tag sitemap file(s) with {} entrie(s)
        
        - {} total sitemap file(s) with {} entrie(s)
        "#,
        preset_sitemap_result.file_count,
        preset_sitemap_result.url_count,
        story_sitemap_result.file_count,
        story_sitemap_result.url_count,
        user_sitemap_result.file_count,
        user_sitemap_result.url_count,
        tag_sitemap_result.file_count,
        tag_sitemap_result.url_count,
        total_sitemap_file_count,
        total_sitemap_url_count
    );

    // Generate a sitemap index file.

    let mut sitemaps: Vec<Sitemap> = vec![Sitemap::new(
        format!("{}/sitemaps/presets.xml.gz", &state.config.cdn_server_url),
        Some(Utc::now().fixed_offset()),
    )];

    for file_index in 0..story_sitemap_result.file_count {
        sitemaps.push(Sitemap::new(
            format!(
                "{}/sitemaps/stories-{}.xml.gz",
                &state.config.cdn_server_url, file_index
            ),
            Some(Utc::now().fixed_offset()),
        ));
    }

    for file_index in 0..user_sitemap_result.file_count {
        sitemaps.push(Sitemap::new(
            format!(
                "{}/sitemaps/users-{}.xml.gz",
                &state.config.cdn_server_url, file_index
            ),
            Some(Utc::now().fixed_offset()),
        ));
    }

    for file_index in 0..tag_sitemap_result.file_count {
        sitemaps.push(Sitemap::new(
            format!(
                "{}/sitemaps/tags-{}.xml.gz",
                &state.config.cdn_server_url, file_index
            ),
            Some(Utc::now().fixed_offset()),
        ));
    }

    // This fails if there are more than 50,000 entries in the index file.
    let index_sitemap: SitemapIndex = SitemapIndex::new(sitemaps)
        .map_err(Box::new)
        .map_err(|err| JobError::Failed(err))?;

    // Finally, upload the sitemap index file to the bucket.

    let mut buf = Vec::new();

    index_sitemap
        .write(&mut buf)
        .map_err(Box::new)
        .map_err(|err| JobError::Failed(err))?;

    let gzipped_bytes = deflate_bytes_gzip_conf(&buf, Compression::Fast, GzBuilder::new());

    s3_client
        .put_object(PutObjectRequest {
            bucket: S3_SITEMAPS_BUCKET.to_string(),
            key: "index.xml.gz".to_string(),
            content_type: Some("application/x-gzip".to_string()),
            content_encoding: Some("gzip".to_string()),
            content_disposition: Some(r#"attachment; filename="index.xml.gz""#.to_string()),
            body: Some(gzipped_bytes.into()),
            ..Default::default()
        })
        .await
        .map_err(Box::new)
        .map_err(|err| JobError::Failed(err))?;

    log::info!("Regenerate sitemap index file");

    Ok(GenerateSitemapResponse {
        file_count: total_sitemap_file_count + 1, // Add one for the index file itself
        url_count: total_sitemap_url_count,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        count_s3_objects,
        get_job_ctx_for_test,
        get_s3_client,
        TestContext,
    };
    use rusoto_s3::S3Client;
    use serial_test::serial;
    use sqlx::PgPool;
    use storiny_macros::test_context;

    struct LocalTestContext {
        s3_client: S3Client,
    }

    #[async_trait::async_trait]
    impl TestContext for LocalTestContext {
        async fn setup() -> LocalTestContext {
            LocalTestContext {
                s3_client: get_s3_client(),
            }
        }

        async fn teardown(self) {
            delete_s3_objects(&self.s3_client, S3_SITEMAPS_BUCKET, None, None)
                .await
                .unwrap();
        }
    }

    #[test_context(LocalTestContext)]
    #[sqlx::test(fixtures("sitemap"))]
    #[serial]
    async fn can_generate_sitemap(ctx: &mut LocalTestContext, pool: PgPool) {
        let s3_client = &ctx.s3_client;
        let ctx = get_job_ctx_for_test(pool, Some(s3_client.clone())).await;
        let result = refresh_sitemap(SitemapJob { 0: Utc::now() }, ctx).await;
        // 1 preset file + 1 story file + 1 user file + 1 tag file + 1 index sitemap file
        let expected_sitemap_file_count = 5;

        assert!(result.is_ok());
        assert_eq!(result.unwrap().file_count, expected_sitemap_file_count);

        // Sitemaps should be present in the bucket
        let sitemap_count = count_s3_objects(&s3_client, S3_SITEMAPS_BUCKET, None, None)
            .await
            .unwrap();

        assert_eq!(sitemap_count, expected_sitemap_file_count);
    }

    #[test_context(LocalTestContext)]
    #[sqlx::test(fixtures("large_dataset"))]
    #[serial]
    async fn can_generate_sitemap_for_large_dataset(ctx: &mut LocalTestContext, pool: PgPool) {
        let s3_client = &ctx.s3_client;
        let ctx = get_job_ctx_for_test(pool, Some(s3_client.clone())).await;
        let result = refresh_sitemap(SitemapJob { 0: Utc::now() }, ctx).await;
        // 1 preset file + 3 story files + 3 user files + 3 tag files + 1 index sitemap file
        let expected_sitemap_file_count = 11;

        assert!(result.is_ok());
        assert_eq!(result.unwrap().file_count, expected_sitemap_file_count);

        // Sitemaps should be present in the bucket
        let sitemap_count = count_s3_objects(&s3_client, S3_SITEMAPS_BUCKET, None, None)
            .await
            .unwrap();

        assert_eq!(sitemap_count, expected_sitemap_file_count);
    }
}
