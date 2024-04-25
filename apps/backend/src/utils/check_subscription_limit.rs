use crate::{
    constants::{
        redis_namespaces::RedisNamespace,
        resource_limit::ResourceLimit,
    },
    RedisPool,
};
use anyhow::anyhow;
use redis::AsyncCommands;

/// Determines whether a client can subscribe to blog newsletters by checking the daily limit
/// for the given IP address. Returns `true` if the client can subscribe, `false` otherwise.
///
/// * `redis_pool` - The Redis connection pool.
/// * `ip` - The IP address value for the subscription limit record.
pub async fn check_subscription_limit(redis_pool: &RedisPool, ip: &str) -> anyhow::Result<bool> {
    let mut conn = redis_pool.get().await.map_err(|error| {
        anyhow!("unable to acquire a connection from the Redis pool: {error:?}")
    })?;

    let limit = conn
        .get::<_, Option<u32>>(&format!(
            "{}:{}:{ip}",
            RedisNamespace::ResourceLimit,
            ResourceLimit::SubscribeUnregistered as i32,
        ))
        .await
        .map_err(|error| anyhow!("unable to fetch the subscription limit from Redis: {error:?}"))?;

    // Result might be `None` if the key is not present in the cache.
    Ok(limit.is_none()
        || limit.is_some_and(|value| value < ResourceLimit::SubscribeUnregistered.get_limit()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        test_utils::RedisTestContext,
        utils::incr_subscription_limit::incr_subscription_limit,
    };
    use futures::future;
    use storiny_macros::test_context;

    mod serial {
        use super::*;

        #[test_context(RedisTestContext)]
        #[tokio::test]
        async fn can_check_subscription_limit_for_a_missing_key(ctx: &mut RedisTestContext) {
            let redis_pool = &ctx.redis_pool;
            let result = check_subscription_limit(redis_pool, "::1").await.unwrap();

            assert!(result);
        }

        #[test_context(RedisTestContext)]
        #[tokio::test]
        async fn can_check_subscription_limit_for_an_existing_key(ctx: &mut RedisTestContext) {
            let redis_pool = &ctx.redis_pool;

            // Increment the subscription limit
            incr_subscription_limit(redis_pool, "::1").await.unwrap();

            let result = check_subscription_limit(redis_pool, "::1").await.unwrap();

            assert!(result);
        }

        #[test_context(RedisTestContext)]
        #[tokio::test]
        async fn can_return_false_when_exceeding_a_subscription_limit(ctx: &mut RedisTestContext) {
            let redis_pool = &ctx.redis_pool;
            let mut incr_futures = vec![];

            // Exceed the subscription limit. Do not use
            // [crate::test_utils::exceed_subscription_limit] as it depends on
            // [check_subscription_limit].
            for _ in 0..ResourceLimit::SubscribeUnregistered.get_limit() + 1 {
                incr_futures.push(incr_subscription_limit(redis_pool, "::1"));
            }

            future::join_all(incr_futures).await;

            let result = check_subscription_limit(redis_pool, "::1").await.unwrap();

            assert!(!result);
        }
    }
}
