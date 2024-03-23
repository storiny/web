use crate::grpc::{
    defs::blog_def::v1::{
        GetUserBlogsInfoRequest,
        GetUserBlogsInfoResponse,
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

/// Returns the `blog_count`, `pending_blog_request_count`, and `can_create_blog` for a user.
#[tracing::instrument(
    name = "GRPC get_user_blogs_info",
    skip_all,
    fields(
        user_id = tracing::field::Empty
    ),
    err
)]
pub async fn get_user_blogs_info(
    client: &GrpcService,
    request: Request<GetUserBlogsInfoRequest>,
) -> Result<Response<GetUserBlogsInfoResponse>, Status> {
    let user_id_str = request.into_inner().user_id;

    tracing::Span::current().record("user_id", &user_id_str);

    let user_id = user_id_str
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`user_id` is invalid"))?;

    let result = sqlx::query(
        r#"
SELECT (
    (
        SELECT COUNT(*) FROM blogs
        WHERE user_id = $1 AND deleted_at IS NULL
    ) + (
        SELECT COUNT(*) FROM blog_editors
        WHERE user_id = $1 AND deleted_at IS NULL AND accepted_at IS NOT NULL
    ) + (
        SELECT COUNT(*) FROM blog_writers
        WHERE receiver_id = $1 AND deleted_at IS NULL AND accepted_at IS NOT NULL
    )
) AS "blog_count",
(
    (
        SELECT COUNT(*) FROM blog_editors
        WHERE user_id = $1 AND deleted_at IS NULL AND accepted_at IS NULL
    ) + (
        SELECT COUNT(*) FROM blog_writers
        WHERE receiver_id = $1 AND deleted_at IS NULL AND accepted_at IS NULL
    )
) AS "pending_blog_request_count",
CASE
    WHEN (
        SELECT COUNT(*) FROM blogs
        WHERE user_id = $1 AND deleted_at IS NULL
    ) >= 1
        THEN FALSE
    ELSE TRUE
END AS "can_create_blog"
"#,
    )
    .bind(user_id)
    .fetch_one(&client.db_pool)
    .await
    .map_err(|error| {
        error!("database error: {error:?}");
        Status::internal("Database error")
    })?;

    Ok(Response::new(GetUserBlogsInfoResponse {
        blog_count: result.get::<i64, _>("blog_count") as u32,
        pending_blog_request_count: result.get::<i64, _>("pending_blog_request_count") as u32,
        can_create_blog: result.get::<bool, _>("can_create_blog"),
    }))
}

#[cfg(test)]
mod tests {
    use crate::{
        grpc::defs::blog_def::v1::GetUserBlogsInfoRequest,
        test_utils::test_grpc_service,
    };
    use sqlx::PgPool;
    use tonic::Request;

    #[sqlx::test(fixtures("get_user_blogs_info"))]
    async fn can_return_user_blogs_info(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_user_blogs_info(Request::new(GetUserBlogsInfoRequest {
                        user_id: 1_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.blog_count, 4_u32);
                assert_eq!(response.pending_blog_request_count, 4_u32);
                assert!(response.can_create_blog);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_user_blogs_info"))]
    async fn should_not_count_soft_deleted_relations(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                // Should count all the relations initially.
                let response = client
                    .get_user_blogs_info(Request::new(GetUserBlogsInfoRequest {
                        user_id: 1_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.blog_count, 4_u32);
                assert_eq!(response.pending_blog_request_count, 4_u32);

                // Soft-delete two of the relations.
                let result = sqlx::query(
                    r#"
WITH updated_writer AS (
    UPDATE blog_writers
    SET deleted_at = NOW()
    WHERE receiver_id = $1 AND blog_id IN (7, 9)
)
UPDATE blog_editors
SET deleted_at = NOW()
WHERE user_id = $1 AND blog_id IN (3, 5)
"#,
                )
                .bind(1_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 2);

                // Should count only valid relations.
                let response = client
                    .get_user_blogs_info(Request::new(GetUserBlogsInfoRequest {
                        user_id: 1_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.blog_count, 2_u32);
                assert_eq!(response.pending_blog_request_count, 2_u32);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_user_blogs_info"))]
    async fn can_return_can_create_blog_flag(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                let response = client
                    .get_user_blogs_info(Request::new(GetUserBlogsInfoRequest {
                        user_id: 1_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `true` initially.
                assert!(response.can_create_blog);

                // Insert a blog for the user.
                let result = sqlx::query(
                    r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ('Sample blog', 'sample-blog', $1)
"#,
                )
                .bind(1_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_user_blogs_info(Request::new(GetUserBlogsInfoRequest {
                        user_id: 1_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `false`.
                assert!(!response.can_create_blog);

                // Should also include the newly create blog in `blog_count`.
                assert_eq!(response.blog_count, 5_u32);
            }),
        )
        .await;
    }
}
