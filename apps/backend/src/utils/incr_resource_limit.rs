use crate::constants::{
    redis_namespaces::RedisNamespace,
    resource_limit::ResourceLimit,
};
use deadpool_redis::Pool as RedisPool;
use redis::AsyncCommands;

/// Increments the resource limit value by `1` if the key exists in the cache, otherwise inserts a
/// new key with the default value.
///
/// * `redis_pool` - The Redis connection pool.
/// * `resource_limit` - The resource limit variant.
/// * `user_id` - The user ID value for the resource limit record.
pub async fn incr_resource_limit(
    redis_pool: &RedisPool,
    resource_limit: ResourceLimit,
    user_id: i64,
) -> Result<(), ()> {
    let mut conn = redis_pool.get().await.map_err(|_| ())?;
    let cache_key = format!(
        "{}:{}:{user_id}",
        RedisNamespace::ResourceLimit,
        resource_limit as i32
    );

    match conn.exists(cache_key).await {
        Ok(limit) => {}
        Err(_) => Ok(true),
    };

    match conn
        .incr(
            &format!(
                "{}:{}:{user_id}",
                RedisNamespace::ResourceLimit,
                resource_limit as i32
            ),
            1,
        )
        .await
    {
        Ok(limit) => Ok(limit < resource_limit.get_limit()),
        Err(_) => Ok(true),
    }
}

#[cfg(test)]
mod tests {}
