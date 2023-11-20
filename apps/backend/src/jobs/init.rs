use crate::{
    config,
    config::Config,
    jobs::notify::story_add_by_user::notify_story_add_by_user,
};
use apalis::{
    layers::{
        Extension,
        TraceLayer,
    },
    prelude::*,
    redis::RedisStorage,
};
use deadpool_redis::Pool as RedisPool;
use redis::aio::ConnectionManager;
use rusoto_s3::S3Client;
use sqlx::{
    Pool,
    Postgres,
};
use std::sync::Arc;
use tower::{
    timeout::TimeoutLayer,
    Layer,
};

/// State common to all the jobs
#[derive(Clone)]
pub struct SharedJobState {
    /// Environment configuration
    pub config: config::Config,
    /// Redis connection pool
    pub redis: RedisPool,
    /// Postgres connection pool
    pub db_pool: Pool<Postgres>,
    /// AWS S3 client instance
    pub s3_client: S3Client,
}

/// Starts the background jobs.
///
/// * `connection_manager` - The Redis async connection manager instance.
/// * `redis_pool` - A Redis connection pool.
/// * `db_pool` - A Postgres database connection pool.
/// * `s3_client` - A S3 client instance.
pub async fn start_jobs(
    connection_manager: ConnectionManager,
    redis_pool: RedisPool,
    db_pool: Pool<Postgres>,
    s3_client: S3Client,
) {
    let storage = RedisStorage::new(connection_manager);
    let state = Arc::new(SharedJobState {
        config: envy::from_env::<Config>().unwrap(),
        redis: redis_pool,
        db_pool,
        s3_client,
    });

    tokio::spawn(async move {
        Monitor::new()
            .register_with_count(2, move |x| {
                WorkerBuilder::new(format!("notify-story-add-by-user-worker-{x}"))
                    .layer(TraceLayer::new())
                    .layer(Extension(state.clone()))
                    .layer(TimeoutLayer::new(core::time::Duration::from_secs(5)))
                    .with_storage(storage.clone())
                    .build_fn(notify_story_add_by_user)
            })
            .run()
            .await
    });
}
