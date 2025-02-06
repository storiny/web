use crate::{
    RedisPool,
    async_transaction,
    constants::resource_lock::ResourceLock,
};
use redis::AsyncCommands;
use std::cmp::min;
use thiserror::Error;

/// The error raised while incrementing the resource lock attempts.
#[derive(Debug, Error)]
pub enum IncrResourceLockError {
    /// The error raised during the Redis transaction.
    #[error("redis error: {0}")]
    Redis(
        #[source]
        #[from]
        redis::RedisError,
    ),
    /// The error raised while trying to acquire a connection from the pool.
    #[error("pool error: {0}")]
    Pool(
        #[source]
        #[from]
        deadpool_redis::PoolError,
    ),
}

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
/// * `identifier` - The resource identifier.
#[allow(clippy::unit_arg)]
pub async fn incr_resource_lock_attempts(
    redis_pool: &RedisPool,
    resource_lock: ResourceLock,
    identifier: &str,
) -> Result<(), IncrResourceLockError> {
    let mut conn = redis_pool.get().await?;
    let cache_key = format!("{}:{identifier}", resource_lock);

    Ok(async_transaction!(&mut conn, &[cache_key.clone()], {
        let mut pipe = redis::pipe();
        let current_value: Option<u32> = conn.get(&cache_key).await?;

        pipe.atomic();

        if current_value.is_some_and(|value| value >= resource_lock.get_max_attempts()) {
            // Increase the expiry if the key already exists with the sufficient amount of
            // incorrect attempts. We use the difference of the incorrect attempts and the maximum
            // limit to compute the backoff duration.
            #[allow(clippy::unwrap_used)]
            let attempts = current_value.unwrap() - resource_lock.get_max_attempts();
            let next_expiry = get_next_backoff_duration(attempts);

            pipe.incr(&cache_key, 1)
                .expire(&cache_key, next_expiry as i64)
                .ignore();
        } else {
            // Increment the existing attempts or create a new record. Always reset the expiry to 24
            // hours on every incorrect attempt.
            pipe.incr(&cache_key, 1)
                .expire(&cache_key, HOURS_24_AS_SECONDS as i64)
                .ignore();
        }

        pipe.query_async::<_, Option<()>>(&mut conn).await?
    }))
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
        async fn can_increment_resource_lock_attempts_for_a_missing_key(
            ctx: &mut RedisTestContext,
        ) {
            let redis_pool = &ctx.redis_pool;
            let mut conn = redis_pool.get().await.unwrap();

            incr_resource_lock_attempts(redis_pool, ResourceLock::Signup, "::1")
                .await
                .unwrap();

            // Key should be present in the cache.
            let cache_key = format!("{}:{}", ResourceLock::Signup, "::1");

            let result: String = conn.get(&cache_key).await.unwrap();

            assert_eq!(result, "1");

            // Should also set an expiry on the key.
            let ttl: i32 = conn.ttl(&cache_key).await.unwrap();

            assert_ne!(ttl, -1);
        }

        #[test_context(RedisTestContext)]
        #[tokio::test]
        async fn can_increment_resource_lock_attempts_for_an_existing_key(
            ctx: &mut RedisTestContext,
        ) {
            let redis_pool = &ctx.redis_pool;
            let mut conn = redis_pool.get().await.unwrap();

            let cache_key = format!("{}:{}", ResourceLock::Signup, "::1");

            // Increment for the first time.
            incr_resource_lock_attempts(redis_pool, ResourceLock::Signup, "::1")
                .await
                .unwrap();

            // Change the expiry of the key to 5 minutes.
            conn.expire::<_, ()>(&cache_key, 300).await.unwrap();

            // Increment again.
            incr_resource_lock_attempts(redis_pool, ResourceLock::Signup, "::1")
                .await
                .unwrap();

            // Key should be present in the cache with the correct value.
            let result: String = conn.get(&cache_key).await.unwrap();

            assert_eq!(result, "2");

            // Should reset expiry on the key to 24 hours.
            let ttl: i32 = conn.ttl(&cache_key).await.unwrap();

            assert!(ttl > (HOURS_24_AS_SECONDS - 60));
        }

        #[test_context(RedisTestContext)]
        #[tokio::test]
        async fn can_increment_resource_lock_attempts_on_reaching_the_limit(
            ctx: &mut RedisTestContext,
        ) {
            let redis_pool = &ctx.redis_pool;
            let mut conn = redis_pool.get().await.unwrap();

            let cache_key = format!("{}:{}", ResourceLock::Signup, "::1");

            // Set the maximum attempts for the key.
            conn.set::<_, _, ()>(&cache_key, ResourceLock::Signup.get_max_attempts())
                .await
                .unwrap();

            let result: String = conn.get(&cache_key).await.unwrap();

            assert_eq!(result, ResourceLock::Signup.get_max_attempts().to_string());

            // Try incrementing the lock attempts.
            incr_resource_lock_attempts(redis_pool, ResourceLock::Signup, "::1")
                .await
                .unwrap();

            let result: String = conn.get(&cache_key).await.unwrap();

            // Should increment the attempts.
            assert_eq!(
                result,
                (ResourceLock::Signup.get_max_attempts() + 1).to_string()
            );
        }

        #[test_context(RedisTestContext)]
        #[tokio::test]
        async fn can_set_expiry_after_reaching_the_maximum_attempts_limit(
            ctx: &mut RedisTestContext,
        ) {
            let redis_pool = &ctx.redis_pool;
            let mut conn = redis_pool.get().await.unwrap();

            let cache_key = format!("{}:{}", ResourceLock::Signup, "::1");

            // Set the maximum attempts for the key.
            conn.set::<_, _, ()>(&cache_key, ResourceLock::Signup.get_max_attempts() + 1)
                .await
                .unwrap();

            let result: String = conn.get(&cache_key).await.unwrap();

            assert_eq!(
                result,
                (ResourceLock::Signup.get_max_attempts() + 1).to_string()
            );

            // Increment the lock attempts.
            incr_resource_lock_attempts(redis_pool, ResourceLock::Signup, "::1")
                .await
                .unwrap();

            let result: String = conn.get(&cache_key).await.unwrap();

            // Should increment the attempts.
            assert_eq!(
                result,
                (ResourceLock::Signup.get_max_attempts() + 2).to_string()
            );

            // Should reset expiry using the exponential-backoff pattern.
            let ttl: i32 = conn.ttl(&cache_key).await.unwrap();
            let expiry = get_next_backoff_duration(1);

            // We relax 30 seconds for tests.
            assert!(ttl > expiry - 30 && ttl < expiry + 30);
        }
    }
}
