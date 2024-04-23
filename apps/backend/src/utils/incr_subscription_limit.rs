use crate::{
    constants::{
        redis_namespaces::RedisNamespace,
        resource_limit::ResourceLimit,
    },
    RedisPool,
};
use anyhow::anyhow;

const HOURS_24_AS_SECONDS: i32 = 86_400;

/// Increments the subscription limit value by `1` if the key exists in the cache, otherwise inserts
/// a new key with the default value.
///
/// * `redis_pool` - The Redis connection pool.
/// * `ip` - The IP address value for the subscription limit record.
pub async fn incr_subscription_limit(redis_pool: &RedisPool, ip: &str) -> anyhow::Result<()> {
    let mut conn = redis_pool.get().await.map_err(|error| {
        anyhow!("unable to acquire a connection from the Redis pool: {error:?}")
    })?;
    let increx = redis::Script::new(include_str!("../../lua/increx.lua"));
    let cache_key = format!(
        "{}:{}:{ip}",
        RedisNamespace::ResourceLimit,
        ResourceLimit::SubscribeUnregistered as i32
    );

    increx
        .key(cache_key)
        .arg(HOURS_24_AS_SECONDS)
        .invoke_async(&mut conn)
        .await
        .map_err(|error| anyhow!("unable to increment the subscription limit: {error:?}"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::RedisTestContext;
    use redis::AsyncCommands;
    use storiny_macros::test_context;

    mod serial {
        use super::*;

        #[test_context(RedisTestContext)]
        #[tokio::test]
        async fn can_increment_subscription_limit_for_a_missing_key(ctx: &mut RedisTestContext) {
            let redis_pool = &ctx.redis_pool;
            let mut conn = redis_pool.get().await.unwrap();

            incr_subscription_limit(redis_pool, "::1").await.unwrap();

            // Key should be present in the cache.
            let cache_key = format!(
                "{}:{}:{}",
                RedisNamespace::ResourceLimit,
                ResourceLimit::SubscribeUnregistered as i32,
                "::1"
            );

            let result: String = conn.get(&cache_key).await.unwrap();

            assert_eq!(result, "1");

            // Should also set an expiry on the key.
            let ttl: i32 = conn.ttl(&cache_key).await.unwrap();

            assert_ne!(ttl, -1);
        }

        #[test_context(RedisTestContext)]
        #[tokio::test]
        async fn can_increment_subscription_limit_for_an_existing_key(ctx: &mut RedisTestContext) {
            let redis_pool = &ctx.redis_pool;
            let mut conn = redis_pool.get().await.unwrap();

            // Increment for the first time.
            incr_subscription_limit(redis_pool, "::1").await.unwrap();

            // Increment again.
            incr_subscription_limit(redis_pool, "::1").await.unwrap();

            // Key should be present in the cache with the correct value.
            let cache_key = format!(
                "{}:{}:{}",
                RedisNamespace::ResourceLimit,
                ResourceLimit::SubscribeUnregistered as i32,
                "::1"
            );

            let result: String = conn.get(&cache_key).await.unwrap();

            assert_eq!(result, "2");

            // Should not reset expiry on the key.
            let ttl: i32 = conn.ttl(&cache_key).await.unwrap();

            assert_ne!(ttl, -1);
        }
    }
}
