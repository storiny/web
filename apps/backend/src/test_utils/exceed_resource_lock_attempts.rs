use crate::{
    constants::resource_lock::ResourceLock,
    utils::incr_resource_lock_attempts::incr_resource_lock_attempts,
    RedisPool,
};
use futures::future;

/// Exceeds the attempts for a locked resource.
///
/// * `redis_pool` - The Redis connection pool.
/// * `resource_lock` - The resource lock variant.
/// * `identifier` - The resource identifier.
pub async fn exceed_resource_lock_attempts(
    redis_pool: &RedisPool,
    resource_lock: ResourceLock,
    identifier: &str,
) {
    let mut incr_futures = vec![];

    for _ in 0..resource_lock.get_max_attempts() {
        incr_futures.push(incr_resource_lock_attempts(
            redis_pool,
            resource_lock,
            identifier,
        ));
    }

    future::join_all(incr_futures).await;
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        test_utils::RedisTestContext,
        utils::is_resource_locked::is_resource_locked,
    };
    use storiny_macros::test_context;

    mod serial {
        use super::*;

        #[test_context(RedisTestContext)]
        #[tokio::test]
        async fn can_exceed_resource_lock_attempts(ctx: &mut RedisTestContext) {
            let redis_pool = &ctx.redis_pool;
            exceed_resource_lock_attempts(redis_pool, ResourceLock::Signup, "::1").await;

            let result = is_resource_locked(redis_pool, ResourceLock::Signup, "::1")
                .await
                .unwrap();

            assert!(result);
        }
    }
}
