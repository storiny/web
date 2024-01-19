use crate::{
    constants::resource_lock::ResourceLock,
    RedisPool,
};
use redis::AsyncCommands;

/// Returns the current attempts for a locked resource.
///
/// * `redis_pool` - The Redis connection pool.
/// * `resource_lock` - The resource lock variant.
/// * `identifier` - The resource identifier.
pub async fn get_resource_lock_attempts(
    redis_pool: &RedisPool,
    resource_lock: ResourceLock,
    identifier: &str,
) -> Option<u32> {
    let mut conn = redis_pool.get().await.unwrap();

    conn.get::<_, Option<u32>>(&format!("{}:{identifier}", resource_lock))
        .await
        .unwrap()
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
        async fn can_return_resource_lock_attempts(ctx: &mut RedisTestContext) {
            let redis_pool = &ctx.redis_pool;

            // Insert a cache record
            incr_resource_lock_attempts(redis_pool, ResourceLock::Signup, "::1")
                .await
                .unwrap();

            let result = get_resource_lock_attempts(redis_pool, ResourceLock::Signup, "::1").await;

            assert_eq!(result.unwrap(), 1);
        }

        #[test_context(RedisTestContext)]
        #[tokio::test]
        async fn can_panic_when_the_locked_resource_is_missing_from_the_cache(
            ctx: &mut RedisTestContext,
        ) {
            let redis_pool = &ctx.redis_pool;
            let result = get_resource_lock_attempts(redis_pool, ResourceLock::Signup, "::1").await;

            assert!(result.is_none());
        }
    }
}
