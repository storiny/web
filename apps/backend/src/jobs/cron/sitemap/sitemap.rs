use crate::jobs::init::SharedJobState;
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

pub async fn refresh_sitemap(job: SitemapJob, ctx: JobContext) -> Result<(), JobError> {
    log::info!("Attempting to refresh sitemaps");

    let state = ctx.data::<Arc<SharedJobState>>()?;
    let result = sqlx::query(r#""#)
        .execute(&state.db_pool)
        .await
        .map_err(Box::new)
        .map_err(|err| JobError::Failed(err))?;

    log::info!("Regenerated {} sitemaps", result.rows_affected(),);

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
}
