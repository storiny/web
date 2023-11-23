use crate::{
    constants::buckets::S3_SITEMAPS_BUCKET,
    jobs::{
        cron::sitemap::story::generate_story_sitemap,
        init::SharedJobState,
    },
    utils::delete_s3_objects::delete_s3_objects,
};
use apalis::prelude::*;
use chrono::{
    DateTime,
    Utc,
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

pub async fn refresh_sitemap(_: SitemapJob, ctx: JobContext) -> Result<(), JobError> {
    log::info!("Attempting to refresh sitemaps");

    let state = ctx.data::<Arc<SharedJobState>>()?;
    let deleted_sitemaps = delete_s3_objects(&state.s3_client, S3_SITEMAPS_BUCKET, None, None)
        .await
        .map_err(|err| Box::from(err.to_string()))
        .map_err(|err| JobError::Failed(err))?;

    log::trace!("Deleted {} old sitemap files", deleted_sitemaps);

    let generated_sitemap_count = generate_story_sitemap(
        &state.db_pool,
        &state.s3_client,
        &state.config.web_server_url,
        None,
        None,
    )
    .await?;

    log::info!(
        "Regenerated {} story sitemap files",
        generated_sitemap_count.file_count
    );

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
}
