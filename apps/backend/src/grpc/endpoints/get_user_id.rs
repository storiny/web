use crate::constants::redis_namespaces::RedisNamespace;
use crate::{
    grpc::{
        defs::user_def::v1::{GetUserIdRequest, GetUserIdResponse},
        service::GrpcService,
    },
    utils::extract_session_key_from_cookie::extract_session_key_from_cookie,
};
use actix_web::cookie::Key;
use deadpool_redis::redis::cmd;
use serde::Deserialize;
use tonic::{Request, Response, Status};

#[derive(Debug, Deserialize)]
struct CacheResponse {
    user_id: String,
}

/// Returns the user's ID using the session token.
pub async fn get_user_id(
    client: &GrpcService,
    request: Request<GetUserIdRequest>,
) -> Result<Response<GetUserIdResponse>, Status> {
    let secret_key = Key::from(client.config.session_secret_key.as_bytes());
    // Session key is in the format `user_id:token`
    let session_key = extract_session_key_from_cookie(&request.into_inner().token, &secret_key)
        .ok_or(Status::not_found("Invalid token"))?;
    let cache_key = format!("{}:{}", RedisNamespace::Session.to_string(), session_key);

    let mut conn = client
        .redis_pool
        .get()
        .await
        .map_err(|_| Status::internal("Redis pool error"))?;

    let result: Option<String> = cmd("GET")
        .arg(&[cache_key])
        .query_async(&mut conn)
        .await
        .map_err(|_| Status::internal("Redis command error"))?;

    // Invalid session
    if result.is_none() {
        return Err(Status::not_found("Session not found"));
    }

    let user_id = serde_json::from_str::<CacheResponse>(&result.unwrap())
        .map_err(|_| Status::internal("Unable to deserialize the session state"))?
        .user_id;

    Ok(Response::new(GetUserIdResponse { id: user_id }))
}

#[cfg(test)]
mod tests {
    use crate::{
        grpc::defs::user_def::v1::GetUserIdRequest,
        test_utils::{empty_service, init_app_for_test, test_grpc_service},
    };
    use sqlx::PgPool;
    use tonic::{Code, Request};

    #[sqlx::test]
    async fn can_return_user_id(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                let (_, cookie, user_id) =
                    init_app_for_test(empty_service, pool, true, false).await;

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
