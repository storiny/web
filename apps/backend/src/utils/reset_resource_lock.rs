use crate::{
    RedisPool,
    constants::resource_lock::ResourceLock,
};
use anyhow::anyhow;
use redis::AsyncCommands;

/// Resets the locked resource.
///
/// * `redis_pool` - The Redis connection pool.
/// * `resource_lock` - The resource lock variant.
/// * `identifier` - The resource identifier.
pub async fn reset_resource_lock(
    redis_pool: &RedisPool,
    resource_lock: ResourceLock,
    identifier: &str,
) -> anyhow::Result<()> {
    let mut conn = redis_pool.get().await.map_err(|error| {
        anyhow!("unable to acquire a connection from the Redis pool: {error:?}")
    })?;

    conn.del(format!("{}:{identifier}", resource_lock))
        .await
        .map_err(|error| anyhow!("unable to delete the record from Redis: {error:?}"))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::RedisTestContext;
    use storiny_macros::test_context;

    mod serial {
        use super::*;
        use crate::utils::incr_resource_lock_attempts::incr_resource_lock_attempts;

        #[test_context(RedisTestContext)]
        #[tokio::test]
        async fn should_not_throw_when_trying_to_reset_an_unknown_resource_lock(
            ctx: &mut RedisTestContext,
        ) {
            let redis_pool = &ctx.redis_pool;
            let result = reset_resource_lock(redis_pool, ResourceLock::Signup, "::1").await;

            assert!(result.is_ok());
        }

        #[test_context(RedisTestContext)]
        #[tokio::test]
        async fn can_reset_resource_lock_for_an_existing_key(ctx: &mut RedisTestContext) {
            let redis_pool = &ctx.redis_pool;
            let mut conn = redis_pool.get().await.unwrap();

            let cache_key = format!("{}:{}", ResourceLock::Signup, "::1");

            // Increment the attempts.
            incr_resource_lock_attempts(redis_pool, ResourceLock::Signup, "::1")
                .await
                .unwrap();

            reset_resource_lock(redis_pool, ResourceLock::Signup, "::1")
                .await
                .unwrap();

            // Should remove the key from the cache.
            let result: Option<String> = conn.get(&cache_key).await.unwrap();

            assert!(result.is_none());
        }
    }
}
