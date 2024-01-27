use crate::{
    test_utils::{
        get_redis_pool,
        TestContext,
    },
    RedisPool,
};

/// The test context with Redis connection pool. Flushes the entire Redis database on teardown.
pub struct RedisTestContext {
    pub redis_pool: RedisPool,
}

#[async_trait::async_trait]
impl TestContext for RedisTestContext {
    async fn setup() -> RedisTestContext {
        RedisTestContext {
            redis_pool: get_redis_pool(),
        }
    }

    async fn teardown(self) {
        let redis_pool = &self.redis_pool;
        let mut conn = redis_pool.get().await.unwrap();
        let _: String = redis::cmd("FLUSHDB")
            .query_async(&mut conn)
            .await
            .expect("failed to FLUSHDB");
    }
}
