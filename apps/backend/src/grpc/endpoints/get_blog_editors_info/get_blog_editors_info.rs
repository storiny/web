use crate::grpc::{
    defs::blog_def::v1::{
        GetBlogEditorsInfoRequest,
        GetBlogEditorsInfoResponse,
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

/// Returns the `editor_count` and `pending_editor_request_count` for a blog.
#[tracing::instrument(
    name = "GRPC get_blog_editors_info",
    skip_all,
    fields(
        identifier = tracing::field::Empty
    ),
    err
)]
pub async fn get_blog_editors_info(
    client: &GrpcService,
    request: Request<GetBlogEditorsInfoRequest>,
) -> Result<Response<GetBlogEditorsInfoResponse>, Status> {
    let identifier = request.into_inner().identifier;
    // Identifier can be slug, domain or the ID
    let is_identifier_number = identifier.parse::<i64>().is_ok();

    tracing::Span::current().record("identifier", &identifier);

    let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
        r#"
WITH blog AS (
    SELECT id, editor_count
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
SELECT
    COALESCE(
        (
            SELECT editor_count
            FROM blog
        )
    , 0) AS "editor_count",
(
    SELECT COUNT(*)
    FROM blog_editors
    WHERE
        blog_id = (
            SELECT id FROM blog
        )
        AND deleted_at IS NULL
        AND accepted_at IS NULL
) AS "pending_editor_request_count"
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

    Ok(Response::new(GetBlogEditorsInfoResponse {
        editor_count: result.get::<i32, _>("editor_count") as u32,
        pending_editor_request_count: result.get::<i64, _>("pending_editor_request_count") as u32,
    }))
}

#[cfg(test)]
mod tests {
    use crate::{
        grpc::defs::blog_def::v1::GetBlogEditorsInfoRequest,
        test_utils::test_grpc_service,
    };
    use sqlx::PgPool;
    use tonic::Request;

    #[sqlx::test(fixtures("get_blog_editors_info"))]
    async fn can_return_blog_editors_info_by_slug(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_blog_editors_info(Request::new(GetBlogEditorsInfoRequest {
                        identifier: "test-blog".to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.editor_count, 3_u32);
                assert_eq!(response.pending_editor_request_count, 2_u32);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog_editors_info"))]
    async fn can_return_blog_editors_info_by_id(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_blog_editors_info(Request::new(GetBlogEditorsInfoRequest {
                        identifier: 7_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.editor_count, 3_u32);
                assert_eq!(response.pending_editor_request_count, 2_u32);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog_editors_info"))]
    async fn can_return_blog_editors_info_by_domain(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_blog_editors_info(Request::new(GetBlogEditorsInfoRequest {
                        identifier: "test.com".to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.editor_count, 3_u32);
                assert_eq!(response.pending_editor_request_count, 2_u32);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog_editors_info"))]
    async fn should_not_count_soft_deleted_editors(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                // Should count all the editors initially.
                let response = client
                    .get_blog_editors_info(Request::new(GetBlogEditorsInfoRequest {
                        identifier: "test-blog".to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.editor_count, 3_u32);
                assert_eq!(response.pending_editor_request_count, 2_u32);

                // Soft-delete one of the editor relations.
                let result = sqlx::query(
                    r#"
UPDATE blog_editors
SET deleted_at = NOW()
WHERE user_id IN ($1, $2)
"#,
                )
                .bind(3_i64)
                .bind(6_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 2);

                // Should count only valid editors.
                let response = client
                    .get_blog_editors_info(Request::new(GetBlogEditorsInfoRequest {
                        identifier: "test-blog".to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.editor_count, 2_u32);
                assert_eq!(response.pending_editor_request_count, 1_u32);
            }),
        )
        .await;
    }

    #[sqlx::test]
    async fn can_handle_a_missing_blog(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_blog_editors_info(Request::new(GetBlogEditorsInfoRequest {
                        identifier: "invalid-blog".to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.editor_count, 0_u32);
                assert_eq!(response.pending_editor_request_count, 0_u32);
            }),
        )
        .await;
    }
}
