use crate::grpc::{
    defs::open_graph_def::v1::{
        GetStoryOpenGraphDataRequest,
        GetStoryOpenGraphDataResponse,
    },
    service::GrpcService,
};
use sqlx::FromRow;
use tonic::{
    Request,
    Response,
    Status,
};
use tracing::error;
use uuid::Uuid;

#[derive(Debug, FromRow)]
struct Story {
    id: i64,
    title: String,
    description: Option<String>,
    splash_id: Option<Uuid>,
    read_count: i32,
    like_count: i32,
    comment_count: i32,
    // User
    user_name: String,
    user_avatar_id: Option<Uuid>,
    // Boolean flags
    is_private: bool,
}

/// Returns the open graph data for a story.
#[tracing::instrument(
    name = "GRPC get_story_open_graph_data",
    skip_all,
    fields(
        id = tracing::field::Empty
    ),
    err
)]
pub async fn get_story_open_graph_data(
    client: &GrpcService,
    request: Request<GetStoryOpenGraphDataRequest>,
) -> Result<Response<GetStoryOpenGraphDataResponse>, Status> {
    let request = request.into_inner();
    let id_str = request.id;

    tracing::Span::current().record("id", &id_str);

    let id = id_str
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`id` is invalid"))?;

    let story = sqlx::query_as::<_, Story>(
        r#"
SELECT
    s.id,
    s.title,
    s.description,
    s.splash_id,
    s.read_count,
    s.like_count,
    s.comment_count,
    -- User
    u.name AS "user_name",
    u.avatar_id AS "user_avatar_id",
    -- Boolean flags
    u.is_private AS "is_private"
FROM stories AS s
    INNER JOIN users AS u
        ON u.id = s.user_id
WHERE
    s.id = $1
    AND s.published_at IS NOT NULL
    AND s.deleted_at IS NULL
"#,
    )
    .bind(id)
    .fetch_one(&client.db_pool)
    .await
    .map_err(|error| {
        if matches!(error, sqlx::Error::RowNotFound) {
            Status::not_found("Story not found")
        } else {
            error!("database error: {error:?}");
            Status::internal("Database error")
        }
    })?;

    Ok(Response::new(GetStoryOpenGraphDataResponse {
        id: story.id.to_string(),
        title: story.title,
        description: story.description,
        splash_id: story.splash_id.map(|value| value.to_string()),
        like_count: story.like_count as u32,
        read_count: story.read_count as u32,
        comment_count: story.comment_count as u32,
        // User
        user_name: story.user_name,
        user_avatar_id: story.user_avatar_id.map(|value| value.to_string()),
        // Boolean flags
        is_private: story.is_private,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::test_grpc_service;
    use sqlx::PgPool;
    use tonic::{
        Code,
        Request,
    };

    #[sqlx::test(fixtures("get_story_open_graph_data"))]
    async fn can_return_a_story_open_graph_data(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_story_open_graph_data(Request::new(GetStoryOpenGraphDataRequest {
                        id: 2_i64.to_string(),
                    }))
                    .await;

                assert!(response.is_ok());
            }),
        )
        .await;
    }

    #[sqlx::test]
    async fn can_reject_a_missing_story(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_story_open_graph_data(Request::new(GetStoryOpenGraphDataRequest {
                        id: "12345".to_string(),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_story_open_graph_data"))]
    async fn can_reject_an_unpublished_story(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                // Unpublish the story.
                let result = sqlx::query(
                    r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
                )
                .bind(2_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_story_open_graph_data(Request::new(GetStoryOpenGraphDataRequest {
                        id: 2_i64.to_string(),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_story_open_graph_data"))]
    async fn can_reject_a_soft_deleted_story(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                // Soft-delete the story.
                let result = sqlx::query(
                    r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
                )
                .bind(2_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_story_open_graph_data(Request::new(GetStoryOpenGraphDataRequest {
                        id: 2_i64.to_string(),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }
}
