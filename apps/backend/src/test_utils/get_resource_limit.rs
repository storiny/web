use crate::{
    constants::{
        redis_namespaces::RedisNamespace,
        resource_limit::ResourceLimit,
    },
    RedisPool,
};
use redis::AsyncCommands;

/// Returns the current resource limit for the provided resource type and user ID (used only for
/// tests). Panics if the resource limit is not present in the cache.
///
/// * `redis_pool` - The Redis connection pool.
/// * `resource_limit` - The resource limit variant.
/// * `user_id` - The user ID value for the resource limit record.
pub async fn get_resource_limit(
    redis_pool: &RedisPool,
    resource_limit: ResourceLimit,
    user_id: i64,
) -> u32 {
    let mut conn = redis_pool.get().await.unwrap();

    conn.get::<_, Option<u32>>(&format!(
        "{}:{}:{user_id}",
        RedisNamespace::ResourceLimit,
        resource_limit as i32
    ))
    .await
    .unwrap()
    .expect("resource limit has not been set")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        test_utils::RedisTestContext,
        utils::incr_resource_limit::incr_resource_limit,
    };
    use storiny_macros::test_context;

    mod serial {
        use super::*;

        #[test_context(RedisTestContext)]
        #[tokio::test]
        async fn can_return_resource_limit(ctx: &mut RedisTestContext) {
            let redis_pool = &ctx.redis_pool;

            // Insert a cache record
            incr_resource_limit(redis_pool, ResourceLimit::CreateStory, 1_i64)
                .await
                .unwrap();

            let result = get_resource_limit(redis_pool, ResourceLimit::CreateStory, 1_i64).await;

            assert_eq!(result, 1);
        }

        #[test_context(RedisTestContext)]
        #[tokio::test]
        #[should_panic]
        #[ignore] // TODO: `#[should_panic]` is not supported by nextest yet. See https://github.com/nextest-rs/nextest/issues/804
        async fn can_panic_when_the_resource_limit_is_missing_from_the_cache(
            ctx: &mut RedisTestContext,
        ) {
            let redis_pool = &ctx.redis_pool;
            get_resource_limit(redis_pool, ResourceLimit::CreateStory, 1_i64).await;
        }
    }
}
