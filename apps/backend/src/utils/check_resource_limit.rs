use crate::constants::{
    redis_namespaces::RedisNamespace,
    resource_limit::ResourceLimit,
};
use deadpool_redis::Pool as RedisPool;
use redis::AsyncCommands;

/// Determines whether a resource operation can be performed by checking the daily resource limit
/// for the given resource type and user ID. Returns `true` if the resource operation can be
/// performed, `false` otherwise.
///
/// * `redis_pool` - The Redis connection pool.
/// * `resource_limit` - The resource limit variant.
/// * `user_id` - The user ID value for the resource limit record.
pub async fn check_resource_limit(
    redis_pool: &RedisPool,
    resource_limit: ResourceLimit,
    user_id: i64,
) -> Result<bool, ()> {
    let mut conn = redis_pool.get().await.map_err(|_| ())?;

    match conn
        .get::<_, u32>(&format!(
            "{}:{}:{user_id}",
            RedisNamespace::ResourceLimit,
            resource_limit as i32
        ))
        .await
    {
        Ok(limit) => Ok(limit < resource_limit.get_limit()),
        Err(_) => Ok(true),
    }
}

#[cfg(test)]
mod tests {}
