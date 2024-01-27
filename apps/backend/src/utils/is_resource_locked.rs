use crate::{
    constants::resource_lock::ResourceLock,
    RedisPool,
};
use anyhow::anyhow;
use redis::AsyncCommands;

/// Determines whether an operation can be performed by checking its lock status. This accounts for
/// the exponential-backoff based locks on operations that are vulnerable to attacks such as the
/// login operation or the password verification operation.
///
/// * `redis_pool` - The Redis connection pool.
/// * `resource_lock` - The resource lock variant.
/// * `identifier` - The resource identifier.
pub async fn is_resource_locked(
    redis_pool: &RedisPool,
    resource_lock: ResourceLock,
    identifier: &str,
) -> anyhow::Result<bool> {
    let mut conn = redis_pool.get().await.map_err(|error| {
        anyhow!("unable to acquire a connection from the Redis pool: {error:?}")
    })?;

    let current_attempts = conn
        .get::<_, Option<u32>>(&format!("{}:{identifier}", resource_lock))
        .await
        .map_err(|error| anyhow!("unable to fetch the lock attempts from Redis: {error:?}"))?;

    // Result might be `None` if the key is not present in the cache.
    Ok(current_attempts.is_some_and(|attempts| attempts >= resource_lock.get_max_attempts()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::RedisTestContext;
    use futures::future;
    use storiny_macros::test_context;

    mod serial {
        use super::*;
        use crate::utils::incr_resource_lock_attempts::incr_resource_lock_attempts;

        #[test_context(RedisTestContext)]
        #[tokio::test]
        async fn can_check_resource_lock_status_for_a_missing_key(ctx: &mut RedisTestContext) {
            let redis_pool = &ctx.redis_pool;
            let result = is_resource_locked(redis_pool, ResourceLock::Signup, "::1")
                .await
                .unwrap();

            assert!(!result);
        }

        #[test_context(RedisTestContext)]
        #[tokio::test]
        async fn can_check_resource_lock_status_for_an_existing_key(ctx: &mut RedisTestContext) {
            let redis_pool = &ctx.redis_pool;

            // Increment the attempts.
            incr_resource_lock_attempts(redis_pool, ResourceLock::Signup, "::1")
                .await
                .unwrap();

            let result = is_resource_locked(redis_pool, ResourceLock::Signup, "::1")
                .await
                .unwrap();

            assert!(!result);
        }

        #[test_context(RedisTestContext)]
        #[tokio::test]
        async fn can_return_true_for_a_locked_resource(ctx: &mut RedisTestContext) {
            let redis_pool = &ctx.redis_pool;
            let mut incr_futures = vec![];

            // Exceed the attempts.
            for _ in 0..ResourceLock::Signup.get_max_attempts() + 1 {
                incr_futures.push(incr_resource_lock_attempts(
                    redis_pool,
                    ResourceLock::Signup,
                    "::1",
                ));
            }

            future::join_all(incr_futures).await;

            let result = is_resource_locked(redis_pool, ResourceLock::Signup, "::1")
                .await
                .unwrap();

            assert!(result);
        }
    }
}
