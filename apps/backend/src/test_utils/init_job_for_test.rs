use crate::{
    config::Config,
    jobs::{
        init::start_jobs,
        notify::story_add_by_user::NotifyStoryAddByUserJob,
    },
};
use apalis::redis::RedisStorage as RedisJobStorage;
use redis::aio::ConnectionManager;
use rusoto_mock::{
    MockCredentialsProvider,
    MockRequestDispatcher,
};
use rusoto_s3::S3Client;
use rusoto_signature::Region;
use sqlx::PgPool;

/// Initializes the background jobs for tests
///
/// * `db_pool` - Postgres pool
pub async fn init_job_for_test(db_pool: PgPool) -> RedisJobStorage<NotifyStoryAddByUserJob> {
    let config = envy::from_env::<Config>().expect("Unable to load environment configuration");
    let redis_connection_string = format!("redis://{}:{}", config.redis_host, config.redis_port);

    // Redis pool
    let redis_pool = deadpool_redis::Config::from_url(format!(
        "redis://{}:{}",
        &config.redis_host, &config.redis_port
    ))
    .create_pool(Some(deadpool_redis::Runtime::Tokio1))
    .unwrap();

    // Create connection manager
    let redis_client =
        redis::Client::open(redis_connection_string.clone()).expect("Cannot build Redis client");
    let redis_connection_manager = ConnectionManager::new(redis_client)
        .await
        .expect("Cannot build Redis connection manager");

    start_jobs(
        redis_connection_manager.clone(),
        redis_pool.clone(),
        db_pool.clone(),
        S3Client::new_with(
            MockRequestDispatcher::default(),
            MockCredentialsProvider,
            Region::UsEast1,
        ),
    )
    .await;

    RedisJobStorage::<NotifyStoryAddByUserJob>::new(redis_connection_manager)
}
