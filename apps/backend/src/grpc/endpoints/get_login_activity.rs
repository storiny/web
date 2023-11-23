use crate::{
    constants::redis_namespaces::RedisNamespace,
    grpc::{
        defs::login_activity_def::v1::{
            Device,
            GetLoginActivityRequest,
            GetLoginActivityResponse,
            Location,
            Login,
        },
        service::GrpcService,
    },
    utils::{
        extract_session_key_from_cookie::extract_session_key_from_cookie,
        get_user_sessions::{
            get_user_sessions,
            UserSession,
        },
    },
};
use cookie::Key;
use itertools::Itertools;
use time::OffsetDateTime;
use tonic::{
    Request,
    Response,
    Status,
};

/// Converts a user session object into a login object.
///
/// * `session_secret_key` - The secret key used to sign the cookies.
/// * `key` - The session key.
/// * `token` - The session cookie value, used to determine whether the session is currently active.
/// * `user_session` - The user session object.
fn convert_user_session_to_login(
    session_secret_key: &str,
    key: &str,
    token: &str,
    user_session: &UserSession,
) -> Login {
    // Get the token part from the session key (`user_id:token`)
    let token_from_key = key
        .split(":")
        .collect::<Vec<_>>()
        .get(2)
        .map(|value| value.to_string())
        .unwrap_or_default();

    let secret_key = Key::from(session_secret_key.as_bytes());
    let session_key = extract_session_key_from_cookie(token, &secret_key).unwrap_or_default();

    Login {
        id: token_from_key,
        device: user_session.device.as_ref().and_then(|value| {
            Some(Device {
                display_name: value.display_name.to_string(),
                r#type: value.r#type,
            })
        }),
        location: user_session.location.as_ref().and_then(|value| {
            Some(Location {
                display_name: value.display_name.to_string(),
                lat: value.lat,
                lng: value.lng,
            })
        }),
        // Add namespace `s` to the session key.
        is_active: key == &format!("{}:{session_key}", RedisNamespace::Session.to_string()),
        created_at: OffsetDateTime::from_unix_timestamp(user_session.created_at)
            .unwrap_or(OffsetDateTime::now_utc())
            .to_string(),
    }
}

/// Returns the login activity for the user.
pub async fn get_login_activity(
    client: &GrpcService,
    request: Request<GetLoginActivityRequest>,
) -> Result<Response<GetLoginActivityResponse>, Status> {
    let request = request.into_inner();
    let token = request.token;
    let user_id = request
        .id
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`id` is invalid"))?;

    let user_sessions = get_user_sessions(&client.redis_pool, user_id).await;

    if user_sessions.is_err() {
        return Err(Status::internal("Unable to get sessions for the user"));
    }

    let sessions = user_sessions.unwrap();
    // Find the most recent unacknowledged session
    let maybe_recent_login = sessions
        .iter()
        .filter(|&item| !item.1.ack)
        .sorted_by_key(|&item| item.1.created_at)
        .last(); // Last item with the largest `created_at` value.

    Ok(Response::new(GetLoginActivityResponse {
        recent: maybe_recent_login.and_then(|(key, value)| {
            Some(convert_user_session_to_login(
                &client.config.session_secret_key,
                key,
                &token,
                value,
            ))
        }),
        logins: sessions
            .iter()
            .map(|(key, value)| {
                convert_user_session_to_login(&client.config.session_secret_key, key, &token, value)
            })
            .collect::<Vec<_>>(),
    }))
}

#[cfg(test)]
mod tests {
    use crate::{
        config::get_app_config,
        constants::{
            redis_namespaces::RedisNamespace,
            session_cookie::SESSION_COOKIE_NAME,
        },
        grpc::defs::login_activity_def::v1::GetLoginActivityRequest,
        test_utils::test_grpc_service,
        utils::{
            clear_user_sessions::clear_user_sessions,
            get_client_device::ClientDevice,
            get_client_location::ClientLocation,
            get_user_sessions::UserSession,
        },
    };
    use cookie::{
        Cookie,
        CookieJar,
        Key,
    };
    use redis::AsyncCommands;
    use sqlx::PgPool;
    use time::OffsetDateTime;
    use tonic::Request;
    use uuid::Uuid;

    #[sqlx::test]
    async fn can_return_login_activity(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, _, redis_pool, user_id| async move {
                let config = get_app_config().unwrap();
                let mut conn = redis_pool.get().await.unwrap();

                // Remove all the previous sessions
                clear_user_sessions(&redis_pool, user_id.unwrap())
                    .await
                    .unwrap();

                // Insert a session
                let session_key = format!("{}:{}", user_id.unwrap(), Uuid::new_v4().to_string());
                let secret_key = Key::from(&config.session_secret_key.as_bytes());
                let cookie = Cookie::new(SESSION_COOKIE_NAME, session_key.clone());
                let mut jar = CookieJar::new();

                jar.signed_mut(&secret_key).add(cookie);

                let cookie = jar.delta().next().unwrap();

                let _: () = conn
                    .set(
                        &format!("{}:{session_key}", RedisNamespace::Session.to_string()),
                        &serde_json::to_string(&UserSession {
                            user_id: user_id.unwrap(),
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

                let response = client
                    .get_login_activity(Request::new(GetLoginActivityRequest {
                        id: user_id.unwrap().to_string(),
                        token: cookie.value().to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert!(response.recent.is_some());
                assert_eq!(response.logins.len(), 1);
                assert!(response.recent.unwrap().is_active); // The only session should be active

                // Remove all the sessions
                clear_user_sessions(&redis_pool, user_id.unwrap())
                    .await
                    .unwrap();
            }),
        )
        .await;
    }
}
