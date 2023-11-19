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

#[derive(Debug, Deserialize, Serialize)]
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
    use crate::{
        test_utils::{
            init_app_for_test,
            res_to_string,
        },
        utils::clear_user_sessions::clear_user_sessions,
        AppState,
    };
    use actix_web::{
        delete,
        get,
        post,
        services,
        test,
        web,
        HttpResponse,
        Responder,
    };
    use sqlx::PgPool;
    use time::OffsetDateTime;
    use uuid::Uuid;

    #[derive(Deserialize)]
    struct Fragments {
        user_id: String,
    }

    // Route to create sessions for the user.
    #[post("/create_session/{user_id}")]
    async fn create_session(
        path: web::Path<Fragments>,
        data: web::Data<AppState>,
    ) -> impl Responder {
        let redis_pool = &data.redis;
        let user_id = (&path.user_id).parse::<i64>().unwrap();
        let mut conn = redis_pool.get().await.unwrap();

        let _: () = conn
            .set(
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

        HttpResponse::Ok().finish()
    }

    // Route to return sessions for the user.
    #[get("/get_sessions/{user_id}")]
    async fn get_sessions(path: web::Path<Fragments>, data: web::Data<AppState>) -> impl Responder {
        let redis_pool = &data.redis;
        let user_id = (&path.user_id).parse::<i64>().unwrap();
        let sessions = get_user_sessions(redis_pool, user_id).await.unwrap();
        HttpResponse::Ok().json(sessions)
    }

    // Route to remove sessions for the user.
    #[delete("/remove_sessions/{user_id}")]
    async fn remove_sessions(
        path: web::Path<Fragments>,
        data: web::Data<AppState>,
    ) -> impl Responder {
        let redis_pool = &data.redis;
        let user_id = (&path.user_id).parse::<i64>().unwrap();
        clear_user_sessions(redis_pool, user_id).await.unwrap();
        HttpResponse::Ok().finish()
    }

    #[sqlx::test]
    async fn can_return_user_sessions(pool: PgPool) -> sqlx::Result<()> {
        let (app, _, user_id) = init_app_for_test(
            services![create_session, get_sessions, remove_sessions],
            pool,
            true,
            false,
            None,
        )
        .await;

        // Remove all the previous sessions
        let req = test::TestRequest::delete()
            .uri(&format!("/remove_sessions/{}", user_id.unwrap()))
            .to_request();
        test::call_service(&app, req).await;

        // Create a session
        let req = test::TestRequest::post()
            .uri(&format!("/create_session/{}", user_id.unwrap()))
            .to_request();
        test::call_service(&app, req).await;

        // Create another session
        let req = test::TestRequest::post()
            .uri(&format!("/create_session/{}", user_id.unwrap()))
            .to_request();
        test::call_service(&app, req).await;

        // Get sessions for the user
        let req = test::TestRequest::get()
            .uri(&format!("/get_sessions/{}", user_id.unwrap()))
            .to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<(String, UserSession)>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Remove all the sessions
        let req = test::TestRequest::delete()
            .uri(&format!("/remove_sessions/{}", user_id.unwrap()))
            .to_request();
        test::call_service(&app, req).await;

        // Get sessions for the user again
        let req = test::TestRequest::get()
            .uri(&format!("/get_sessions/{}", user_id.unwrap()))
            .to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<(String, UserSession)>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 0);

        Ok(())
    }
}
