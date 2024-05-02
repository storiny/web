use crate::{
    constants::redis_namespaces::RedisNamespace,
    utils::{
        get_client_device::ClientDevice,
        get_client_location::ClientLocation,
    },
    RedisPool,
};
use anyhow::anyhow;
use futures::stream::StreamExt;
use redis::{
    AsyncCommands,
    AsyncIter,
};
use serde::{
    Deserialize,
    Serialize,
};

#[derive(Debug, Default, Deserialize, Serialize)]
pub struct UserSession {
    pub user_id: i64,
    pub created_at: i64,
    pub device: Option<ClientDevice>,
    pub location: Option<ClientLocation>,
    pub ack: bool,
    pub domain: Option<String>,
}

/// Returns all the active sessions for a user using its ID.
///
/// * `redis_pool` - The Redis connection pool.
/// * `user_id` - The target user ID.
pub async fn get_user_sessions(
    redis_pool: &RedisPool,
    user_id: i64,
) -> anyhow::Result<Vec<(String, UserSession)>> {
    let mut conn = redis_pool.get().await.map_err(|error| {
        anyhow!("unable to acquire a connection from the Redis pool: {error:?}")
    })?;

    let iter: AsyncIter<String> = conn
        .scan_match(format!("{}:{user_id}:*", RedisNamespace::Session))
        .await
        .map_err(|error| anyhow!("unable to scan for session keys: {error:?}"))?;

    let keys: Vec<String> = iter.collect().await;

    if keys.is_empty() {
        return Ok(vec![]);
    }

    let values: Vec<Option<Vec<u8>>> = conn
        .mget(&keys)
        .await
        .map_err(|error| anyhow!("unable to fetch value for the session keys: {error:?}"))?;

    // Build and return key-value pairs.
    Ok(keys
        .iter()
        .enumerate()
        .filter_map(|(index, key)| {
            Some((
                key.to_string(),
                values
                    .get(index)?
                    .as_ref()
                    .map(|value| rmp_serde::from_slice::<UserSession>(value).ok())??,
            ))
        })
        .collect::<Vec<_>>())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::RedisTestContext;
    use storiny_macros::test_context;
    use time::OffsetDateTime;
    use uuid::Uuid;

    mod serial {
        use super::*;

        #[test_context(RedisTestContext)]
        #[tokio::test]
        async fn can_return_user_sessions(ctx: &mut RedisTestContext) {
            let redis_pool = &ctx.redis_pool;
            let mut redis_conn = redis_pool.get().await.unwrap();
            let user_id = 1_i64;

            // Should have zero sessions
            let sessions = get_user_sessions(redis_pool, user_id).await.unwrap();
            assert!(sessions.is_empty());

            // Create some sessions
            for _ in 0..5 {
                redis_conn
                    .set::<_, _, ()>(
                        &format!("{}:{user_id}:{}", RedisNamespace::Session, Uuid::new_v4()),
                        &rmp_serde::to_vec_named(&UserSession {
                            user_id,
                            created_at: OffsetDateTime::now_utc().unix_timestamp(),
                            ack: false,
                            device: Some(ClientDevice {
                                display_name: "Some device".to_string(),
                                r#type: 0,
                            }),
                            location: Some(ClientLocation {
                                display_name: "Some location".to_string(),
                                lat: Some(0.0),
                                lng: Some(0.0),
                            }),
                            domain: Some("example.com".to_string()),
                        })
                        .unwrap(),
                    )
                    .await
                    .unwrap();
            }

            let sessions = get_user_sessions(redis_pool, user_id).await.unwrap();
            assert_eq!(sessions.len(), 5);
        }
    }
}
