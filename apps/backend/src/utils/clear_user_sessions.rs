use crate::{
    utils::get_user_sessions::get_user_sessions,
    RedisPool,
};
use anyhow::anyhow;

/// Clears all the active sessions for a user using its ID.
///
/// * `redis_pool` - The Redis connection pool.
/// * `user_id` - The target user ID.
pub async fn clear_user_sessions(redis_pool: &RedisPool, user_id: i64) -> anyhow::Result<()> {
    let mut conn = redis_pool.get().await.map_err(|error| {
        anyhow!("unable to acquire a connection from the Redis pool: {error:?}")
    })?;

    let session_keys = get_user_sessions(redis_pool, user_id)
        .await?
        .iter()
        .map(|(key, _)| key.to_string())
        .collect::<Vec<_>>();

    let mut pipe = redis::pipe();
    pipe.atomic();

    for key in session_keys {
        pipe.del(key).ignore();
    }

    pipe.query_async::<_, ()>(&mut *conn)
        .await
        .map_err(|error| anyhow!("unable to clear the sessions: {error:?}"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        constants::redis_namespaces::RedisNamespace,
        test_utils::RedisTestContext,
        utils::get_user_sessions::UserSession,
    };
    use redis::AsyncCommands;
    use storiny_macros::test_context;
    use uuid::Uuid;

    mod serial {
        use super::*;

        #[test_context(RedisTestContext)]
        #[tokio::test]
        async fn can_clear_user_sessions(ctx: &mut RedisTestContext) {
            let redis_pool = &ctx.redis_pool;
            let mut redis_conn = redis_pool.get().await.unwrap();
            let user_id = 1_i64;

            // Create some sessions
            for _ in 0..5 {
                redis_conn
                    .set::<_, _, ()>(
                        &format!(
                            "{}:{user_id}:{}",
                            RedisNamespace::Session,
                            Uuid::new_v4()
                        ),
                        &rmp_serde::to_vec_named(&UserSession {
                            user_id,
                            ..Default::default()
                        })
                        .unwrap(),
                    )
                    .await
                    .unwrap();
            }

            // Cache should have all the created sessions initially
            let sessions = get_user_sessions(redis_pool, user_id).await.unwrap();
            assert_eq!(sessions.len(), 5);

            clear_user_sessions(redis_pool, user_id).await.unwrap();

            // Cache should not have any sessions
            let sessions = get_user_sessions(redis_pool, user_id).await.unwrap();
            assert!(sessions.is_empty());
        }
    }
}
