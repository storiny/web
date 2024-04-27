use crate::{
    config::get_app_config,
    RedisPool,
};

/// Initializes and returns a Redis connection pool for tests
pub fn get_redis_pool() -> RedisPool {
    let config = get_app_config().unwrap();
    deadpool_redis::Config::from_url(format!(
        "redis://{}:{}",
        &config.redis_host, &config.redis_port
    ))
    .create_pool(Some(deadpool_redis::Runtime::Tokio1))
    .unwrap()
}
