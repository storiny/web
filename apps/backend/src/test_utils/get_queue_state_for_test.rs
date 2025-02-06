use crate::{
    S3Client,
    SesClient,
    amqp::init::SharedQueueState,
    config::get_app_config,
    get_aws_behavior_version,
    get_aws_region,
    test_utils::{
        get_redis_pool,
        get_s3_client,
    },
};
use sqlx::PgPool;
use std::sync::Arc;

/// Initializes and returns the shared queue state for tests.
///
/// * `db_pool` - The Postgres connection pool.
/// * `s3_client` - An optional S3 client instance.
pub async fn get_queue_state_for_test(
    db_pool: PgPool,
    s3_client: Option<S3Client>,
) -> Arc<SharedQueueState> {
    let shared_aws_config = aws_config::defaults(get_aws_behavior_version())
        .region(get_aws_region())
        .load()
        .await;
    let redis_pool = get_redis_pool();

    Arc::new(SharedQueueState {
        config: get_app_config().unwrap(),
        redis: redis_pool,
        db_pool,
        ses_client: SesClient::new(&shared_aws_config),
        s3_client: s3_client.unwrap_or(get_s3_client().await),
    })
}
