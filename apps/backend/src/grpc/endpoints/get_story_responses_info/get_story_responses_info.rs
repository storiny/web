use crate::grpc::{
    defs::response_def::v1::{
        GetStoryResponsesInfoRequest,
        GetStoryResponsesInfoResponse,
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

/// Returns the `total_count` and `hidden_count` comments for a story.
#[tracing::instrument(
    name = "GRPC get_story_responses_info",
    skip_all,
    fields(
        user_id = tracing::field::Empty,
        story_id = tracing::field::Empty
    ),
    err
)]
pub async fn get_story_responses_info(
    client: &GrpcService,
    request: Request<GetStoryResponsesInfoRequest>,
) -> Result<Response<GetStoryResponsesInfoResponse>, Status> {
    let request = request.into_inner();
    let user_id_str = request.user_id;
    let story_id_str = request.story_id;

    tracing::Span::current().record("user_id", &user_id_str);
    tracing::Span::current().record("story_id", &story_id_str);

    let user_id = user_id_str
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`user_id` is invalid"))?;
    let story_id = story_id_str
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`story_id` is invalid"))?;

    let result = sqlx::query(
        r#"
SELECT (
    SELECT COUNT(*)
    FROM comments
    WHERE
        story_id = (
            SELECT id FROM stories s
            WHERE
                s.id = $2
                AND s.user_id = $1
                AND s.published_at IS NOT NULL
                AND s.deleted_at IS NULL
        )
        AND deleted_at IS NULL
    ) AS "total_count",
    (
    SELECT COUNT(*)
    FROM comments
    WHERE
        story_id = (
            SELECT id FROM stories s
            WHERE
                s.id = $2
                AND s.user_id = $1
                AND s.published_at IS NOT NULL
                AND s.deleted_at IS NULL
        )
        AND hidden IS TRUE
        AND deleted_at IS NULL
    ) AS "hidden_count"    
"#,
    )
    .bind(user_id)
    .bind(story_id)
    .fetch_one(&client.db_pool)
    .await
    .map_err(|error| {
        error!("database error: {error:?}");

        Status::internal("Database error")
    })?;

    Ok(Response::new(GetStoryResponsesInfoResponse {
        total_count: result.get::<i64, _>("total_count") as u32,
        hidden_count: result.get::<i64, _>("hidden_count") as u32,
    }))
}

#[cfg(test)]
mod tests {
    use crate::{
        grpc::defs::response_def::v1::GetStoryResponsesInfoRequest,
        test_utils::test_grpc_service,
    };
    use sqlx::PgPool;
    use tonic::Request;

    #[sqlx::test(fixtures("get_story_responses_info"))]
    async fn can_return_story_responses_info(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
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

    #[sqlx::test(fixtures("get_story_responses_info"))]
    async fn should_not_count_soft_deleted_comments(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                // Should count all the comments initially.
                let response = client
                    .get_story_responses_info(Request::new(GetStoryResponsesInfoRequest {
                        user_id: 1_i64.to_string(),
                        story_id: 2_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.total_count, 2_u32);

                // Soft-delete one of the comments.
                let result = sqlx::query(
                    r#"
UPDATE comments
SET deleted_at = NOW()
WHERE id = $1
"#,
                )
                .bind(2_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                // Should count only one comment.
                let response = client
                    .get_story_responses_info(Request::new(GetStoryResponsesInfoRequest {
                        user_id: 1_i64.to_string(),
                        story_id: 2_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.total_count, 1_u32);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_story_responses_info"))]
    async fn should_not_count_soft_deleted_hidden_comments(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                // Should count all the comments initially.
                let response = client
                    .get_story_responses_info(Request::new(GetStoryResponsesInfoRequest {
                        user_id: 1_i64.to_string(),
                        story_id: 2_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.total_count, 2_u32);

                // Soft-delete one of the comments.
                let result = sqlx::query(
                    r#"
UPDATE comments
SET deleted_at = NOW()
WHERE id = $1
"#,
                )
                .bind(3_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                // Should count only one comment.
                let response = client
                    .get_story_responses_info(Request::new(GetStoryResponsesInfoRequest {
                        user_id: 1_i64.to_string(),
                        story_id: 2_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.total_count, 1_u32);
            }),
        )
        .await;
    }
}
