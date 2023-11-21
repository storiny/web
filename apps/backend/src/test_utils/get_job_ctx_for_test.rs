use crate::{
    config::Config,
    jobs::init::SharedJobState,
};
use apalis::prelude::*;
use rusoto_mock::{
    MockCredentialsProvider,
    MockRequestDispatcher,
};
use rusoto_s3::S3Client;
use rusoto_signature::Region;
use sqlx::PgPool;
use std::sync::Arc;

/// Initializes returns a background job context for tests
///
/// * `db_pool` - Postgres pool
pub async fn get_job_ctx_for_test(db_pool: PgPool) -> JobContext {
    let config = envy::from_env::<Config>().expect("Unable to load environment configuration");

    // Redis pool
    let redis_pool = deadpool_redis::Config::from_url(format!(
        "redis://{}:{}",
        &config.redis_host, &config.redis_port
    ))
    .create_pool(Some(deadpool_redis::Runtime::Tokio1))
    .unwrap();

    let shared_state = Arc::new(SharedJobState {
        config: envy::from_env::<Config>().unwrap(),
        redis: redis_pool,
        db_pool,
        s3_client: S3Client::new_with(
            MockRequestDispatcher::default(),
            MockCredentialsProvider,
            Region::UsEast1,
        ),
    });

    let mut ctx = JobContext::new(JobId::new());
    ctx.insert(shared_state);

    ctx
}
