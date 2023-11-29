use crate::{
    config::get_app_config,
    get_aws_behavior_version,
    get_aws_region,
    jobs::init::SharedJobState,
    test_utils::{
        get_redis_pool,
        get_s3_client,
    },
    S3Client,
    SesClient,
};
use apalis::prelude::*;
use sqlx::PgPool;
use std::sync::Arc;

/// Initializes returns a background job context for tests.
///
/// * `db_pool` - The Postgres connection pool.
/// * `s3_client` - An optional S3 client instance.
pub async fn get_job_ctx_for_test(db_pool: PgPool, s3_client: Option<S3Client>) -> JobContext {
    let shared_aws_config = aws_config::defaults(get_aws_behavior_version())
        .region(get_aws_region())
        .load()
        .await;
    let redis_pool = get_redis_pool();

    let shared_state = Arc::new(SharedJobState {
        config: get_app_config().unwrap(),
        redis: redis_pool,
        db_pool,
        ses_client: SesClient::new(&shared_aws_config),
        s3_client: s3_client.unwrap_or(get_s3_client().await),
    });

    let mut ctx = JobContext::new(JobId::new());
    ctx.insert(shared_state);

    ctx
}
