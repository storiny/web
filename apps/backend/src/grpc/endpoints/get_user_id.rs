use crate::{
    constants::redis_namespaces::RedisNamespace,
    grpc::{
        defs::user_def::v1::{
            GetUserIdRequest,
            GetUserIdResponse,
        },
        service::GrpcService,
    },
    utils::extract_session_key_from_cookie::extract_session_key_from_cookie,
};
use cookie::Key;
use deadpool_redis::redis::cmd;
use serde::Deserialize;
use tonic::{
    Request,
    Response,
    Status,
};
use tracing::{
    debug,
    error,
    warn,
};

#[derive(Debug, Deserialize)]
struct CacheResponse {
    user_id: i64,
}

/// Returns the user's ID using the session token.
#[tracing::instrument(name = "GRPC get_user_id", skip_all, err)]
pub async fn get_user_id(
    client: &GrpcService,
    request: Request<GetUserIdRequest>,
) -> Result<Response<GetUserIdResponse>, Status> {
    let secret_key = Key::from(client.config.session_secret_key.as_bytes());
    // Session key is in the format `user_id:token`.
    let session_key = extract_session_key_from_cookie(&request.into_inner().token, &secret_key)
        .ok_or(Status::not_found("Invalid token"))?;
    let cache_key = format!("{}:{}", RedisNamespace::Session, session_key);

    let mut conn = client.redis_pool.get().await.map_err(|error| {
        error!("unable to acquire a connection from the Redis pool: {error:?}");

        Status::internal("Redis error")
    })?;

    let result: Option<Vec<u8>> = cmd("GET")
        .arg(&[cache_key])
        .query_async(&mut conn)
        .await
        .map_err(|error| {
            error!("unable to fetch the session data: {error:?}");

            Status::internal("Redis error")
        })?;

    // Missing session.
    if result.is_none() {
        debug!("no session found in the cache");

        return Err(Status::not_found("Session not found"));
    }

    let user_id = rmp_serde::from_slice::<CacheResponse>(&result.unwrap_or_default())
        .map_err(|error| {
            // This can happen when we manually insert a key value pair into the session while the
            // user has not logged-in.
            warn!("`user_id` is not present in the session data: {error:?}");

            Status::not_found("Valid session not found")
        })?
        .user_id;

    Ok(Response::new(GetUserIdResponse {
        id: user_id.to_string(),
    }))
}

#[cfg(test)]
mod tests {
    use crate::{
        grpc::defs::user_def::v1::GetUserIdRequest,
        test_utils::{
            empty_service,
            init_app_for_test,
            test_grpc_service,
        },
    };
    use sqlx::PgPool;
    use tonic::{
        Code,
        Request,
    };

    #[sqlx::test]
    async fn can_return_user_id(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                let (_, cookie, user_id) =
                    init_app_for_test(empty_service, pool, true, false, None).await;

                let response = client
                    .get_user_id(Request::new(GetUserIdRequest {
                        token: cookie.unwrap().value().to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(user_id.unwrap(), response.id.parse::<i64>().unwrap());
            }),
        )
        .await;
    }

    #[sqlx::test]
    async fn can_reject_invalid_session_token(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_user_id(Request::new(GetUserIdRequest {
                        token: "invalid_token".to_string(),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }
}
