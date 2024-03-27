use crate::jobs::init::JobStorageMap;
use apalis::prelude::*;
use chrono::{
    DateTime,
    Utc,
};
use futures::future;
use std::sync::Arc;
use tracing::info;

pub const CLEANUP_CACHE_JOB_NAME: &str = "j:cleanup:cache";

#[derive(Debug, Clone)]
pub struct CacheCleanupJob(DateTime<Utc>);

impl From<DateTime<Utc>> for CacheCleanupJob {
    fn from(dt: DateTime<Utc>) -> Self {
        CacheCleanupJob(dt)
    }
}

impl Job for CacheCleanupJob {
    const NAME: &'static str = CLEANUP_CACHE_JOB_NAME;
}

/// Job for cleaning done and killed jobs from the cache.
#[tracing::instrument(name = "JOB cleanup_cache", skip_all, err)]
pub async fn cleanup_cache(
    _: CacheCleanupJob,
    storage_map: Data<Arc<JobStorageMap>>,
) -> Result<(), Error> {
    info!("starting cache cleanup");

    let story_add_by_user_job = storage_map.story_add_by_user.clone();
    let story_add_by_tag_job = storage_map.story_add_by_tag.clone();
    let templated_email_job = storage_map.templated_email.clone();

    future::try_join3(
        story_add_by_user_job.vacuum(),
        story_add_by_tag_job.vacuum(),
        templated_email_job.vacuum(),
    )
    .await
    .map_err(Box::new)
    .map_err(|err| Error::Failed(err))?;

    info!("finished cache cleanup");

    Ok(())
}
