use crate::{
    constants::{
        redis_namespaces::RedisNamespace,
        resource_limit::ResourceLimit,
    },
    RedisPool,
};
use anyhow::anyhow;
use redis::AsyncCommands;

/// Determines whether a report can be created by checking the daily report limit for the given IP
/// address. Returns `true` if the report can be created, `false` otherwise.
///
/// * `redis_pool` - The Redis connection pool.
/// * `ip` - The IP address value for the report limit record.
pub async fn check_report_limit(redis_pool: &RedisPool, ip: &str) -> anyhow::Result<bool> {
    let mut conn = redis_pool.get().await.map_err(|error| {
        anyhow!("unable to acquire a connection from the Redis pool: {error:?}")
    })?;

    let limit = conn
        .get::<_, Option<u32>>(&format!(
            "{}:{}:{ip}",
            RedisNamespace::ResourceLimit,
            ResourceLimit::CreateReport as i32,
        ))
        .await
        .map_err(|error| anyhow!("unable to fetch the report limit from Redis: {error:?}"))?;

    // Result might be `None` if the key is not present in the cache.
    Ok(limit.is_none()
        || limit.is_some_and(|value| value < ResourceLimit::CreateReport.get_limit()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        test_utils::RedisTestContext,
        utils::incr_report_limit::incr_report_limit,
    };
    use futures::future;
    use storiny_macros::test_context;

    mod serial {
        use super::*;

        #[test_context(RedisTestContext)]
        #[tokio::test]
        async fn can_check_report_limit_for_a_missing_key(ctx: &mut RedisTestContext) {
            let redis_pool = &ctx.redis_pool;
            let result = check_report_limit(redis_pool, "::1").await.unwrap();

            assert!(result);
        }

        #[test_context(RedisTestContext)]
        #[tokio::test]
        async fn can_check_report_limit_for_an_existing_key(ctx: &mut RedisTestContext) {
            let redis_pool = &ctx.redis_pool;

            // Increment the report limit
            incr_report_limit(redis_pool, "::1").await.unwrap();

            let result = check_report_limit(redis_pool, "::1").await.unwrap();

            assert!(result);
        }

        #[test_context(RedisTestContext)]
        #[tokio::test]
        async fn can_return_false_when_exceeding_a_report_limit(ctx: &mut RedisTestContext) {
            let redis_pool = &ctx.redis_pool;
            let mut incr_futures = vec![];

            // Exceed the report limit. Do not use [crate::test_utils::exceed_report_limit] as
            // it depends on [check_report_limit].
            for _ in 0..ResourceLimit::CreateReport.get_limit() + 1 {
                incr_futures.push(incr_report_limit(redis_pool, "::1"));
            }

            future::join_all(incr_futures).await;

            let result = check_report_limit(redis_pool, "::1").await.unwrap();

            assert!(!result);
        }
    }
}
