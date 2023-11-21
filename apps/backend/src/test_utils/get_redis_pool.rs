use crate::config::Config;

/// Initializes and returns a Redis connection pool for tests
pub async fn get_redis_pool() -> deadpool_redis::Pool {
    let config = envy::from_env::<Config>().expect("Unable to load environment configuration");
    deadpool_redis::Config::from_url(format!(
        "redis://{}:{}",
        &config.redis_host, &config.redis_port
    ))
    .create_pool(Some(deadpool_redis::Runtime::Tokio1))
    .unwrap()
}
