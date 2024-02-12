use crate::grpc::{
    defs::story_def::v1::{
        ValidateStoryRequest,
        ValidateStoryResponse,
    },
    service::GrpcService,
};
use tonic::{
    Request,
    Response,
    Status,
};
use tracing::error;

/// Validates a published story against the user's ID.
#[tracing::instrument(
    name = "GRPC validate_story",
    skip_all,
    fields(
        user_id = tracing::field::Empty,
        story_id = tracing::field::Empty
    ),
    err
)]
pub async fn validate_story(
    client: &GrpcService,
    request: Request<ValidateStoryRequest>,
) -> Result<Response<ValidateStoryResponse>, Status> {
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

    sqlx::query(
        r#"
SELECT 1 FROM stories
WHERE
    id = $1
    AND user_id = $2
    AND published_at IS NOT NULL
    AND deleted_at IS NULL
"#,
    )
    .bind(story_id)
    .bind(user_id)
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

    Ok(Response::new(ValidateStoryResponse {}))
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

    #[sqlx::test(fixtures("validate_story"))]
    async fn can_validate_a_story(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .validate_story(Request::new(ValidateStoryRequest {
                        user_id: 2_i64.to_string(),
                        story_id: 3_i64.to_string(),
                    }))
                    .await;

                assert!(response.is_ok());
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("validate_story"))]
    async fn can_validate_an_invalid_story(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .validate_story(Request::new(ValidateStoryRequest {
                        user_id: 2_i64.to_string(),
                        story_id: "12345".to_string(),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("validate_story"))]
    async fn can_validate_an_unpublished_story(pool: PgPool) {
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
                .bind(3_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .validate_story(Request::new(ValidateStoryRequest {
                        user_id: 2_i64.to_string(),
                        story_id: 3_i64.to_string(),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("validate_story"))]
    async fn can_validate_a_soft_deleted_story(pool: PgPool) {
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
                .bind(3_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .validate_story(Request::new(ValidateStoryRequest {
                        user_id: 2_i64.to_string(),
                        story_id: 3_i64.to_string(),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }
}
