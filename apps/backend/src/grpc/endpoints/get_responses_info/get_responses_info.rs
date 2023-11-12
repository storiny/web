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
                 COUNT(*)
             FROM
                 replies
             WHERE
                   user_id = $1
               AND deleted_at IS NULL
            ) AS "reply_count",
            (SELECT
                 COUNT(*)
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
    use crate::{
        grpc::defs::response_def::v1::GetResponsesInfoRequest, test_utils::test_grpc_service,
    };
    use sqlx::PgPool;
    use tonic::Request;

    #[sqlx::test(fixtures("get_responses_info"))]
    async fn can_return_responses_info(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, user_id| async move {
                let response = client
                    .get_responses_info(Request::new(GetResponsesInfoRequest {
                        id: 1_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.comment_count, 2_u32);
                assert_eq!(response.reply_count, 2_u32);
            }),
        )
        .await;
    }
}
