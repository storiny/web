use crate::{
    config::get_app_config,
    jobs::init::SharedJobState,
    test_utils::get_redis_pool,
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
    let redis_pool = get_redis_pool();
    let shared_state = Arc::new(SharedJobState {
        config: get_app_config().unwrap(),
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
