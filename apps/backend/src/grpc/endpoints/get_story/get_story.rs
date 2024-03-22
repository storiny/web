use crate::{
    constants::{
        reading_session::MAXIMUM_READING_SESSION_DURATION,
        redis_namespaces::RedisNamespace,
    },
    grpc::{
        defs::{
            blog_def::v1::BareBlog,
            story_def::v1::{
                GetStoryRequest,
                GetStoryResponse,
            },
            tag_def::v1::Tag as StoryTag,
            user_def::v1::{
                BareStatus,
                BareUser,
                ExtendedUser,
            },
        },
        service::GrpcService,
    },
    utils::to_iso8601::to_iso8601,
};
use redis::AsyncCommands;
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
    id: i64,
    name: String,
}

#[derive(Debug, Deserialize)]
struct User {
    id: i64,
    name: String,
    username: String,
    avatar_id: Option<Uuid>,
    avatar_hex: Option<String>,
    public_flags: i32,
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
    // SEO
    canonical_url: Option<String>,
    seo_title: Option<String>,
    seo_description: Option<String>,
    preview_image: Option<Uuid>,
    // Stats
    word_count: i32,
    read_count: i32,
    like_count: i32,
    comment_count: i32,
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
    doc_key: Uuid,
    // Joins
    blog: Option<Json<Blog>>,
    contributors: Json<Vec<User>>,
    tags: Vec<Tag>,
    // Boolean flags
    is_bookmarked: bool,
    is_liked: bool,
    // User
    user_name: String,
    user_username: String,
    user_rendered_bio: String,
    user_location: String,
    user_avatar_id: Option<Uuid>,
    user_avatar_hex: Option<String>,
    user_public_flags: i32,
    user_is_private: bool,
    user_created_at: OffsetDateTime,
    user_follower_count: i32,
    // User status
    user_status_emoji: Option<String>,
    user_status_text: Option<String>,
    user_status_expires_at: Option<OffsetDateTime>,
    user_has_status: bool,
    // User boolean flags
    user_is_following: bool,
    user_is_follower: bool,
    user_is_friend: bool,
    user_is_blocked_by_user: bool,
}

/// Returns the story object.
#[tracing::instrument(
    name = "GRPC get_story",
    skip_all,
    fields(
        user_id = tracing::field::Empty,
        request
    ),
    err
)]
pub async fn get_story(
    client: &GrpcService,
    request: Request<GetStoryRequest>,
) -> Result<Response<GetStoryResponse>, Status> {
    let request = request.into_inner();
    let maybe_story_slug = request.id_or_slug.clone();
    let maybe_story_id = request.id_or_slug.parse::<i64>().ok();
    let current_user_id = request
        .current_user_id
        .and_then(|user_id| user_id.parse::<i64>().ok());

    let pg_pool = &client.db_pool;
    let mut txn = pg_pool.begin().await.map_err(|error| {
        error!("unable to begin the transaction: {error:?}");

        Status::internal("Database error")
    })?;

    let story = {
        if let Some(current_user_id) = current_user_id {
            tracing::Span::current().record("user_id", current_user_id);

            if let Some(story_id) = maybe_story_id {
                sqlx::query_file_as!(
                    Story,
                    "queries/grpc/get_story/logged_in_by_id.sql",
                    story_id,
                    current_user_id
                )
                .fetch_one(&mut *txn)
                .await
            } else {
                sqlx::query_file_as!(
                    Story,
                    "queries/grpc/get_story/logged_in_by_slug.sql",
                    maybe_story_slug,
                    current_user_id
                )
                .fetch_one(&mut *txn)
                .await
            }
        } else if let Some(story_id) = maybe_story_id {
            sqlx::query_file_as!(Story, "queries/grpc/get_story/default_by_id.sql", story_id)
                .fetch_one(&mut *txn)
                .await
        } else {
            sqlx::query_file_as!(
                Story,
                "queries/grpc/get_story/default_by_slug.sql",
                maybe_story_slug,
            )
            .fetch_one(&mut *txn)
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

    // Insert a history record for the current user.
    if let Some(current_user_id) = current_user_id {
        if story.published_at.is_some() && story.deleted_at.is_none() {
            sqlx::query(
                r#"
INSERT INTO histories (user_id, story_id) 
VALUES ($1, $2)
-- Update the history if the user has already read the story before.
ON CONFLICT (user_id, story_id) DO UPDATE
SET created_at = NOW()
"#,
            )
            .bind(current_user_id)
            .bind(story.id)
            .execute(&mut *txn)
            .await
            .map_err(|error| {
                error!("unable to insert a history record for the current user: {error:?}");

                Status::internal("Database error")
            })?;
        }
    }

    // Start a reading session.

    let reading_session_token = Uuid::new_v4();

    if story.published_at.is_some() && story.deleted_at.is_none() {
        let redis_pool = &client.redis_pool;

        if let Ok(ref mut redis_conn) = redis_pool.get().await {
            let cache_key = format!(
                "{}:{}:{reading_session_token}",
                RedisNamespace::ReadingSession,
                story.id,
            );

            redis_conn
                .set_ex::<_, _, ()>(&cache_key, 0, MAXIMUM_READING_SESSION_DURATION as u64)
                .await
                .map_err(|error| {
                    error!("unable to start a reading session for the user: {error:?}");

                    Status::internal("Failed to start a reading session")
                })?;
        };
    }

    txn.commit().await.map_err(|error| {
        error!("unable to commit the transaction: {error:?}");

        Status::internal("Database error")
    })?;

    Ok(Response::new(GetStoryResponse {
        id: story.id.to_string(),
        title: story.title,
        slug: story.slug,
        description: story.description,
        splash_id: story.splash_id.map(|value| value.to_string()),
        splash_hex: story.splash_hex,
        doc_key: story.doc_key.to_string(),
        category: story.category,
        user_id: story.user_id.to_string(),
        like_count: story.like_count as u32,
        read_count: story.read_count as u32,
        word_count: story.word_count as u32,
        comment_count: story.comment_count as u32,
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
        user: Some(ExtendedUser {
            id: story.user_id.to_string(),
            name: story.user_name,
            username: story.user_username,
            rendered_bio: story.user_rendered_bio,
            avatar_id: story.user_avatar_id.map(|value| value.to_string()),
            avatar_hex: story.user_avatar_hex,
            public_flags: story.user_public_flags as u32,
            is_private: story.user_is_private,
            location: story.user_location,
            created_at: to_iso8601(&story.user_created_at),
            follower_count: story.user_follower_count as u32,
            status: if story.user_has_status {
                Some(BareStatus {
                    emoji: story.user_status_emoji,
                    text: story.user_status_text,
                    expires_at: story.user_status_expires_at.map(|value| to_iso8601(&value)),
                })
            } else {
                None
            },
            is_self: current_user_id.is_some_and(|user_id| story.user_id == user_id),
            is_following: story.user_is_following,
            is_follower: story.user_is_follower,
            is_friend: story.user_is_friend,
            is_blocked_by_user: story.user_is_blocked_by_user,
        }),
        tags: story
            .tags
            .iter()
            .map(|tag| StoryTag {
                id: tag.id.to_string(),
                name: tag.name.clone(),
            })
            .collect::<Vec<_>>(),
        contributors: story
            .contributors
            .iter()
            .map(|user| BareUser {
                id: user.id.to_string(),
                name: user.name.clone(),
                username: user.username.clone(),
                avatar_id: user.avatar_id.map(|value| value.to_string()),
                avatar_hex: user.avatar_hex.clone(),
                public_flags: user.public_flags as u32,
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
        is_bookmarked: story.is_bookmarked,
        is_liked: story.is_liked,
        reading_session_token: reading_session_token.to_string(),
    }))
}

#[cfg(test)]
mod tests {
    use crate::{
        constants::redis_namespaces::RedisNamespace,
        grpc::defs::story_def::v1::GetStoryRequest,
        test_utils::{
            test_grpc_service,
            RedisTestContext,
        },
    };
    use redis::AsyncCommands;
    use sqlx::{
        PgPool,
        Row,
    };
    use storiny_macros::test_context;
    use time::OffsetDateTime;
    use tonic::Request;

    mod serial {
        use super::*;

        // Logged-out

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_a_story_by_id(_ctx: &mut RedisTestContext, pool: PgPool) {
            test_grpc_service(
                pool,
                false,
                Box::new(|mut client, pool, redis_pool, _| async move {
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: None,
                        }))
                        .await;

                    assert!(response.is_ok());

                    // Should increment the `view_count`.
                    let result = sqlx::query(
                        r#"
SELECT view_count
FROM stories
WHERE id = $1
"#,
                    )
                    .bind(3_i64)
                    .fetch_one(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.get::<i64, _>("view_count"), 1_i64);

                    let response = response.unwrap().into_inner();

                    // Reading session should be present in the cache.
                    let mut redis_conn = redis_pool.get().await.unwrap();
                    let cache_key = format!(
                        "{}:{}:{}",
                        RedisNamespace::ReadingSession,
                        response.id,
                        response.reading_session_token
                    );
                    let result = redis_conn.ttl::<_, i32>(&cache_key).await.unwrap();

                    assert!(result > 0);

                    // Flags should be neutral.
                    assert!(!response.is_liked);
                    assert!(!response.is_bookmarked);

                    let user = response.user.unwrap();

                    assert!(!user.is_following);
                    assert!(!user.is_follower);
                    assert!(!user.is_friend);
                    assert!(!user.is_blocked_by_user);
                    assert!(!user.is_self);

                    assert!(response.blog.is_none());
                    assert!(response.contributors.is_empty());
                }),
            )
            .await;
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_a_story_with_blog_by_id(_ctx: &mut RedisTestContext, pool: PgPool) {
            test_grpc_service(
                pool,
                false,
                Box::new(|mut client, pool, _, _| async move {
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: None,
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `None` initially.
                    assert!(response.blog.is_none());

                    // Add the story to a blog.
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
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: None,
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should still be `None` as the story has not been accepted yet.
                    assert!(response.blog.is_none());

                    // Accept the story.
                    let result = sqlx::query(
                        r#"
UPDATE blog_stories
SET accepted_at = NOW()
WHERE story_id = $1
"#,
                    )
                    .bind(3_i64)
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 1);

                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: None,
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

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_a_story_with_contributors_by_id(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                false,
                Box::new(|mut client, pool, _, _| async move {
                    // Insert some contributors.
                    let result = sqlx::query(
                        r#"
WITH inserted_users AS (
    INSERT INTO users (id, name, username, email)
    VALUES
        ($1, 'Test user 1', 'test_user_1', 'test_user_1@storiny.com'),
        ($2, 'Test user 2', 'test_user_2', 'test_user_2@storiny.com')
)
INSERT INTO story_contributors (user_id, story_id, accepted_at)
VALUES ($1, $3, NOW()), ($2, $3, NOW())
"#,
                    )
                    .bind(5_i64)
                    .bind(6_i64)
                    .bind(3_i64)
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 2);

                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: None,
                        }))
                        .await;

                    let response = response.unwrap().into_inner();

                    assert_eq!(response.contributors.len(), 2);
                }),
            )
            .await;
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_an_unpublished_story_by_id(_ctx: &mut RedisTestContext, pool: PgPool) {
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
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: None,
                        }))
                        .await;

                    assert!(response.is_ok());

                    // Should not increment the `view_count`
                    let result = sqlx::query(
                        r#"
SELECT view_count
FROM stories
WHERE id = $1
"#,
                    )
                    .bind(3_i64)
                    .fetch_one(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.get::<i64, _>("view_count"), 0);
                }),
            )
            .await;
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_a_soft_deleted_story_by_id(_ctx: &mut RedisTestContext, pool: PgPool) {
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
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: None,
                        }))
                        .await;

                    assert!(response.is_ok());

                    // Should not increment the `view_count`.
                    let result = sqlx::query(
                        r#"
SELECT view_count
FROM stories
WHERE id = $1
"#,
                    )
                    .bind(3_i64)
                    .fetch_one(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.get::<i64, _>("view_count"), 0);
                }),
            )
            .await;
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn should_not_include_pending_contributors_in_story_by_id(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                false,
                Box::new(|mut client, pool, _, _| async move {
                    // Insert some contributors.
                    let result = sqlx::query(
                        r#"
WITH inserted_users AS (
    INSERT INTO users (id, name, username, email)
    VALUES
        ($1, 'Test user 1', 'test_user_1', 'test_user_1@storiny.com'),
        ($2, 'Test user 2', 'test_user_2', 'test_user_2@storiny.com')
)
INSERT INTO story_contributors (user_id, story_id, accepted_at)
VALUES ($1, $3, NOW()), ($2, $3, NOW())
"#,
                    )
                    .bind(5_i64)
                    .bind(6_i64)
                    .bind(3_i64)
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 2);

                    // Should return all the contributors initially.
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: None,
                        }))
                        .await;

                    let response = response.unwrap().into_inner();

                    assert_eq!(response.contributors.len(), 2);

                    // Reset one of the contributors.
                    let result = sqlx::query(
                        r#"
UPDATE story_contributors
SET accepted_at = NULL
WHERE user_id = $1
"#,
                    )
                    .bind(5_i64)
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 1);

                    // Should only one contributor.
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: None,
                        }))
                        .await;

                    let response = response.unwrap().into_inner();

                    assert_eq!(response.contributors.len(), 1);
                    assert_eq!(response.contributors[0].id, 6_i64.to_string());
                }),
            )
            .await;
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn should_not_include_soft_deleted_contributors_in_story_by_id(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                false,
                Box::new(|mut client, pool, _, _| async move {
                    // Insert some contributors.
                    let result = sqlx::query(
                        r#"
WITH inserted_users AS (
    INSERT INTO users (id, name, username, email)
    VALUES
        ($1, 'Test user 1', 'test_user_1', 'test_user_1@storiny.com'),
        ($2, 'Test user 2', 'test_user_2', 'test_user_2@storiny.com')
)
INSERT INTO story_contributors (user_id, story_id, accepted_at)
VALUES ($1, $3, NOW()), ($2, $3, NOW())
"#,
                    )
                    .bind(5_i64)
                    .bind(6_i64)
                    .bind(3_i64)
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 2);

                    // Should return all the contributors initially.
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: None,
                        }))
                        .await;

                    let response = response.unwrap().into_inner();

                    assert_eq!(response.contributors.len(), 2);

                    // Soft-delete one of the contributors.
                    let result = sqlx::query(
                        r#"
UPDATE story_contributors
SET deleted_at = NOW()
WHERE user_id = $1
"#,
                    )
                    .bind(5_i64)
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 1);

                    // Should only one contributor.
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: None,
                        }))
                        .await;

                    let response = response.unwrap().into_inner();

                    assert_eq!(response.contributors.len(), 1);
                    assert_eq!(response.contributors[0].id, 6_i64.to_string());
                }),
            )
            .await;
        }

        //

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_a_story_by_slug(_ctx: &mut RedisTestContext, pool: PgPool) {
            test_grpc_service(
                pool,
                false,
                Box::new(|mut client, pool, _, _| async move {
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: None,
                        }))
                        .await;

                    assert!(response.is_ok());

                    // Should increment the `view_count`.
                    let result = sqlx::query(
                        r#"
SELECT view_count
FROM stories
WHERE slug = $1
"#,
                    )
                    .bind("some-story")
                    .fetch_one(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.get::<i64, _>("view_count"), 1_i64);
                }),
            )
            .await;
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_a_story_with_blog_by_slug(_ctx: &mut RedisTestContext, pool: PgPool) {
            test_grpc_service(
                pool,
                false,
                Box::new(|mut client, pool, _, _| async move {
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: None,
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `None` initially.
                    assert!(response.blog.is_none());

                    // Add the story to a blog.
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
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: None,
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should still be `None` as the story has not been accepted yet.
                    assert!(response.blog.is_none());

                    // Accept the story.
                    let result = sqlx::query(
                        r#"
UPDATE blog_stories
SET accepted_at = NOW()
WHERE story_id = $1
"#,
                    )
                    .bind(3_i64)
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 1);

                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: None,
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

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_a_story_with_contributors_by_slug(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                false,
                Box::new(|mut client, pool, _, _| async move {
                    // Insert some contributors.
                    let result = sqlx::query(
                        r#"
WITH inserted_users AS (
    INSERT INTO users (id, name, username, email)
    VALUES
        ($1, 'Test user 1', 'test_user_1', 'test_user_1@storiny.com'),
        ($2, 'Test user 2', 'test_user_2', 'test_user_2@storiny.com')
)
INSERT INTO story_contributors (user_id, story_id, accepted_at)
VALUES ($1, $3, NOW()), ($2, $3, NOW())
"#,
                    )
                    .bind(5_i64)
                    .bind(6_i64)
                    .bind(3_i64)
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 2);

                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: None,
                        }))
                        .await;

                    let response = response.unwrap().into_inner();

                    assert_eq!(response.contributors.len(), 2);
                }),
            )
            .await;
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_an_unpublished_story_by_slug(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
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
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: None,
                        }))
                        .await;

                    assert!(response.is_ok());

                    // Should not increment the `view_count`.
                    let result = sqlx::query(
                        r#"
SELECT view_count
FROM stories
WHERE slug = $1
"#,
                    )
                    .bind("some-story")
                    .fetch_one(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.get::<i64, _>("view_count"), 0);
                }),
            )
            .await;
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_a_soft_deleted_story_by_slug(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
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
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: None,
                        }))
                        .await;

                    assert!(response.is_ok());

                    // Should increment the `view_count`.
                    let result = sqlx::query(
                        r#"
SELECT view_count
FROM stories
WHERE slug = $1
"#,
                    )
                    .bind("some-story")
                    .fetch_one(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.get::<i64, _>("view_count"), 0);
                }),
            )
            .await;
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn should_not_include_pending_contributors_in_story_by_slug(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                false,
                Box::new(|mut client, pool, _, _| async move {
                    // Insert some contributors.
                    let result = sqlx::query(
                        r#"
WITH inserted_users AS (
    INSERT INTO users (id, name, username, email)
    VALUES
        ($1, 'Test user 1', 'test_user_1', 'test_user_1@storiny.com'),
        ($2, 'Test user 2', 'test_user_2', 'test_user_2@storiny.com')
)
INSERT INTO story_contributors (user_id, story_id, accepted_at)
VALUES ($1, $3, NOW()), ($2, $3, NOW())
"#,
                    )
                    .bind(5_i64)
                    .bind(6_i64)
                    .bind(3_i64)
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 2);

                    // Should return all the contributors initially.
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: None,
                        }))
                        .await;

                    let response = response.unwrap().into_inner();

                    assert_eq!(response.contributors.len(), 2);

                    // Reset one of the contributors.
                    let result = sqlx::query(
                        r#"
UPDATE story_contributors
SET accepted_at = NULL
WHERE user_id = $1
"#,
                    )
                    .bind(5_i64)
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 1);

                    // Should only one contributor.
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: None,
                        }))
                        .await;

                    let response = response.unwrap().into_inner();

                    assert_eq!(response.contributors.len(), 1);
                    assert_eq!(response.contributors[0].id, 6_i64.to_string());
                }),
            )
            .await;
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn should_not_include_soft_deleted_contributors_in_story_by_slug(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                false,
                Box::new(|mut client, pool, _, _| async move {
                    // Insert some contributors.
                    let result = sqlx::query(
                        r#"
WITH inserted_users AS (
    INSERT INTO users (id, name, username, email)
    VALUES
        ($1, 'Test user 1', 'test_user_1', 'test_user_1@storiny.com'),
        ($2, 'Test user 2', 'test_user_2', 'test_user_2@storiny.com')
)
INSERT INTO story_contributors (user_id, story_id, accepted_at)
VALUES ($1, $3, NOW()), ($2, $3, NOW())
"#,
                    )
                    .bind(5_i64)
                    .bind(6_i64)
                    .bind(3_i64)
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 2);

                    // Should return all the contributors initially.
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: None,
                        }))
                        .await;

                    let response = response.unwrap().into_inner();

                    assert_eq!(response.contributors.len(), 2);

                    // Soft-delete one of the contributors.
                    let result = sqlx::query(
                        r#"
UPDATE story_contributors
SET deleted_at = NOW()
WHERE user_id = $1
"#,
                    )
                    .bind(5_i64)
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 1);

                    // Should only one contributor.
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: None,
                        }))
                        .await;

                    let response = response.unwrap().into_inner();

                    assert_eq!(response.contributors.len(), 1);
                    assert_eq!(response.contributors[0].id, 6_i64.to_string());
                }),
            )
            .await;
        }

        // Logged-in

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_a_story_by_id_when_logged_in(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, redis_pool, user_id| async move {
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await;

                    assert!(response.is_ok());

                    // Should also insert a history record.
                    let result = sqlx::query(
                        r#"
SELECT EXISTS (
    SELECT 1 FROM histories
    WHERE user_id = $1
)
"#,
                    )
                    .bind(user_id.unwrap())
                    .fetch_one(&pool)
                    .await
                    .unwrap();

                    assert!(result.get::<bool, _>("exists"));

                    // Should increment the `view_count`.
                    let result = sqlx::query(
                        r#"
SELECT view_count
FROM stories
WHERE id = $1
"#,
                    )
                    .bind(3_i64)
                    .fetch_one(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.get::<i64, _>("view_count"), 1_i64);

                    let response = response.unwrap().into_inner();

                    // Reading session should be present in the cache.
                    let mut redis_conn = redis_pool.get().await.unwrap();
                    let cache_key = format!(
                        "{}:{}:{}",
                        RedisNamespace::ReadingSession,
                        response.id,
                        response.reading_session_token
                    );
                    let result = redis_conn.ttl::<_, i32>(&cache_key).await.unwrap();

                    assert!(result > 0);
                }),
            )
            .await;
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_a_story_with_blog_by_id_when_logged_in(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, _, user_id| async move {
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `None` initially.
                    assert!(response.blog.is_none());

                    // Add the story to a blog.
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
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should still be `None` as the story has not been accepted yet.
                    assert!(response.blog.is_none());

                    // Accept the story.
                    let result = sqlx::query(
                        r#"
UPDATE blog_stories
SET accepted_at = NOW()
WHERE story_id = $1
"#,
                    )
                    .bind(3_i64)
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 1);

                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
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

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_an_unpublished_story_by_id_when_logged_in(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, _, user_id| async move {
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
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await;

                    assert!(response.is_ok());

                    // Should not increment the `view_count`.
                    let result = sqlx::query(
                        r#"
SELECT view_count
FROM stories
WHERE id = $1
"#,
                    )
                    .bind(3_i64)
                    .fetch_one(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.get::<i64, _>("view_count"), 0);
                }),
            )
            .await;
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_a_soft_deleted_story_by_id_when_logged_in(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, _, user_id| async move {
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
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await;

                    assert!(response.is_ok());

                    // Should not increment the `view_count`.
                    let result = sqlx::query(
                        r#"
SELECT view_count
FROM stories
WHERE id = $1
"#,
                    )
                    .bind(3_i64)
                    .fetch_one(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.get::<i64, _>("view_count"), 0);
                }),
            )
            .await;
        }

        //

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_is_liked_flag_for_story_by_id_when_logged_in(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, _, user_id| async move {
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `false` initially.
                    assert!(!response.is_liked);

                    // Like the story.
                    let result = sqlx::query(
                        r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2)
"#,
                    )
                    .bind(user_id.unwrap())
                    .bind(3_i64)
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 1);

                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `true`.
                    assert!(response.is_liked);
                }),
            )
            .await;
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_is_bookmarked_flag_for_story_by_id_when_logged_in(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, _, user_id| async move {
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `false` initially.
                    assert!(!response.is_bookmarked);

                    // Bookmark the story.
                    let result = sqlx::query(
                        r#"
INSERT INTO bookmarks (user_id, story_id)
VALUES ($1, $2)
"#,
                    )
                    .bind(user_id.unwrap())
                    .bind(3_i64)
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 1);

                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `true`.
                    assert!(response.is_bookmarked);
                }),
            )
            .await;
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_user_is_following_flag_for_story_by_id_when_logged_in(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, _, user_id| async move {
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `false` initially.
                    assert!(!response.user.unwrap().is_following);

                    // Follow the user.
                    let result = sqlx::query(
                        r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
                    )
                    .bind(user_id.unwrap())
                    .bind(2_i64)
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 1);

                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `true`.
                    assert!(response.user.unwrap().is_following);
                }),
            )
            .await;
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_user_is_follower_flag_for_story_by_id_when_logged_in(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, _, user_id| async move {
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `false` initially.
                    assert!(!response.user.unwrap().is_follower);

                    // Add the user as follower.
                    let result = sqlx::query(
                        r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($2, $1)
"#,
                    )
                    .bind(user_id.unwrap())
                    .bind(2_i64)
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 1);

                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `true`.
                    assert!(response.user.unwrap().is_follower);
                }),
            )
            .await;
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_user_is_friend_flag_for_story_by_id_when_logged_in(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, _, user_id| async move {
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `false` initially.
                    assert!(!response.user.unwrap().is_friend);

                    // Send a friend request to the user.
                    let result = sqlx::query(
                        r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
                    )
                    .bind(user_id.unwrap())
                    .bind(2_i64)
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 1);

                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should still be false as the friend request has not been not accepted yet.
                    assert!(!response.user.unwrap().is_friend);

                    // Accept the friend request.
                    let result = sqlx::query(
                        r#"
UPDATE friends
SET accepted_at = NOW()
WHERE transmitter_id = $1
"#,
                    )
                    .bind(user_id.unwrap())
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 1);

                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `true`.
                    assert!(response.user.unwrap().is_friend);
                }),
            )
            .await;
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_user_is_blocked_by_user_flag_for_story_by_id_when_logged_in(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, _, user_id| async move {
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `false` initially.
                    assert!(!response.user.unwrap().is_blocked_by_user);

                    // Get blocked by the user.
                    let result = sqlx::query(
                        r#"
INSERT INTO blocks (blocker_id, blocked_id)
VALUES ($2, $1)
"#,
                    )
                    .bind(user_id.unwrap())
                    .bind(2_i64)
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 1);

                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `true`.
                    assert!(response.user.unwrap().is_blocked_by_user);
                }),
            )
            .await;
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_is_self_flag_for_story_by_id_when_logged_in(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, _, user_id| async move {
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `false` initially.
                    assert!(!response.user.unwrap().is_self);

                    // Update the writer of the story.
                    let result = sqlx::query(
                        r#"
UPDATE stories
SET user_id = $1
WHERE id = $2
"#,
                    )
                    .bind(user_id.unwrap())
                    .bind(3_i64)
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 1);

                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `true`.
                    assert!(response.user.unwrap().is_self);
                }),
            )
            .await;
        }

        //

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_a_story_by_slug_when_logged_in(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, _, user_id| async move {
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await;

                    assert!(response.is_ok());

                    // Should increment the `view_count`.
                    let result = sqlx::query(
                        r#"
SELECT view_count
FROM stories
WHERE slug = $1
"#,
                    )
                    .bind("some-story")
                    .fetch_one(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.get::<i64, _>("view_count"), 1_i64);
                }),
            )
            .await;
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_a_story_with_blog_by_slug_when_logged_in(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, _, user_id| async move {
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `None` initially.
                    assert!(response.blog.is_none());

                    // Add the story to a blog.
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
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should still be `None` as the story has not been accepted yet.
                    assert!(response.blog.is_none());

                    // Accept the story.
                    let result = sqlx::query(
                        r#"
UPDATE blog_stories
SET accepted_at = NOW()
WHERE story_id = $1
"#,
                    )
                    .bind(3_i64)
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 1);

                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
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

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_an_unpublished_story_by_slug_when_logged_in(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, _, user_id| async move {
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
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await;

                    assert!(response.is_ok());

                    // Should not increment the `view_count`.
                    let result = sqlx::query(
                        r#"
SELECT view_count
FROM stories
WHERE slug = $1
"#,
                    )
                    .bind("some-story")
                    .fetch_one(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.get::<i64, _>("view_count"), 0);
                }),
            )
            .await;
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_a_soft_deleted_story_by_slug_when_logged_in(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, _, user_id| async move {
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
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await;

                    assert!(response.is_ok());

                    // Should not increment the `view_count`.
                    let result = sqlx::query(
                        r#"
SELECT view_count
FROM stories
WHERE slug = $1
"#,
                    )
                    .bind("some-story")
                    .fetch_one(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.get::<i64, _>("view_count"), 0);
                }),
            )
            .await;
        }

        //

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_is_liked_flag_for_story_by_slug_when_logged_in(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, _, user_id| async move {
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `false` initially.
                    assert!(!response.is_liked);

                    // Like the story.
                    let result = sqlx::query(
                        r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2)
"#,
                    )
                    .bind(user_id.unwrap())
                    .bind(3_i64)
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 1);

                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `true`.
                    assert!(response.is_liked);
                }),
            )
            .await;
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_is_bookmarked_flag_for_story_by_slug_when_logged_in(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, _, user_id| async move {
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `false` initially.
                    assert!(!response.is_bookmarked);

                    // Bookmark the story.
                    let result = sqlx::query(
                        r#"
INSERT INTO bookmarks (user_id, story_id)
VALUES ($1, $2)
"#,
                    )
                    .bind(user_id.unwrap())
                    .bind(3_i64)
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 1);

                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `true`.
                    assert!(response.is_bookmarked);
                }),
            )
            .await;
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_user_is_following_flag_for_story_by_slug_when_logged_in(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, _, user_id| async move {
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `false` initially.
                    assert!(!response.user.unwrap().is_following);

                    // Follow the user.
                    let result = sqlx::query(
                        r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
                    )
                    .bind(user_id.unwrap())
                    .bind(2_i64)
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 1);

                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `true`.
                    assert!(response.user.unwrap().is_following);
                }),
            )
            .await;
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_user_is_follower_flag_for_story_by_slug_when_logged_in(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, _, user_id| async move {
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `false` initially.
                    assert!(!response.user.unwrap().is_follower);

                    // Add the user as follower.
                    let result = sqlx::query(
                        r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($2, $1)
"#,
                    )
                    .bind(user_id.unwrap())
                    .bind(2_i64)
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 1);

                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `true`.
                    assert!(response.user.unwrap().is_follower);
                }),
            )
            .await;
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_user_is_friend_flag_for_story_by_slug_when_logged_in(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, _, user_id| async move {
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `false` initially.
                    assert!(!response.user.unwrap().is_friend);

                    // Send a friend request to the user.
                    let result = sqlx::query(
                        r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
                    )
                    .bind(user_id.unwrap())
                    .bind(2_i64)
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 1);

                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should still be false as the friend request has not been not accepted yet.
                    assert!(!response.user.unwrap().is_friend);

                    // Accept the friend request.
                    let result = sqlx::query(
                        r#"
UPDATE friends
SET accepted_at = NOW()
WHERE transmitter_id = $1
"#,
                    )
                    .bind(user_id.unwrap())
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 1);

                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `true`.
                    assert!(response.user.unwrap().is_friend);
                }),
            )
            .await;
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_user_is_blocked_by_user_flag_for_story_by_slug_when_logged_in(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, _, user_id| async move {
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `false` initially.
                    assert!(!response.user.unwrap().is_blocked_by_user);

                    // Get blocked by the user.
                    let result = sqlx::query(
                        r#"
INSERT INTO blocks (blocker_id, blocked_id)
VALUES ($2, $1)
"#,
                    )
                    .bind(user_id.unwrap())
                    .bind(2_i64)
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 1);

                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `true`.
                    assert!(response.user.unwrap().is_blocked_by_user);
                }),
            )
            .await;
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_is_self_flag_for_story_by_slug_when_logged_in(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, _, user_id| async move {
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `false` initially.
                    assert!(!response.user.unwrap().is_self);

                    // Update the writer of the story.
                    let result = sqlx::query(
                        r#"
UPDATE stories
SET user_id = $1
WHERE id = $2
"#,
                    )
                    .bind(user_id.unwrap())
                    .bind(3_i64)
                    .execute(&pool)
                    .await
                    .unwrap();

                    assert_eq!(result.rows_affected(), 1);

                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: "some-story".to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await
                        .unwrap()
                        .into_inner();

                    // Should be `true`.
                    assert!(response.user.unwrap().is_self);
                }),
            )
            .await;
        }

        //

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_update_history_when_reading_the_story_again_when_logged_in(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, _, user_id| async move {
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await;

                    assert!(response.is_ok());

                    // Should insert a history record.
                    let result = sqlx::query(
                        r#"
SELECT created_at FROM histories
WHERE user_id = $1
"#,
                    )
                    .bind(user_id.unwrap())
                    .fetch_one(&pool)
                    .await
                    .unwrap();

                    let previous_created_at = result.get::<OffsetDateTime, _>("created_at");

                    // Read the story again.
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: user_id.map(|value| value.to_string()),
                        }))
                        .await;

                    assert!(response.is_ok());

                    // Should update the history record.
                    let result = sqlx::query(
                        r#"
SELECT created_at FROM histories
WHERE user_id = $1
"#,
                    )
                    .bind(user_id.unwrap())
                    .fetch_one(&pool)
                    .await
                    .unwrap();

                    let current_created_at = result.get::<OffsetDateTime, _>("created_at");

                    assert!(current_created_at > previous_created_at);
                }),
            )
            .await;
        }
    }
}
