use crate::{
    constants::{
        redis_namespaces::RedisNamespace,
        resource_limit::ResourceLimit,
    },
    RedisPool,
};
use anyhow::anyhow;
use redis::AsyncCommands;

/// Determines whether a resource operation can be performed by checking the daily resource limit
/// for the given resource type and user ID. Returns `true` if the resource operation can be
/// performed, `false` otherwise.
///
/// * `redis_pool` - The Redis connection pool.
/// * `resource_limit` - The resource limit variant.
/// * `resource_id` - The resource ID value for the resource limit record.
pub async fn check_resource_limit(
    redis_pool: &RedisPool,
    resource_limit: ResourceLimit,
    resource_id: i64,
) -> anyhow::Result<bool> {
    let mut conn = redis_pool.get().await.map_err(|error| {
        anyhow!("unable to acquire a connection from the Redis pool: {error:?}")
    })?;

    let limit = conn
        .get::<_, Option<u32>>(&format!(
            "{}:{}:{resource_id}",
            RedisNamespace::ResourceLimit,
            resource_limit as i32
        ))
        .await
        .map_err(|error| anyhow!("unable to fetch the resource limit from Redis: {error:?}"))?;

    // Result might be `None` if the key is not present in the cache.
    Ok(limit.is_none() || limit.is_some_and(|value| value < resource_limit.get_limit()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        test_utils::RedisTestContext,
        utils::incr_resource_limit::incr_resource_limit,
    };
    use futures::future;
    use storiny_macros::test_context;

    mod serial {
        use super::*;

        #[test_context(RedisTestContext)]
        #[tokio::test]
        async fn can_check_resource_limit_for_a_missing_key(ctx: &mut RedisTestContext) {
            let redis_pool = &ctx.redis_pool;

            let result = check_resource_limit(redis_pool, ResourceLimit::CreateStory, 1_i64)
                .await
                .unwrap();

            assert!(result);
        }

        #[test_context(RedisTestContext)]
        #[tokio::test]
        async fn can_check_resource_limit_for_an_existing_key(ctx: &mut RedisTestContext) {
            let redis_pool = &ctx.redis_pool;

            // Increment the resource limit
            incr_resource_limit(redis_pool, ResourceLimit::CreateStory, 1_i64)
                .await
                .unwrap();

            let result = check_resource_limit(redis_pool, ResourceLimit::CreateStory, 1_i64)
                .await
                .unwrap();

            assert!(result);
        }

        #[test_context(RedisTestContext)]
        #[tokio::test]
        async fn can_return_false_when_exceeding_a_resource_limit(ctx: &mut RedisTestContext) {
            let redis_pool = &ctx.redis_pool;
            let mut incr_futures = vec![];

            // Exceed the resource limit. Do not use [crate::test_utils::exceed_resource_limit] as
            // it depends on [check_resource_limit].
            for _ in 0..ResourceLimit::CreateStory.get_limit() + 1 {
                incr_futures.push(incr_resource_limit(
                    redis_pool,
                    ResourceLimit::CreateStory,
                    1_i64,
                ));
            }

            future::join_all(incr_futures).await;

            let result = check_resource_limit(redis_pool, ResourceLimit::CreateStory, 1_i64)
                .await
                .unwrap();

            assert!(!result);
        }
    }
}
