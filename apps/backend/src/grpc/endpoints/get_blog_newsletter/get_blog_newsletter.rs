use crate::grpc::{
    defs::{
        blog_def::v1::{
            GetBlogNewsletterRequest,
            GetBlogNewsletterResponse,
        },
        user_def::v1::BareUser,
    },
    service::GrpcService,
};
use serde::Deserialize;
use sqlx::{
    types::Json,
    FromRow,
    Postgres,
    QueryBuilder,
};
use tonic::{
    Request,
    Response,
    Status,
};
use tracing::error;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct User {
    id: i64,
    name: String,
    username: String,
    avatar_id: Option<Uuid>,
    avatar_hex: Option<String>,
    public_flags: i32,
}

#[derive(Debug, FromRow)]
struct Blog {
    id: i64,
    name: String,
    description: Option<String>,
    newsletter_splash_id: Option<Uuid>,
    newsletter_splash_hex: Option<String>,
    user: Json<User>,
    // Boolean flags
    is_subscribed: bool,
    has_plus_features: bool,
}

/// Returns the blog object.
#[tracing::instrument(
    name = "GRPC get_blog_newsletter",
    skip_all,
    fields(
        identifier = tracing::field::Empty,
        user_id = tracing::field::Empty
    ),
    err
)]
pub async fn get_blog_newsletter(
    client: &GrpcService,
    request: Request<GetBlogNewsletterRequest>,
) -> Result<Response<GetBlogNewsletterResponse>, Status> {
    let request = request.into_inner();
    let maybe_blog_slug = request.identifier.clone();
    let maybe_blog_id = request.identifier.parse::<i64>().ok();
    let current_user_id = request
        .current_user_id
        .and_then(|user_id| user_id.parse::<i64>().ok());

    let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
        r#"
SELECT
    b.id,
    b.name,
    b.description,
    b.newsletter_splash_id,
    b.newsletter_splash_hex,
    b.has_plus_features,
    -- User
    JSON_BUILD_OBJECT(
        'id', u.id,
        'name', u.name,
        'username', u.username,
        'avatar_id', u.avatar_id,
        'avatar_hex', u.avatar_hex,
        'public_flags', u.public_flags
    ) AS "user",
"#,
    );

    query_builder.push(if current_user_id.is_some() {
        r#"
-- Boolean flags
"b->is_subscribed".blog_id IS NOT NULL AS "is_subscribed"
"#
    } else {
        r#"
-- Boolean flags
FALSE AS "is_subscribed"
"#
    });

    query_builder.push(
        r#"
FROM
    blogs b
        -- Join blog user
        INNER JOIN users AS u
           ON u.id = b.user_id
"#,
    );

    if let Some(current_user_id) = current_user_id {
        tracing::Span::current().record("user_id", current_user_id);

        query_builder.push(
            r#"
-- Boolean subscription flag
LEFT OUTER JOIN subscribers AS "b->is_subscribed"
    ON "b->is_subscribed".blog_id = b.id
    AND "b->is_subscribed".email = (
        SELECT eu.email FROM users eu
        WHERE
            eu.id =
"#,
        );
        query_builder.push_bind(current_user_id);
        query_builder.push(
            r#"
    AND eu.deleted_at IS NULL
    AND eu.deactivated_at IS NULL
)
"#,
        );
    }

    query_builder.push(r#" WHERE "#);

    if let Some(blog_id) = maybe_blog_id {
        query_builder.push(r#" (b.id = "#);
        query_builder.push_bind(blog_id);
        query_builder.push(r#" OR b.slug = "#);
        query_builder.push_bind(blog_id.to_string());
        query_builder.push(r#") "#);
    } else {
        query_builder.push(r#" (b.domain = "#);
        query_builder.push_bind(maybe_blog_slug.clone());
        query_builder.push(r#" OR b.slug = "#);
        query_builder.push_bind(maybe_blog_slug);
        query_builder.push(r#") "#);
    }

    query_builder.push(r#" AND b.deleted_at IS NULL "#);

    let blog = query_builder
        .build_query_as::<Blog>()
        .fetch_one(&client.db_pool)
        .await
        .map_err(|error| {
            if matches!(error, sqlx::Error::RowNotFound) {
                Status::not_found("Blog not found")
            } else {
                error!("unable to fetch the blog: {error:?}");
                Status::internal("Database error")
            }
        })?;

    Ok(Response::new(GetBlogNewsletterResponse {
        id: blog.id.to_string(),
        name: blog.name,
        description: blog.description,
        // Newsletter splash
        newsletter_splash_id: if blog.has_plus_features {
            blog.newsletter_splash_id.map(|value| value.to_string())
        } else {
            None
        },
        newsletter_splash_hex: if blog.has_plus_features {
            blog.newsletter_splash_hex
        } else {
            None
        },
        user: Some(BareUser {
            id: blog.user.id.to_string(),
            name: blog.user.name.clone(),
            username: blog.user.username.clone(),
            avatar_id: blog.user.avatar_id.map(|value| value.to_string()),
            avatar_hex: blog.user.avatar_hex.clone(),
            public_flags: blog.user.public_flags as u32,
        }),
        is_subscribed: blog.is_subscribed,
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

    #[sqlx::test(fixtures("get_blog_newsletter"))]
    async fn should_not_return_plus_features_for_a_regular_blog(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                let response = client
                    .get_blog_newsletter(Request::new(GetBlogNewsletterRequest {
                        identifier: 3_i64.to_string(),
                        current_user_id: None,
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should include plus features initially.
                assert!(response.newsletter_splash_id.is_some());
                assert!(response.newsletter_splash_hex.is_some());

                // Downgrade the blog.
                let result = sqlx::query(
                    r#"
UPDATE blogs
SET has_plus_features = FALSE
WHERE id = $1
"#,
                )
                .bind(3_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog_newsletter(Request::new(GetBlogNewsletterRequest {
                        identifier: 3_i64.to_string(),
                        current_user_id: None,
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should not include plus features.
                assert!(response.newsletter_splash_id.is_none());
                assert!(response.newsletter_splash_hex.is_none());
            }),
        )
        .await;
    }

    // Logged-out

    #[sqlx::test(fixtures("get_blog_newsletter"))]
    async fn can_return_a_blog_newsletter_by_id(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_blog_newsletter(Request::new(GetBlogNewsletterRequest {
                        identifier: 3_i64.to_string(),
                        current_user_id: None,
                    }))
                    .await;

                assert!(response.is_ok());

                let response = response.unwrap().into_inner();

                // Flags should be neutral.
                assert!(!response.is_subscribed);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog_newsletter"))]
    async fn should_not_return_a_soft_deleted_blog_newsletter_by_id(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                // Soft-delete the blog.
                let result = sqlx::query(
                    r#"
UPDATE blogs
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
                    .get_blog_newsletter(Request::new(GetBlogNewsletterRequest {
                        identifier: 3_i64.to_string(),
                        current_user_id: None,
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    //

    #[sqlx::test(fixtures("get_blog_newsletter"))]
    async fn can_return_a_blog_newsletter_by_slug(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_blog_newsletter(Request::new(GetBlogNewsletterRequest {
                        identifier: "test-blog".to_string(),
                        current_user_id: None,
                    }))
                    .await;

                assert!(response.is_ok());

                let response = response.unwrap().into_inner();

                // Flags should be neutral.
                assert!(!response.is_subscribed);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog_newsletter"))]
    async fn should_not_return_a_soft_deleted_blog_newsletter_by_slug(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                // Soft-delete the blog.
                let result = sqlx::query(
                    r#"
UPDATE blogs
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
                    .get_blog_newsletter(Request::new(GetBlogNewsletterRequest {
                        identifier: "test-blog".to_string(),
                        current_user_id: None,
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    //

    #[sqlx::test(fixtures("get_blog_newsletter"))]
    async fn can_return_a_blog_newsletter_by_domain(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_blog_newsletter(Request::new(GetBlogNewsletterRequest {
                        identifier: "test.com".to_string(),
                        current_user_id: None,
                    }))
                    .await;

                assert!(response.is_ok());

                let response = response.unwrap().into_inner();

                // Flags should be neutral.
                assert!(!response.is_subscribed);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog_newsletter"))]
    async fn should_not_return_a_soft_deleted_blog_newsletter_by_domain(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                // Soft-delete the blog.
                let result = sqlx::query(
                    r#"
UPDATE blogs
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
                    .get_blog_newsletter(Request::new(GetBlogNewsletterRequest {
                        identifier: "test.com".to_string(),
                        current_user_id: None,
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    // Logged-in

    #[sqlx::test(fixtures("get_blog_newsletter"))]
    async fn can_return_a_blog_newsletter_by_id_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, _, _, user_id| async move {
                let response = client
                    .get_blog_newsletter(Request::new(GetBlogNewsletterRequest {
                        identifier: 3_i64.to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await;

                assert!(response.is_ok());

                let response = response.unwrap().into_inner();

                // Flags should be neutral.
                assert!(!response.is_subscribed);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog_newsletter"))]
    async fn should_not_return_a_soft_deleted_blog_newsletter_by_id_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Soft-delete the blog.
                let result = sqlx::query(
                    r#"
UPDATE blogs
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
                    .get_blog_newsletter(Request::new(GetBlogNewsletterRequest {
                        identifier: 3_i64.to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    //

    #[sqlx::test(fixtures("get_blog_newsletter"))]
    async fn can_return_is_subscribed_flag_for_blog_newsletter_by_id_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                let response = client
                    .get_blog_newsletter(Request::new(GetBlogNewsletterRequest {
                        identifier: 3_i64.to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `false` initially.
                assert!(!response.is_subscribed);

                // Subscribe to the blog.
                let result = sqlx::query(
                    r#"
WITH target_user AS (
    SELECT email FROM users
    WHERE id = $1
)
INSERT INTO subscribers (email, blog_id)
VALUES ((SELECT email FROM target_user), $2)
"#,
                )
                .bind(user_id.unwrap())
                .bind(3_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog_newsletter(Request::new(GetBlogNewsletterRequest {
                        identifier: 3_i64.to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `true`.
                assert!(response.is_subscribed);
            }),
        )
        .await;
    }

    //

    #[sqlx::test(fixtures("get_blog_newsletter"))]
    async fn can_return_a_blog_newsletter_by_slug_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, _, _, user_id| async move {
                let response = client
                    .get_blog_newsletter(Request::new(GetBlogNewsletterRequest {
                        identifier: "test-blog".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await;

                assert!(response.is_ok());

                let response = response.unwrap().into_inner();

                // Flags should be neutral.
                assert!(!response.is_subscribed);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog_newsletter"))]
    async fn should_not_return_a_soft_deleted_blog_newsletter_by_slug_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Soft-delete the blog.
                let result = sqlx::query(
                    r#"
UPDATE blogs
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
                    .get_blog_newsletter(Request::new(GetBlogNewsletterRequest {
                        identifier: "test-blog".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    //

    #[sqlx::test(fixtures("get_blog_newsletter"))]
    async fn can_return_is_subscribed_flag_for_blog_newsletter_by_slug_when_logged_in(
        pool: PgPool,
    ) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                let response = client
                    .get_blog_newsletter(Request::new(GetBlogNewsletterRequest {
                        identifier: "test-blog".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `false` initially.
                assert!(!response.is_subscribed);

                // Follow the blog.
                let result = sqlx::query(
                    r#"
WITH target_user AS (
    SELECT email FROM users
    WHERE id = $1
)
INSERT INTO subscribers (email, blog_id)
VALUES ((SELECT email FROM target_user), $2)
"#,
                )
                .bind(user_id.unwrap())
                .bind(3_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog_newsletter(Request::new(GetBlogNewsletterRequest {
                        identifier: "test-blog".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `true`.
                assert!(response.is_subscribed);
            }),
        )
        .await;
    }

    //

    #[sqlx::test(fixtures("get_blog_newsletter"))]
    async fn can_return_a_blog_newsletter_by_domain_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, _, _, user_id| async move {
                let response = client
                    .get_blog_newsletter(Request::new(GetBlogNewsletterRequest {
                        identifier: "test.com".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await;

                assert!(response.is_ok());

                let response = response.unwrap().into_inner();

                // Flags should be neutral.
                assert!(!response.is_subscribed);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog_newsletter"))]
    async fn should_not_return_a_soft_deleted_blog_newsletter_by_domain_when_logged_in(
        pool: PgPool,
    ) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Soft-delete the blog.
                let result = sqlx::query(
                    r#"
UPDATE blogs
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
                    .get_blog_newsletter(Request::new(GetBlogNewsletterRequest {
                        identifier: "test.com".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    //

    #[sqlx::test(fixtures("get_blog_newsletter"))]
    async fn can_return_is_subscribed_flag_for_blog_newsletter_by_domain_when_logged_in(
        pool: PgPool,
    ) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                let response = client
                    .get_blog_newsletter(Request::new(GetBlogNewsletterRequest {
                        identifier: "test.com".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `false` initially.
                assert!(!response.is_subscribed);

                // Follow the blog.
                let result = sqlx::query(
                    r#"
WITH target_user AS (
    SELECT email FROM users
    WHERE id = $1
)
INSERT INTO subscribers (email, blog_id)
VALUES ((SELECT email FROM target_user), $2)
"#,
                )
                .bind(user_id.unwrap())
                .bind(3_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog_newsletter(Request::new(GetBlogNewsletterRequest {
                        identifier: "test.com".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `true`.
                assert!(response.is_subscribed);
            }),
        )
        .await;
    }
}
