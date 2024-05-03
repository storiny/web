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
        to_iso8601::to_iso8601,
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
use tracing::error;

/// Predicate function for determining whether a session is currently active.
///
/// * `session_secret_key` - The secret key used to sign the cookies.
/// * `key` - The session key to check against.
/// * `token` - The session cookie value received from the client.
fn is_active_login(session_secret_key: &Key, key: &str, token: &str) -> bool {
    let session_key =
        extract_session_key_from_cookie(token, session_secret_key).unwrap_or_default();

    // Add namespace `s` to the session key.
    *key == format!("{}:{session_key}", RedisNamespace::Session)
}

/// Converts a user session object into a login object.
///
/// * `session_secret_key` - The secret key used to sign the cookies.
/// * `key` - The session key.
/// * `token` - The session cookie value, used to determine whether the session is currently active.
/// * `user_session` - The user session object.
fn convert_user_session_to_login(
    session_secret_key: &Key,
    key: &str,
    token: &str,
    user_session: &UserSession,
) -> Login {
    // Get the token part from the session key (`user_id:token`)
    let token_from_key = key
        .split(':')
        .collect::<Vec<_>>()
        .get(2)
        .map(|value| value.to_string())
        .unwrap_or_default();

    Login {
        id: token_from_key,
        device: user_session.device.as_ref().map(|value| Device {
            display_name: value.display_name.to_string(),
            r#type: value.r#type,
        }),
        location: user_session.location.as_ref().map(|value| Location {
            display_name: value.display_name.to_string(),
            lat: value.lat,
            lng: value.lng,
        }),
        domain: user_session.domain.clone(),
        is_active: is_active_login(session_secret_key, key, token),
        created_at: to_iso8601(
            &OffsetDateTime::from_unix_timestamp(user_session.created_at)
                .unwrap_or(OffsetDateTime::now_utc()),
        ),
    }
}

/// Returns the login activity for the user.
#[tracing::instrument(
    name = "GRPC get_login_activity",
    skip_all,
    fields(
        user_id = tracing::field::Empty
    ),
    err
)]
pub async fn get_login_activity(
    client: &GrpcService,
    request: Request<GetLoginActivityRequest>,
) -> Result<Response<GetLoginActivityResponse>, Status> {
    let request = request.into_inner();
    let token = request.token;
    let user_id_str = request.user_id;

    tracing::Span::current().record("user_id", &user_id_str);

    let user_id = user_id_str
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`user_id` is invalid"))?;

    let sessions = get_user_sessions(&client.redis_pool, user_id)
        .await
        .map_err(|error| {
            error!("unable to fetch the user's sessions: {error:?}");
            Status::internal("Unable to get the sessions for the user")
        })?;

    let session_secret_key = &client.config.session_secret_key;
    let secret_key = Key::from(session_secret_key.as_bytes());

    // Find the most recent unacknowledged session.
    let maybe_recent_login = sessions
        .iter()
        .filter(|&item| !item.1.ack && !is_active_login(&secret_key, &item.0, &token))
        .sorted_by_key(|&item| item.1.created_at)
        .last(); // Last item with the largest `created_at` value.

    Ok(Response::new(GetLoginActivityResponse {
        recent: maybe_recent_login
            .map(|(key, value)| convert_user_session_to_login(&secret_key, key, &token, value)),
        logins: sessions
            .iter()
            .map(|(key, value)| convert_user_session_to_login(&secret_key, key, &token, value))
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
        test_utils::{
            test_grpc_service,
            RedisTestContext,
        },
        utils::{
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
    use storiny_macros::test_context;
    use time::OffsetDateTime;
    use tonic::Request;
    use uuid::Uuid;

    mod serial {
        use super::*;

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_return_login_activity(_ctx: &mut RedisTestContext, pool: PgPool) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, _, redis_pool, user_id| async move {
                    let config = get_app_config().unwrap();
                    let mut conn = redis_pool.get().await.unwrap();

                    // Insert a session.
                    let session_key = format!("{}:{}", user_id.unwrap(), Uuid::new_v4());
                    let secret_key = Key::from(config.session_secret_key.as_bytes());
                    let cookie = Cookie::new(SESSION_COOKIE_NAME, session_key.clone());
                    let mut jar = CookieJar::new();

                    jar.signed_mut(&secret_key).add(cookie);

                    let cookie = jar.delta().next().unwrap();

                    let _: () = conn
                        .set(
                            &format!("{}:{session_key}", RedisNamespace::Session),
                            &rmp_serde::to_vec_named(&UserSession {
                                user_id: user_id.unwrap(),
                                created_at: OffsetDateTime::now_utc().unix_timestamp(),
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
                                ack: false,
                            })
                            .unwrap(),
                        )
                        .await
                        .unwrap();

                    let response = client
                        .get_login_activity(Request::new(GetLoginActivityRequest {
                            user_id: user_id.unwrap().to_string(),
                            token: cookie.value().to_string(),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    assert_eq!(response.logins.len(), 1);
                    assert!(response.logins[0].is_active); // The only session should be active.
                }),
            )
            .await;
        }
    }
}
