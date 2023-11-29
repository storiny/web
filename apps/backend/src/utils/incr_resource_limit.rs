use crate::{
    constants::{
        redis_namespaces::RedisNamespace,
        resource_limit::ResourceLimit,
    },
    RedisPool,
};

const HOURS_24_AS_SECONDS: i32 = 86400;

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
    let increx = redis::Script::new(include_str!("../../lua/increx.lua"));
    let cache_key = format!(
        "{}:{}:{user_id}",
        RedisNamespace::ResourceLimit.to_string(),
        resource_limit as i32
    );

    increx
        .key(cache_key)
        .arg(HOURS_24_AS_SECONDS)
        .invoke_async(&mut conn)
        .await
        .map_err(|_| ())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::RedisTestContext;
    use redis::AsyncCommands;
    use serial_test::serial;
    use storiny_macros::test_context;

    #[test_context(RedisTestContext)]
    #[tokio::test]
    #[serial(redis)]
    async fn can_increment_resource_limit_for_a_missing_key(ctx: &mut RedisTestContext) {
        let redis_pool = &ctx.redis_pool;
        let mut conn = redis_pool.get().await.unwrap();

        incr_resource_limit(redis_pool, ResourceLimit::CreateStory, 1_i64)
            .await
            .unwrap();

        // Key should be present in the cache
        let cache_key = format!(
            "{}:{}:{}",
            RedisNamespace::ResourceLimit.to_string(),
            ResourceLimit::CreateStory as i32,
            1
        );

        let result: String = conn.get(&cache_key).await.unwrap();

        assert_eq!(result, "1");

        // Should also set an expiry on the key
        let ttl: i32 = conn.ttl(&cache_key).await.unwrap();

        assert_ne!(ttl, -1);
    }

    #[test_context(RedisTestContext)]
    #[tokio::test]
    #[serial(redis)]
    async fn can_increment_resource_limit_for_an_existing_key(ctx: &mut RedisTestContext) {
        let redis_pool = &ctx.redis_pool;
        let mut conn = redis_pool.get().await.unwrap();

        // Increment for the first time
        incr_resource_limit(redis_pool, ResourceLimit::CreateStory, 1_i64)
            .await
            .unwrap();

        // Increment again
        incr_resource_limit(redis_pool, ResourceLimit::CreateStory, 1_i64)
            .await
            .unwrap();

        // Key should be present in the cache with the correct value
        let cache_key = format!(
            "{}:{}:{}",
            RedisNamespace::ResourceLimit.to_string(),
            ResourceLimit::CreateStory as i32,
            1
        );

        let result: String = conn.get(&cache_key).await.unwrap();

        assert_eq!(result, "2");

        // Should not reset expiry on the key
        let ttl: i32 = conn.ttl(&cache_key).await.unwrap();

        assert_ne!(ttl, -1);
    }
}
