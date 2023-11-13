use crate::grpc::defs::response_def::v1::{
    GetStoryResponsesInfoRequest, GetStoryResponsesInfoResponse,
};
use crate::grpc::service::GrpcService;
use sqlx::Row;
use tonic::{Request, Response, Status};

/// Returns the `total_count` and `hidden_count` comments for a story.
pub async fn get_story_responses_info(
    client: &GrpcService,
    request: Request<GetStoryResponsesInfoRequest>,
) -> Result<Response<GetStoryResponsesInfoResponse>, Status> {
    let user_id = request
        .into_inner()
        .user_id
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`user_id` is invalid"))?;
    let story_id = request
        .into_inner()
        .story_id
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`story_id` is invalid"))?;

    let result = sqlx::query(
        r#"
        SELECT
            (SELECT
                 COUNT(*)
             FROM
                 comments
             WHERE
                   user_id = $1
               AND story_id = $2
               AND deleted_at IS NULL
            ) AS "total_count",
            (SELECT
                 COUNT(*)
             FROM
                 comments
             WHERE
                   user_id = $1
               AND story_id = $2
               AND hidden IS TRUE
               AND deleted_at IS NULL
            ) AS "hidden_count"    
        "#,
    )
    .bind(user_id)
    .bind(story_id)
    .fetch_one(&client.db_pool)
    .await
    .map_err(|_| Status::internal("Database error"))?;

    Ok(Response::new(GetStoryResponsesInfoResponse {
        total_count: result.get::<i64, _>("total_count") as u32,
        hidden_count: result.get::<i64, _>("hidden_count") as u32,
    }))
}

#[cfg(test)]
mod tests {
    use crate::grpc::defs::response_def::v1::GetStoryResponsesInfoRequest;
    use crate::test_utils::test_grpc_service;
    use sqlx::PgPool;
    use tonic::Request;

    #[sqlx::test(fixtures("get_story_responses_info"))]
    async fn can_return_story_responses_info(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, user_id| async move {
                let response = client
                    .get_story_responses_info(Request::new(GetStoryResponsesInfoRequest {
                        user_id: 1_i64.to_string(),
                        story_id: 2_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.total_count, 2_u32);
                assert_eq!(response.hidden_count, 1_u32);
            }),
        )
        .await;
    }
}
