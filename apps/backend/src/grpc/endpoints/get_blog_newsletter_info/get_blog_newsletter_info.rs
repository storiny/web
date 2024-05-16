use crate::grpc::{
    defs::blog_def::v1::{
        GetBlogNewsletterInfoRequest,
        GetBlogNewsletterInfoResponse,
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

/// Returns the `subscriber_count` for a blog's newsletter.
#[tracing::instrument(
    name = "GRPC get_blog_newsletter_info",
    skip_all,
    fields(
        identifier = tracing::field::Empty
    ),
    err
)]
pub async fn get_blog_newsletter_info(
    client: &GrpcService,
    request: Request<GetBlogNewsletterInfoRequest>,
) -> Result<Response<GetBlogNewsletterInfoResponse>, Status> {
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
SELECT COUNT(*) AS "subscriber_count"
FROM subscribers
WHERE
    blog_id = (
        SELECT id FROM blog
    )
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

    Ok(Response::new(GetBlogNewsletterInfoResponse {
        subscriber_count: result.get::<i64, _>("subscriber_count") as u32,
    }))
}

#[cfg(test)]
mod tests {
    use crate::{
        grpc::defs::blog_def::v1::GetBlogNewsletterInfoRequest,
        test_utils::test_grpc_service,
    };
    use sqlx::PgPool;
    use tonic::Request;

    #[sqlx::test(fixtures("get_blog_newsletter_info"))]
    async fn can_return_blog_newsletter_info_by_slug(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_blog_newsletter_info(Request::new(GetBlogNewsletterInfoRequest {
                        identifier: "test-blog".to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.subscriber_count, 5_u32);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog_newsletter_info"))]
    async fn can_return_blog_newsletter_info_by_domain(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_blog_newsletter_info(Request::new(GetBlogNewsletterInfoRequest {
                        identifier: "test.com".to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.subscriber_count, 5_u32);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog_newsletter_info"))]
    async fn can_return_blog_newsletter_info_by_id(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_blog_newsletter_info(Request::new(GetBlogNewsletterInfoRequest {
                        identifier: 2_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.subscriber_count, 5_u32);
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
                    .get_blog_newsletter_info(Request::new(GetBlogNewsletterInfoRequest {
                        identifier: "invalid-blog".to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.subscriber_count, 0_u32);
            }),
        )
        .await;
    }
}
