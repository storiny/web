use crate::jobs::{
    email::templated_email::TEMPLATED_EMAIL_JOB_NAME,
    init::SharedJobState,
    notify::{
        story_add_by_tag::NOTIFY_STORY_ADD_BY_TAG_JOB_NAME,
        story_add_by_user::NOTIFY_STORY_ADD_BY_USER_JOB_NAME,
    },
};
use apalis::prelude::*;
use chrono::{
    DateTime,
    Utc,
};
use futures_util::StreamExt;
use redis::AsyncCommands;
use std::sync::Arc;
use tracing::info;

// TODO: Remove this cron job once https://github.com/geofmureithi/apalis/issues/149 is implemented.

pub const CLEANUP_CACHE_JOB_NAME: &'static str = "j:cleanup:cache";

/// Duration of the expiry (in seconds).
const EXPIRY_DURATION: usize = 259200; // 3 days

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

/// Temporary job for setting an expiry on the job keys in the cache.
///
/// This job will be removed when https://github.com/geofmureithi/apalis/issues/149 is implemented.
#[tracing::instrument(name = "JOB cleanup_cache", skip_all, ret, err)]
pub async fn cleanup_cache(_: CacheCleanupJob, ctx: JobContext) -> Result<(), JobError> {
    info!("starting cache cleanup");

    let job_prefixes = vec![
        TEMPLATED_EMAIL_JOB_NAME,
        NOTIFY_STORY_ADD_BY_TAG_JOB_NAME,
        NOTIFY_STORY_ADD_BY_USER_JOB_NAME,
    ];
    let job_suffixes = vec!["dead", "done", "failed", "data"];

    let state = ctx.data::<Arc<SharedJobState>>()?;
    let redis_pool = &state.redis;
    let mut conn = redis_pool
        .get()
        .await
        .map_err(|err| Box::from(err.to_string()))
        .map_err(|err| JobError::Failed(err))?;

    for prefix in &job_prefixes {
        for suffix in &job_suffixes {
            let iter = conn
                .scan_match::<_, String>(format!("{prefix}:{suffix}"))
                .await;

            if let Err(err) = iter {
                return Err(JobError::Failed(Box::from(err.to_string())));
            }

            let iter = iter.unwrap();

            let collected_keys: Vec<String> = iter.collect().await;
            let keys = collected_keys.iter().filter(|key| !key.is_empty());

            for key in keys {
                let result = redis::cmd("EXPIRE")
                    .arg(key)
                    .arg(EXPIRY_DURATION)
                    .arg("NX") // NX: only set if the key does not have an expiry
                    .query_async::<_, ()>(&mut *conn)
                    .await;

                if let Err(err) = result {
                    return Err(JobError::Failed(Box::from(err.to_string())));
                }
            }
        }
    }

    info!("finished cache cleanup");

    Ok(())
}

#[cfg(test)]
mod tests {}
