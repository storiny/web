use crate::{
    config::get_app_config,
    cron::init::SharedCronJobState,
    test_utils::get_s3_client,
    S3Client,
};
use apalis::prelude::*;
use sqlx::PgPool;
use std::sync::Arc;

/// Initializes and returns the cron job state for tests.
///
/// * `db_pool` - The Postgres connection pool.
/// * `s3_client` - An optional S3 client instance.
pub async fn get_cron_job_state_for_test(
    db_pool: PgPool,
    s3_client: Option<S3Client>,
) -> Data<Arc<SharedCronJobState>> {
    let shared_state = Arc::new(SharedCronJobState {
        config: get_app_config().unwrap(),
        db_pool,
        s3_client: s3_client.unwrap_or(get_s3_client().await),
    });

    Data::new(shared_state)
}
