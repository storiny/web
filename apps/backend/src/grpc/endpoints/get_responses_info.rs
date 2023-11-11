use crate::grpc::{
    defs::response_def::v1::{GetResponsesInfoRequest, GetResponsesInfoResponse},
    service::GrpcService,
};
use sqlx::Row;
use tonic::{Request, Response, Status};

/// Returns the `comment_count` and `reply_count` for a user.
pub async fn get_responses_info(
    client: &GrpcService,
    request: Request<GetResponsesInfoRequest>,
) -> Result<Response<GetResponsesInfoResponse>, Status> {
    let user_id = request
        .into_inner()
        .id
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`id` is invalid"))?;

    let result = sqlx::query(
        r#"
        SELECT
            (SELECT
                 COUNT(*) AS "count"
             FROM
                 replies
             WHERE
                   user_id = $1
               AND deleted_at IS NULL
            ) AS "reply_count",
            (SELECT
                 COUNT(*) AS "count"
             FROM
                 comments
             WHERE
                   user_id = $1
               AND deleted_at IS NULL
            ) AS "comment_count"    
        "#,
    )
    .bind(user_id)
    .fetch_one(&client.db_pool)
    .await
    .map_err(|_| Status::internal("Database error"))?;

    Ok(Response::new(GetResponsesInfoResponse {
        comment_count: result.get::<i64, _>("comment_count") as u32,
        reply_count: result.get::<i64, _>("reply_count") as u32,
    }))
}

#[cfg(test)]
mod tests {
    use crate::grpc::defs::response_def::v1::GetResponsesInfoRequest;
    use crate::test_utils::init_grpc_service_for_test;
    use sqlx::PgPool;
    use tonic::Request;

    #[sqlx::test]
    async fn abcd(pool: PgPool) {
        let (serve_future, mut client) = init_grpc_service_for_test(pool).await;

        let request_future = async {
            let response = client
                .get_responses_info(Request::new(GetResponsesInfoRequest {
                    id: "1".to_string(),
                }))
                .await
                .unwrap()
                .into_inner();

            assert_eq!(1_u32, response.comment_count);
        };

        // Wait for completion, when the client request future completes
        tokio::select! {
            _ = serve_future => panic!("server returned first"),
            _ = request_future => (),
        }
    }
}
