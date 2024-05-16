use crate::grpc::{
    defs::blog_def::v1::{
        GetBlogPendingStoryCountRequest,
        GetBlogPendingStoryCountResponse,
    },
    service::GrpcService,
};
use sqlx::{
    Postgres,
    QueryBuilder,
    Row,
};
use tonic::{
    Request,
    Response,
    Status,
};
use tracing::error;

/// Returns the `pending_story_count` for a blog.
#[tracing::instrument(
    name = "GRPC get_blog_pending_story_count",
    skip_all,
    fields(
        identifier = tracing::field::Empty
    ),
    err
)]
pub async fn get_blog_pending_story_count(
    client: &GrpcService,
    request: Request<GetBlogPendingStoryCountRequest>,
) -> Result<Response<GetBlogPendingStoryCountResponse>, Status> {
    let identifier = request.into_inner().identifier;
    // Identifier can be slug, domain or the ID
    let is_identifier_number = identifier.parse::<i64>().is_ok();

    tracing::Span::current().record("identifier", &identifier);

    let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
        r#"
WITH blog AS (
    SELECT id
    FROM blogs b
    WHERE
"#,
    );

    query_builder.push(if is_identifier_number {
        r#"
(b.id = $1::BIGINT OR b.slug = $1)
"#
    } else {
        // The identifier is definitely not an ID
        r#"
(b.domain = $1 OR b.slug = $1)
"#
    });

    query_builder.push(
        r#"
    AND b.deleted_at IS NULL
)
SELECT COUNT(*) AS "pending_story_count"
FROM blog_stories
WHERE
    blog_id = (
        SELECT id FROM blog
    )
    AND deleted_at IS NULL
    AND accepted_at IS NULL
"#,
    );

    let result = query_builder
        .build()
        .bind(identifier)
        .fetch_one(&client.db_pool)
        .await
        .map_err(|error| {
            error!("database error: {error:?}");

            Status::internal("Database error")
        })?;

    Ok(Response::new(GetBlogPendingStoryCountResponse {
        pending_story_count: result.get::<i64, _>("pending_story_count") as u32,
    }))
}

#[cfg(test)]
mod tests {
    use crate::{
        grpc::defs::blog_def::v1::GetBlogPendingStoryCountRequest,
        test_utils::test_grpc_service,
    };
    use sqlx::PgPool;
    use tonic::Request;

    #[sqlx::test(fixtures("get_blog_pending_story_count"))]
    async fn can_return_blog_pending_story_count_by_slug(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_blog_pending_story_count(Request::new(GetBlogPendingStoryCountRequest {
                        identifier: "test-blog".to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.pending_story_count, 3_u32);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog_pending_story_count"))]
    async fn can_return_blog_pending_story_count_by_domain(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_blog_pending_story_count(Request::new(GetBlogPendingStoryCountRequest {
                        identifier: "test.com".to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.pending_story_count, 3_u32);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog_pending_story_count"))]
    async fn can_return_blog_pending_story_count_by_id(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_blog_pending_story_count(Request::new(GetBlogPendingStoryCountRequest {
                        identifier: 2_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.pending_story_count, 3_u32);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog_pending_story_count"))]
    async fn should_not_count_soft_deleted_pending_stories(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                // Should count all the pending stories initially.
                let response = client
                    .get_blog_pending_story_count(Request::new(GetBlogPendingStoryCountRequest {
                        identifier: "test-blog".to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.pending_story_count, 3_u32);

                // Soft-delete one of the blog story relations.
                let result = sqlx::query(
                    r#"
UPDATE blog_stories
SET deleted_at = NOW()
WHERE story_id = $1
"#,
                )
                .bind(4_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                // Should count only valid pending stories.
                let response = client
                    .get_blog_pending_story_count(Request::new(GetBlogPendingStoryCountRequest {
                        identifier: "test-blog".to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.pending_story_count, 2_u32);
            }),
        )
        .await;
    }
}
