use crate::grpc::{
    defs::story_def::v1::{
        GetStoriesInfoRequest,
        GetStoriesInfoResponse,
    },
    service::GrpcService,
};
use sqlx::Row;
use tonic::{
    Request,
    Response,
    Status,
};
use tracing::error;

/// Returns the `published_story_count` and `deleted_story_count` for a user.
#[tracing::instrument(
    name = "GRPC get_stories_info",
    skip_all,
    fields(
        user_id = tracing::field::Empty
    ),
    err
)]
pub async fn get_stories_info(
    client: &GrpcService,
    request: Request<GetStoriesInfoRequest>,
) -> Result<Response<GetStoriesInfoResponse>, Status> {
    let user_id_str = request.into_inner().user_id;

    tracing::Span::current().record("user_id", &user_id_str);

    let user_id = user_id_str
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`user_id` is invalid"))?;

    let result = sqlx::query(
        r#"
SELECT (
    SELECT COUNT(*)
    FROM stories
    WHERE
        user_id = $1
        AND published_at IS NOT NULL    
        AND deleted_at IS NULL
    ) AS "published_story_count",
    (
    SELECT COUNT(*)
    FROM stories
    WHERE
        user_id = $1
        AND first_published_at IS NOT NULL    
        AND deleted_at IS NOT NULL
    ) AS "deleted_story_count"
"#,
    )
    .bind(user_id)
    .fetch_one(&client.db_pool)
    .await
    .map_err(|error| {
        error!("database error: {error:?}");

        Status::internal("Database error")
    })?;

    Ok(Response::new(GetStoriesInfoResponse {
        published_story_count: result.get::<i64, _>("published_story_count") as u32,
        deleted_story_count: result.get::<i64, _>("deleted_story_count") as u32,
    }))
}

#[cfg(test)]
mod tests {
    use crate::{
        grpc::defs::story_def::v1::GetStoriesInfoRequest,
        test_utils::test_grpc_service,
    };
    use sqlx::PgPool;
    use tonic::Request;

    #[sqlx::test(fixtures("get_stories_info"))]
    async fn can_return_stories_info(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_stories_info(Request::new(GetStoriesInfoRequest {
                        user_id: 1_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.published_story_count, 2_u32);
                assert_eq!(response.deleted_story_count, 2_u32);
            }),
        )
        .await;
    }
}
