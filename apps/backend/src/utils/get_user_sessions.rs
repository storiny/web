use crate::{
    constants::redis_namespaces::RedisNamespace,
    utils::{
        get_client_device::ClientDevice,
        get_client_location::ClientLocation,
    },
};
use deadpool_redis::Pool as RedisPool;
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
}

/// Returns all the active sessions for a user using its ID.
///
/// * `redis_pool` - The Redis connection pool.
/// * `user_id` - The target user ID.
pub async fn get_user_sessions(
    redis_pool: &RedisPool,
    user_id: i64,
) -> Result<Vec<(String, UserSession)>, ()> {
    let mut conn = redis_pool.get().await.map_err(|_| ())?;
    let iter: AsyncIter<String> = conn
        .scan_match(format!(
            "{}:{user_id}:*",
            RedisNamespace::Session.to_string()
        ))
        .await
        .map_err(|_| ())?;

    let keys: Vec<String> = iter.collect().await;

    if keys.len() == 0 {
        return Ok(vec![]);
    }

    let values: Vec<Option<String>> = conn.mget(&keys).await.map_err(|_| ())?;

    // Build and return key-value pairs
    Ok(keys
        .iter()
        .enumerate()
        .map(|(index, &ref key)| {
            (
                key.to_string(),
                if let Some(value) = values.get(index) {
                    serde_json::from_str::<UserSession>(value.clone().unwrap_or_default().as_str())
                        .ok()
                } else {
                    None
                },
            )
        })
        .filter_map(|(key, value)| {
            if value.is_some() {
                Some((key, value.unwrap()))
            } else {
                None
            }
        })
        .collect::<Vec<_>>())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::RedisTestContext;
    use serial_test::serial;
    use storiny_macros::test_context;
    use time::OffsetDateTime;
    use uuid::Uuid;

    #[test_context(RedisTestContext)]
    #[tokio::test]
    #[serial(redis)]
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
                    &format!(
                        "{}:{user_id}:{}",
                        RedisNamespace::Session.to_string(),
                        Uuid::new_v4()
                    ),
                    &serde_json::to_string(&UserSession {
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
