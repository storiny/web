use crate::{
    grpc::{
        defs::{
            blog_def::v1::BareBlog,
            story_def::v1::{
                GetStoryMetadataRequest,
                GetStoryMetadataResponse,
            },
            tag_def::v1::Tag as StoryTag,
            user_def::v1::BareUser,
        },
        service::GrpcService,
    },
    utils::to_iso8601::to_iso8601,
};
use serde::Deserialize;
use sqlx::{
    types::Json,
    FromRow,
};
use time::OffsetDateTime;
use tonic::{
    Request,
    Response,
    Status,
};
use tracing::error;
use uuid::Uuid;

#[derive(sqlx::Type, Debug)]
struct Tag {
    id: String,
    name: String,
}

#[derive(Debug, Deserialize)]
struct Blog {
    id: i64,
    name: String,
    slug: String,
    domain: Option<String>,
    logo_id: Option<Uuid>,
    logo_hex: Option<String>,
}

#[derive(Debug, FromRow)]
struct Story {
    id: i64,
    title: String,
    slug: Option<String>,
    description: Option<String>,
    splash_id: Option<Uuid>,
    splash_hex: Option<String>,
    category: String,
    age_restriction: i16,
    visibility: i16,
    license: i16,
    user_id: i64,
    role: String,
    // SEO
    canonical_url: Option<String>,
    seo_title: Option<String>,
    seo_description: Option<String>,
    preview_image: Option<Uuid>,
    // Settings
    disable_public_revision_history: bool,
    disable_comments: bool,
    disable_toc: bool,
    // Timestamps
    created_at: OffsetDateTime,
    first_published_at: Option<OffsetDateTime>,
    published_at: Option<OffsetDateTime>,
    edited_at: Option<OffsetDateTime>,
    deleted_at: Option<OffsetDateTime>,
    // Joins
    doc_key: Uuid,
    tags: Vec<Tag>,
    blog: Option<Json<Blog>>,
    // User
    user_name: String,
    user_username: String,
    user_avatar_id: Option<Uuid>,
    user_avatar_hex: Option<String>,
    user_public_flags: i32,
}

/// Returns the story metadata object.
#[tracing::instrument(
    name = "GRPC get_story_metadata",
    skip_all,
    fields(
        user_id = tracing::field::Empty,
        request
    ),
    err
)]
pub async fn get_story_metadata(
    client: &GrpcService,
    request: Request<GetStoryMetadataRequest>,
) -> Result<Response<GetStoryMetadataResponse>, Status> {
    let request = request.into_inner();
    let maybe_story_slug = request.id_or_slug.clone();
    let maybe_story_id = request.id_or_slug.parse::<i64>().ok();
    let user_id_str = request.user_id;

    tracing::Span::current().record("user_id", &user_id_str);

    let user_id = user_id_str
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`user_id` is invalid"))?;

    let story = {
        if let Some(story_id) = maybe_story_id {
            sqlx::query_file_as!(
                Story,
                "queries/grpc/get_story_metadata/by_id.sql",
                story_id,
                user_id
            )
            .fetch_one(&client.db_pool)
            .await
        } else {
            sqlx::query_file_as!(
                Story,
                "queries/grpc/get_story_metadata/by_slug.sql",
                maybe_story_slug,
                user_id
            )
            .fetch_one(&client.db_pool)
            .await
        }
    }
    .map_err(|error| {
        if matches!(error, sqlx::Error::RowNotFound) {
            Status::not_found("Story not found")
        } else {
            error!("database error: {error:?}");

            Status::internal("Database error")
        }
    })?;

    Ok(Response::new(GetStoryMetadataResponse {
        id: story.id.to_string(),
        title: story.title,
        slug: story.slug,
        description: story.description,
        splash_id: story.splash_id.map(|value| value.to_string()),
        splash_hex: story.splash_hex,
        doc_key: story.doc_key.to_string(),
        category: story.category,
        user_id: story.user_id.to_string(),
        role: story.role,
        age_restriction: story.age_restriction as i32,
        license: story.license as i32,
        visibility: story.visibility as i32,
        disable_comments: story.disable_comments,
        disable_public_revision_history: story.disable_public_revision_history,
        disable_toc: story.disable_toc,
        canonical_url: story.canonical_url,
        seo_description: story.seo_description,
        seo_title: story.seo_title,
        preview_image: story.preview_image.map(|value| value.to_string()),
        created_at: to_iso8601(&story.created_at),
        edited_at: story.edited_at.map(|value| to_iso8601(&value)),
        published_at: story.published_at.map(|value| to_iso8601(&value)),
        first_published_at: story.first_published_at.map(|value| to_iso8601(&value)),
        deleted_at: story.deleted_at.map(|value| to_iso8601(&value)),
        user: Some(BareUser {
            id: story.user_id.to_string(),
            name: story.user_name,
            username: story.user_username,
            avatar_id: story.user_avatar_id.map(|value| value.to_string()),
            avatar_hex: story.user_avatar_hex,
            public_flags: story.user_public_flags as u32,
        }),
        tags: story
            .tags
            .iter()
            .map(|tag| StoryTag {
                id: tag.id.clone(),
                name: tag.name.clone(),
            })
            .collect::<Vec<_>>(),
        blog: story.blog.map(|value| BareBlog {
            id: value.id.to_string(),
            name: value.name.clone(),
            slug: value.slug.clone(),
            domain: value.domain.clone(),
            logo_id: value.logo_id.map(|value| value.to_string()),
            logo_hex: value.logo_hex.clone(),
        }),
    }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::test_grpc_service;
    use sqlx::{
        PgPool,
        Row,
    };
    use tonic::{
        Code,
        Request,
    };

    // By ID

    #[sqlx::test(fixtures("get_story_metadata"))]
    async fn can_return_a_story_metadata_by_id(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_story_metadata(Request::new(GetStoryMetadataRequest {
                        id_or_slug: 3_i64.to_string(),
                        user_id: 2_i64.to_string(),
                    }))
                    .await;

                assert!(response.is_ok());
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_story_metadata"))]
    async fn can_return_an_unpublished_story_metadata_by_id(pool: PgPool) {
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
                    .get_story_metadata(Request::new(GetStoryMetadataRequest {
                        id_or_slug: 3_i64.to_string(),
                        user_id: 2_i64.to_string(),
                    }))
                    .await;

                assert!(response.is_ok());
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_story_metadata"))]
    async fn can_return_a_soft_deleted_story_metadata_by_id(pool: PgPool) {
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
                    .get_story_metadata(Request::new(GetStoryMetadataRequest {
                        id_or_slug: 3_i64.to_string(),
                        user_id: 2_i64.to_string(),
                    }))
                    .await;

                assert!(response.is_ok());
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_story_metadata"))]
    async fn can_return_a_story_metadata_with_blog_by_id(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, _user_id| async move {
                let response = client
                    .get_story_metadata(Request::new(GetStoryMetadataRequest {
                        id_or_slug: 3_i64.to_string(),
                        user_id: 2_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `None` initially.
                assert!(response.blog.is_none());

                // Add the story to the blog.
                let result = sqlx::query(
                    r#"
WITH inserted_blog AS (
    INSERT INTO blogs (name, slug, user_id)
    VALUES ('Test blog', 'test-blog', $1)
    RETURNING id
)
INSERT INTO blog_stories (story_id, blog_id)
VALUES ($2, (SELECT id FROM inserted_blog))
"#,
                )
                .bind(2_i64)
                .bind(3_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_story_metadata(Request::new(GetStoryMetadataRequest {
                        id_or_slug: 3_i64.to_string(),
                        user_id: 2_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should return the blog.
                assert!(response.blog.is_some());
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_story_metadata"))]
    async fn can_return_a_story_metadata_for_a_blog_owner_by_id(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Create a blog.
                let result = sqlx::query(
                    r#"
WITH inserted_blog AS (
    INSERT INTO blogs (name, slug, user_id)
    VALUES ('Test blog', 'test-blog', $1)
    RETURNING id
)
INSERT INTO blog_editors (user_id, blog_id, accepted_at)
VALUES ($2, (SELECT id FROM inserted_blog), NOW())
RETURNING blog_id
"#,
                )
                .bind(user_id.unwrap())
                .bind(2_i64)
                .fetch_one(&pool)
                .await
                .unwrap();

                let blog_id = result.get::<i64, _>("blog_id");

                // Add the story to the blog.
                let result = sqlx::query(
                    r#"
INSERT INTO blog_stories (story_id, blog_id)
VALUES ($1, $2)
"#,
                )
                .bind(3_i64)
                .bind(blog_id)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_story_metadata(Request::new(GetStoryMetadataRequest {
                        id_or_slug: 3_i64.to_string(),
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should return the correct role.
                assert_eq!(response.role, "blog-member".to_string());
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_story_metadata"))]
    async fn can_return_a_story_metadata_for_a_blog_editor_by_id(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Create a blog.
                let result = sqlx::query(
                    r#"
WITH inserted_blog AS (
    INSERT INTO blogs (name, slug, user_id)
    VALUES ('Test blog', 'test-blog', $1)
    RETURNING id
)
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($2, (SELECT id FROM inserted_blog))
RETURNING blog_id
"#,
                )
                .bind(2_i64)
                .bind(user_id.unwrap())
                .fetch_one(&pool)
                .await
                .unwrap();

                let blog_id = result.get::<i64, _>("blog_id");

                // Add the story to the blog.
                let result = sqlx::query(
                    r#"
INSERT INTO blog_stories (story_id, blog_id)
VALUES ($1, $2)
"#,
                )
                .bind(3_i64)
                .bind(blog_id)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_story_metadata(Request::new(GetStoryMetadataRequest {
                        id_or_slug: 3_i64.to_string(),
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await;

                // Should throw as the editor has not been accepted yet.
                assert_eq!(response.unwrap_err().code(), Code::NotFound);

                // Accept the story.
                let result = sqlx::query(
                    r#"
UPDATE blog_editors
SET accepted_at = NOW()
WHERE user_id = $1
"#,
                )
                .bind(user_id.unwrap())
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_story_metadata(Request::new(GetStoryMetadataRequest {
                        id_or_slug: 3_i64.to_string(),
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should return the correct role.
                assert_eq!(response.role, "blog-member".to_string());
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_story_metadata"))]
    async fn can_return_a_story_metadata_for_a_contributor_by_id(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Add the current user as contributor.
                let result = sqlx::query(
                    r#"
INSERT INTO story_contributors (user_id, story_id, role, accepted_at)
VALUES ($1, $2, 'viewer', NOW())
"#,
                )
                .bind(user_id.unwrap())
                .bind(3_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_story_metadata(Request::new(GetStoryMetadataRequest {
                        id_or_slug: 3_i64.to_string(),
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await;

                assert!(response.is_ok());
                assert_eq!(response.unwrap().into_inner().role, "viewer".to_string());
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_story_metadata"))]
    async fn can_reject_a_story_metadata_by_id_request_for_an_invalid_user_id(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_story_metadata(Request::new(GetStoryMetadataRequest {
                        id_or_slug: 3_i64.to_string(),
                        user_id: 12345.to_string(),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_story_metadata"))]
    async fn can_reject_a_story_metadata_by_id_request_for_a_pending_contributor(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Add the current user as contributor.
                let result = sqlx::query(
                    r#"
INSERT INTO story_contributors (user_id, story_id, role)
VALUES ($1, $2, 'viewer')
"#,
                )
                .bind(user_id.unwrap())
                .bind(3_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_story_metadata(Request::new(GetStoryMetadataRequest {
                        id_or_slug: 3_i64.to_string(),
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_story_metadata"))]
    async fn should_not_return_a_soft_deleted_story_metadata_for_a_contributor_by_id(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Add the current user as contributor.
                let result = sqlx::query(
                    r#"
INSERT INTO story_contributors (user_id, story_id, role, accepted_at)
VALUES ($1, $2, 'viewer', NOW())
"#,
                )
                .bind(user_id.unwrap())
                .bind(3_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

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
                    .get_story_metadata(Request::new(GetStoryMetadataRequest {
                        id_or_slug: 3_i64.to_string(),
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_story_metadata"))]
    async fn should_not_return_a_soft_deleted_story_metadata_for_a_blog_owner_by_id(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Create a blog.
                let result = sqlx::query(
                    r#"
WITH inserted_blog AS (
    INSERT INTO blogs (name, slug, user_id)
    VALUES ('Test blog', 'test-blog', $1)
    RETURNING id
)
INSERT INTO blog_editors (user_id, blog_id, accepted_at)
VALUES ($2, (SELECT id FROM inserted_blog), NOW())
RETURNING blog_id
"#,
                )
                .bind(user_id.unwrap())
                .bind(2_i64)
                .fetch_one(&pool)
                .await
                .unwrap();

                let blog_id = result.get::<i64, _>("blog_id");

                // Add the story to the blog.
                let result = sqlx::query(
                    r#"
INSERT INTO blog_stories (story_id, blog_id)
VALUES ($1, $2)
"#,
                )
                .bind(3_i64)
                .bind(blog_id)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

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
                    .get_story_metadata(Request::new(GetStoryMetadataRequest {
                        id_or_slug: 3_i64.to_string(),
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_story_metadata"))]
    async fn should_not_return_a_soft_deleted_story_metadata_for_a_blog_editor_by_id(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Create a blog.
                let result = sqlx::query(
                    r#"
WITH inserted_blog AS (
    INSERT INTO blogs (name, slug, user_id)
    VALUES ('Test blog', 'test-blog', $1)
    RETURNING id
)
INSERT INTO blog_editors (user_id, blog_id, accepted_at)
VALUES ($2, (SELECT id FROM inserted_blog), NOW())
RETURNING blog_id
"#,
                )
                .bind(2_i64)
                .bind(user_id.unwrap())
                .fetch_one(&pool)
                .await
                .unwrap();

                let blog_id = result.get::<i64, _>("blog_id");

                // Add the story to the blog.
                let result = sqlx::query(
                    r#"
INSERT INTO blog_stories (story_id, blog_id)
VALUES ($1, $2)
"#,
                )
                .bind(3_i64)
                .bind(blog_id)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

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
                    .get_story_metadata(Request::new(GetStoryMetadataRequest {
                        id_or_slug: 3_i64.to_string(),
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    // By slug

    #[sqlx::test(fixtures("get_story_metadata"))]
    async fn can_return_a_story_metadata_by_slug(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_story_metadata(Request::new(GetStoryMetadataRequest {
                        id_or_slug: "some-story".to_string(),
                        user_id: 2_i64.to_string(),
                    }))
                    .await;

                assert!(response.is_ok());
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_story_metadata"))]
    async fn can_return_an_unpublished_story_metadata_by_slug(pool: PgPool) {
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
                    .get_story_metadata(Request::new(GetStoryMetadataRequest {
                        id_or_slug: "some-story".to_string(),
                        user_id: 2_i64.to_string(),
                    }))
                    .await;

                assert!(response.is_ok());
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_story_metadata"))]
    async fn can_return_a_soft_deleted_story_metadata_by_slug(pool: PgPool) {
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
                    .get_story_metadata(Request::new(GetStoryMetadataRequest {
                        id_or_slug: "some-story".to_string(),
                        user_id: 2_i64.to_string(),
                    }))
                    .await;

                assert!(response.is_ok());
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_story_metadata"))]
    async fn can_return_a_story_metadata_with_blog_by_slug(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, _user_id| async move {
                let response = client
                    .get_story_metadata(Request::new(GetStoryMetadataRequest {
                        id_or_slug: "some-story".to_string(),
                        user_id: 2_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `None` initially.
                assert!(response.blog.is_none());

                // Add the story to the blog.
                let result = sqlx::query(
                    r#"
WITH inserted_blog AS (
    INSERT INTO blogs (name, slug, user_id)
    VALUES ('Test blog', 'test-blog', $1)
    RETURNING id
)
INSERT INTO blog_stories (story_id, blog_id)
VALUES ($2, (SELECT id FROM inserted_blog))
"#,
                )
                .bind(2_i64)
                .bind(3_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_story_metadata(Request::new(GetStoryMetadataRequest {
                        id_or_slug: "some-story".to_string(),
                        user_id: 2_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should return the blog.
                assert!(response.blog.is_some());
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_story_metadata"))]
    async fn can_return_a_story_metadata_for_a_blog_owner_by_slug(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Create a blog.
                let result = sqlx::query(
                    r#"
WITH inserted_blog AS (
    INSERT INTO blogs (name, slug, user_id)
    VALUES ('Test blog', 'test-blog', $1)
    RETURNING id
)
INSERT INTO blog_editors (user_id, blog_id, accepted_at)
VALUES ($2, (SELECT id FROM inserted_blog), NOW())
RETURNING blog_id
"#,
                )
                .bind(user_id.unwrap())
                .bind(2_i64)
                .fetch_one(&pool)
                .await
                .unwrap();

                let blog_id = result.get::<i64, _>("blog_id");

                // Add the story to the blog.
                let result = sqlx::query(
                    r#"
INSERT INTO blog_stories (story_id, blog_id)
VALUES ($1, $2)
"#,
                )
                .bind(3_i64)
                .bind(blog_id)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_story_metadata(Request::new(GetStoryMetadataRequest {
                        id_or_slug: "some-story".to_string(),
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should return the correct role.
                assert_eq!(response.role, "blog-member".to_string());
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_story_metadata"))]
    async fn can_return_a_story_metadata_for_a_blog_editor_by_slug(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Create a blog.
                let result = sqlx::query(
                    r#"
WITH inserted_blog AS (
    INSERT INTO blogs (name, slug, user_id)
    VALUES ('Test blog', 'test-blog', $1)
    RETURNING id
)
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($2, (SELECT id FROM inserted_blog))
RETURNING blog_id
"#,
                )
                .bind(2_i64)
                .bind(user_id.unwrap())
                .fetch_one(&pool)
                .await
                .unwrap();

                let blog_id = result.get::<i64, _>("blog_id");

                // Add the story to the blog.
                let result = sqlx::query(
                    r#"
INSERT INTO blog_stories (story_id, blog_id)
VALUES ($1, $2)
"#,
                )
                .bind(3_i64)
                .bind(blog_id)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_story_metadata(Request::new(GetStoryMetadataRequest {
                        id_or_slug: "some-story".to_string(),
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await;

                // Should throw as the editor has not been accepted yet.
                assert_eq!(response.unwrap_err().code(), Code::NotFound);

                // Accept the story.
                let result = sqlx::query(
                    r#"
UPDATE blog_editors
SET accepted_at = NOW()
WHERE user_id = $1
"#,
                )
                .bind(user_id.unwrap())
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_story_metadata(Request::new(GetStoryMetadataRequest {
                        id_or_slug: "some-story".to_string(),
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should return the correct role.
                assert_eq!(response.role, "blog-member".to_string());
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_story_metadata"))]
    async fn can_return_a_story_metadata_for_a_contributor_by_slug(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Add the current user as contributor.
                let result = sqlx::query(
                    r#"
INSERT INTO story_contributors (user_id, story_id, role, accepted_at)
VALUES ($1, $2, 'viewer', NOW())
"#,
                )
                .bind(user_id.unwrap())
                .bind(3_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_story_metadata(Request::new(GetStoryMetadataRequest {
                        id_or_slug: "some-story".to_string(),
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await;

                assert!(response.is_ok());
                assert_eq!(response.unwrap().into_inner().role, "viewer".to_string());
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_story_metadata"))]
    async fn can_reject_a_story_metadata_by_slug_request_for_an_invalid_user_id(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_story_metadata(Request::new(GetStoryMetadataRequest {
                        id_or_slug: "some-story".to_string(),
                        user_id: 12345.to_string(),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_story_metadata"))]
    async fn can_reject_a_story_metadata_by_slug_request_for_a_pending_contributor(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Add the current user as contributor.
                let result = sqlx::query(
                    r#"
INSERT INTO story_contributors (user_id, story_id, role)
VALUES ($1, $2, 'viewer')
"#,
                )
                .bind(user_id.unwrap())
                .bind(3_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_story_metadata(Request::new(GetStoryMetadataRequest {
                        id_or_slug: "some-story".to_string(),
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_story_metadata"))]
    async fn should_not_return_a_soft_deleted_story_metadata_for_a_contributor_by_slug(
        pool: PgPool,
    ) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Add the current user as contributor.
                let result = sqlx::query(
                    r#"
INSERT INTO story_contributors (user_id, story_id, role, accepted_at)
VALUES ($1, $2, 'viewer', NOW())
"#,
                )
                .bind(user_id.unwrap())
                .bind(3_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

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
                    .get_story_metadata(Request::new(GetStoryMetadataRequest {
                        id_or_slug: "some-story".to_string(),
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_story_metadata"))]
    async fn should_not_return_a_soft_deleted_story_metadata_for_a_blog_owner_by_slug(
        pool: PgPool,
    ) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Create a blog.
                let result = sqlx::query(
                    r#"
WITH inserted_blog AS (
    INSERT INTO blogs (name, slug, user_id)
    VALUES ('Test blog', 'test-blog', $1)
    RETURNING id
)
INSERT INTO blog_editors (user_id, blog_id, accepted_at)
VALUES ($2, (SELECT id FROM inserted_blog), NOW())
RETURNING blog_id
"#,
                )
                .bind(user_id.unwrap())
                .bind(2_i64)
                .fetch_one(&pool)
                .await
                .unwrap();

                let blog_id = result.get::<i64, _>("blog_id");

                // Add the story to the blog.
                let result = sqlx::query(
                    r#"
INSERT INTO blog_stories (story_id, blog_id)
VALUES ($1, $2)
"#,
                )
                .bind(3_i64)
                .bind(blog_id)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

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
                    .get_story_metadata(Request::new(GetStoryMetadataRequest {
                        id_or_slug: "some-story".to_string(),
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_story_metadata"))]
    async fn should_not_return_a_soft_deleted_story_metadata_for_a_blog_editor_by_slug(
        pool: PgPool,
    ) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Create a blog.
                let result = sqlx::query(
                    r#"
WITH inserted_blog AS (
    INSERT INTO blogs (name, slug, user_id)
    VALUES ('Test blog', 'test-blog', $1)
    RETURNING id
)
INSERT INTO blog_editors (user_id, blog_id, accepted_at)
VALUES ($2, (SELECT id FROM inserted_blog), NOW())
RETURNING blog_id
"#,
                )
                .bind(2_i64)
                .bind(user_id.unwrap())
                .fetch_one(&pool)
                .await
                .unwrap();

                let blog_id = result.get::<i64, _>("blog_id");

                // Add the story to the blog.
                let result = sqlx::query(
                    r#"
INSERT INTO blog_stories (story_id, blog_id)
VALUES ($1, $2)
"#,
                )
                .bind(3_i64)
                .bind(blog_id)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

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
                    .get_story_metadata(Request::new(GetStoryMetadataRequest {
                        id_or_slug: "some-story".to_string(),
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }
}
