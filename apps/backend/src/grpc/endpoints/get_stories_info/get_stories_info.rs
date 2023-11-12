use crate::grpc::{
    defs::story_def::v1::{GetStoriesInfoRequest, GetStoriesInfoResponse},
    service::GrpcService,
};
use sqlx::Row;
use tonic::{Request, Response, Status};

/// Returns the `published_story_count` and `deleted_story_count` for a user.
pub async fn get_stories_info(
    client: &GrpcService,
    request: Request<GetStoriesInfoRequest>,
) -> Result<Response<GetStoriesInfoResponse>, Status> {
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
                 stories
             WHERE
                   user_id = $1
               AND published_at IS NOT NULL    
               AND deleted_at IS NULL
            ) AS "published_story_count",
            (SELECT
                 COUNT(*)
             FROM
                 stories
             WHERE
                   user_id = $1
               AND published_at IS NOT NULL    
               AND deleted_at IS NOT NULL
            ) AS "deleted_story_count"    
        "#,
    )
    .bind(user_id)
    .fetch_one(&client.db_pool)
    .await
    .map_err(|_| Status::internal("Database error"))?;

    Ok(Response::new(GetStoriesInfoResponse {
        published_story_count: result.get::<i64, _>("published_story_count") as u32,
        deleted_story_count: result.get::<i64, _>("deleted_story_count") as u32,
    }))
}

#[cfg(test)]
mod tests {
    use crate::{grpc::defs::story_def::v1::GetStoriesInfoRequest, test_utils::test_grpc_service};
    use sqlx::PgPool;
    use tonic::Request;

    #[sqlx::test(fixtures("get_stories_info"))]
    async fn can_return_stories_info(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, user_id| async move {
                let response = client
                    .get_stories_info(Request::new(GetStoriesInfoRequest {
                        id: 1_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(2_u32, response.published_story_count);
                assert_eq!(2_u32, response.deleted_story_count);
            }),
        )
        .await;
    }
}
