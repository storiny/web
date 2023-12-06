use crate::{
    constants::{
        redis_namespaces::RedisNamespace,
        resource_limit::ResourceLimit,
        resource_lock::ResourceLock,
    },
    middlewares::rate_limiter::async_transaction,
    RedisPool,
};
use anyhow::anyhow;
use redis::AsyncCommands;
use std::cmp::min;

/// The maximum amount of duration (in seconds) for a locked resource before it is unlocked.
const MAXIMUM_RESOURCE_LOCK_BACKOFF_DURATION: i32 = 86_400; // 24 hours

/// The backoff factor duration (in seconds). We do not use a random backoff factor here, as opposed
/// to the [original implementation].
///
/// [original implementation]: https://en.wikipedia.org/wiki/Exponential_backoff
const BACKOFF_FACTOR: i32 = 300; // 5 minutes

const HOURS_24_AS_SECONDS: i32 = 86_400;

/// Computes the next expiry duration for the key based on exponential-backoff fashion using the
/// provided attempts.
///
/// * `attempts` - The current amount of incorrect attempts.
fn get_next_backoff_duration(attempts: u32) -> i32 {
    min(
        i32::pow(2, attempts) * BACKOFF_FACTOR,
        MAXIMUM_RESOURCE_LOCK_BACKOFF_DURATION,
    )
}

/// Increments the attempts for a resource lock by `1` if the key exists in the cache, otherwise
/// inserts a new key with default value.
///
/// If the number of attempts reach the maximum limit (defined in [ResourceLock::get_max_attempts]),
/// the expiry of the key is extended in an exponential-backoff fashion based on the number of
/// incorrect attempts.
///
/// * `redis_pool` - The Redis connection pool.
/// * `resource_lock` - The resource lock variant.
/// * `identifier` - The resource identifier. This can the ID of the user or the client IP address.
pub async fn incr_resource_lock_attempts(
    redis_pool: &RedisPool,
    resource_lock: ResourceLock,
    identifier: &str,
) -> anyhow::Result<()> {
    let mut conn = redis_pool.get().await.map_err(|error| {
        anyhow!("unable to acquire a connection from the Redis pool: {error:?}")
    })?;
    let increx = redis::Script::new(include_str!("../../lua/increx.lua"));
    let cache_key = format!("{}:{identifier}", resource_lock.to_string());

    let current_attempts = conn
        .get::<_, Option<u32>>(&format!("{}:{identifier}", resource_lock.to_string()))
        .await
        .map_err(|error| anyhow!("unable to fetch the lock attempts from Redis: {error:?}"))?;

    let a = async_transaction!(&mut conn, &[cache_key.clone()], {
        let pipe = redis::pipe().atomic();
        let current_value: Option<u32> = conn.get(&cache_key)?;

        if current_value.is_some_and(|value| value >= resource_lock.get_max_attempts()) {
            // Increase the expiry if the key already exists with the sufficient amount of
            // incorrect attempts. We do not increment the attempts any further if they
            // reach the limit.
            let next_expiry = get_next_backoff_duration(value);
            pipe.expire(&cache_key, next_expiry as usize).ignore();
        } else {
            // Increment the existing attempts or create a new record.
            increx
                .key(&cache_key)
                // Keep the new attempts for 1 day.
                .arg(HOURS_24_AS_SECONDS)
                .invoke_async(&mut conn)?;
            pipe.add_command();
        }

        pipe.query_async(&mut conn).await?
    });

    Ok(())
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
}
