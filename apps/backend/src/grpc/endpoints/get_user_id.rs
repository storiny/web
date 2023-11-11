use crate::grpc::{
    defs::user_def::v1::{GetUserIdRequest, GetUserIdResponse},
    service::GrpcService,
};
use actix_redis::{resp_array, Command};
use sqlx::Row;
use tonic::{Request, Response, Status};

/// Returns the user's ID using the session token.
pub async fn get_user_id(
    client: &GrpcService,
    request: Request<GetUserIdRequest>,
) -> Result<Response<GetUserIdResponse>, Status> {
    let session_key = request.into_inner().token;
    let cache_key = format!("s:{}", session_key);
    let result = client
        .redis
        .send(Command(resp_array!["GET", cache_key]))
        .await;

    panic!("{:#?}", result.unwrap());

    Ok(Response::new(GetUserIdResponse { id: "".into() }))
}

#[cfg(test)]
mod tests {
    use crate::grpc::defs::user_def::v1::GetUserIdRequest;
    use crate::test_utils::test_grpc_service;
    use crate::test_utils::{empty_service, init_app_for_test};
    use sqlx::PgPool;
    use tonic::Request;

    #[sqlx::test]
    async fn can_return_user_id(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _| async move {
                let (_, cookie, user_id) =
                    init_app_for_test(empty_service, pool, true, false).await;

                let response = client
                    .get_user_id(Request::new(GetUserIdRequest {
                        token: cookie.unwrap().to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(user_id.unwrap(), response.id.parse::<i64>().unwrap());
            }),
        )
        .await;
    }
}
