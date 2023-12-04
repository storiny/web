use crate::{
    constants::{
        reading_session::MAXIMUM_READING_SESSION_DURATION,
        redis_namespaces::RedisNamespace,
    },
    grpc::{
        defs::{
            story_def::v1::{
                GetStoryRequest,
                GetStoryResponse,
            },
            tag_def::v1::Tag as StoryTag,
            user_def::v1::{
                BareStatus,
                ExtendedUser,
            },
        },
        service::GrpcService,
    },
};
use redis::AsyncCommands;
use sqlx::FromRow;
use time::OffsetDateTime;
use tonic::{
    Request,
    Response,
    Status,
};
use uuid::Uuid;

#[derive(sqlx::Type, Debug)]
struct Tag {
    id: i64,
    name: String,
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
    // Joins
    doc_key: Uuid,
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
pub async fn get_story(
    client: &GrpcService,
    request: Request<GetStoryRequest>,
) -> Result<Response<GetStoryResponse>, Status> {
    let request = request.into_inner();
    let maybe_story_slug = request.id_or_slug.clone();
    let maybe_story_id = request.id_or_slug.parse::<i64>().ok();

    let current_user_id = {
        if let Some(user_id) = request.current_user_id {
            let value = user_id
                .parse::<i64>()
                .map_err(|_| Status::invalid_argument("`current_user_id` is invalid"))?;

            Some(value)
        } else {
            None
        }
    };

    let pg_pool = &client.db_pool;
    let mut txn = pg_pool
        .begin()
        .await
        .map_err(|_| Status::internal("Database error"))?;

    let result = {
        if let Some(user_id) = current_user_id {
            if let Some(story_id) = maybe_story_id {
                sqlx::query_file_as!(
                    Story,
                    "queries/grpc/get_story/logged_in_by_id.sql",
                    story_id,
                    user_id
                )
                .fetch_one(&mut *txn)
                .await
            } else {
                sqlx::query_file_as!(
                    Story,
                    "queries/grpc/get_story/logged_in_by_slug.sql",
                    maybe_story_slug,
                    user_id
                )
                .fetch_one(&mut *txn)
                .await
            }
        } else {
            if let Some(story_id) = maybe_story_id {
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
    };

    if let Err(ref err) = result {
        if matches!(err, sqlx::Error::RowNotFound) {
            return Err(Status::not_found("Story not found"));
        }

        return Err(Status::internal("Database error"));
    }

    let story = result.unwrap();

    // Insert a history record for the current user
    if let Some(user_id) = current_user_id {
        if story.published_at.is_some() && story.deleted_at.is_none() {
            sqlx::query(
                r#"
                INSERT INTO histories (user_id, story_id) 
                VALUES ($1, $2)
                "#,
            )
            .bind(user_id)
            .bind(story.id)
            .execute(&mut *txn)
            .await
            .map_err(|_| Status::internal("Database error"))?;
        }
    }

    txn.commit()
        .await
        .map_err(|_| Status::internal("Database error"))?;

    let reading_session_token = Uuid::new_v4();

    // Start a reading session. We place this block after the database transaction and mute any
    // possible errors raised from Redis as we don't want to block access to the story due to
    // cache errors.
    let redis_pool = &client.redis_pool;
    if let Ok(ref mut redis_conn) = redis_pool.get().await {
        let cache_key = format!(
            "{}:{}:{reading_session_token}",
            RedisNamespace::ReadingSession.to_string(),
            story.id,
        );
        let result = redis_conn
            .set_ex::<_, _, ()>(&cache_key, 0, MAXIMUM_READING_SESSION_DURATION as usize)
            .await;

        if result.is_err() {
            log::error!(
                "unable to create a reading session for {}: {:?}",
                story.id,
                result.unwrap_err()
            );
        }
    };

    Ok(Response::new(GetStoryResponse {
        id: story.id.to_string(),
        title: story.title,
        slug: story.slug,
        description: story.description,
        splash_id: story.splash_id.and_then(|value| Some(value.to_string())),
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
        preview_image: story
            .preview_image
            .and_then(|value| Some(value.to_string())),
        created_at: story.created_at.to_string(),
        edited_at: story.edited_at.and_then(|value| Some(value.to_string())),
        published_at: story.published_at.and_then(|value| Some(value.to_string())),
        first_published_at: story
            .first_published_at
            .and_then(|value| Some(value.to_string())),
        deleted_at: story.deleted_at.and_then(|value| Some(value.to_string())),
        user: Some(ExtendedUser {
            id: story.user_id.to_string(),
            name: story.user_name,
            username: story.user_username,
            rendered_bio: story.user_rendered_bio,
            avatar_id: story
                .user_avatar_id
                .and_then(|value| Some(value.to_string())),
            avatar_hex: story.user_avatar_hex,
            public_flags: story.user_public_flags as u32,
            is_private: story.user_is_private,
            location: story.user_location,
            created_at: story.user_created_at.to_string(),
            follower_count: story.user_follower_count as u32,
            status: if story.user_has_status {
                Some(BareStatus {
                    emoji: story.user_status_emoji,
                    text: story.user_status_text,
                    expires_at: story
                        .user_status_expires_at
                        .and_then(|value| Some(value.to_string())),
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
    use tonic::Request;

    mod serial {
        use super::*;

        // Logged-out

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_story_by_id(_ctx: &mut RedisTestContext, pool: PgPool) {
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

                    // Should increment the `view_count`
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

                    // Reading session should be present in the cache
                    let mut redis_conn = redis_pool.get().await.unwrap();
                    let cache_key = format!(
                        "{}:{}:{}",
                        RedisNamespace::ReadingSession.to_string(),
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
        async fn can_return_unpublished_story_by_id(_ctx: &mut RedisTestContext, pool: PgPool) {
            test_grpc_service(
                pool,
                false,
                Box::new(|mut client, pool, _, _| async move {
                    // Unpublish the story
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
        async fn can_return_soft_deleted_story_by_id(_ctx: &mut RedisTestContext, pool: PgPool) {
            test_grpc_service(
                pool,
                false,
                Box::new(|mut client, pool, _, _| async move {
                    // Soft-delete the story
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
        async fn can_return_story_by_slug(_ctx: &mut RedisTestContext, pool: PgPool) {
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

                    // Should increment the `view_count`
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
        async fn can_return_unpublished_story_by_slug(_ctx: &mut RedisTestContext, pool: PgPool) {
            test_grpc_service(
                pool,
                false,
                Box::new(|mut client, pool, _, _| async move {
                    // Unpublish the story
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

                    // Should not increment the `view_count`
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
        async fn can_return_soft_deleted_story_by_slug(_ctx: &mut RedisTestContext, pool: PgPool) {
            test_grpc_service(
                pool,
                false,
                Box::new(|mut client, pool, _, _| async move {
                    // Soft-delete the story
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

                    // Should increment the `view_count`
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

        // Logged-in

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("get_story"))]
        async fn can_return_story_by_id_when_logged_in(_ctx: &mut RedisTestContext, pool: PgPool) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, redis_pool, user_id| async move {
                    let response = client
                        .get_story(Request::new(GetStoryRequest {
                            id_or_slug: 3_i64.to_string(),
                            current_user_id: user_id.and_then(|value| Some(value.to_string())),
                        }))
                        .await;

                    assert!(response.is_ok());

                    // Should also insert a history record
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

                    // Should increment the `view_count`
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

                    // Reading session should be present in the cache
                    let mut redis_conn = redis_pool.get().await.unwrap();
                    let cache_key = format!(
                        "{}:{}:{}",
                        RedisNamespace::ReadingSession.to_string(),
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
        async fn can_return_unpublished_story_by_id_when_logged_in(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, _, user_id| async move {
                    // Unpublish the story
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
                            current_user_id: user_id.and_then(|value| Some(value.to_string())),
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
        async fn can_return_soft_deleted_story_by_id_when_logged_in(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, _, user_id| async move {
                    // Soft-delete the story
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
                            current_user_id: user_id.and_then(|value| Some(value.to_string())),
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
        async fn can_return_story_by_slug_when_logged_in(
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
                            current_user_id: user_id.and_then(|value| Some(value.to_string())),
                        }))
                        .await;

                    assert!(response.is_ok());

                    // Should increment the `view_count`
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
        async fn can_return_unpublished_story_by_slug_when_logged_in(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, _, user_id| async move {
                    // Unpublish the story
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
                            current_user_id: user_id.and_then(|value| Some(value.to_string())),
                        }))
                        .await;

                    assert!(response.is_ok());

                    // Should not increment the `view_count`
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
        async fn can_return_soft_deleted_story_by_slug_when_logged_in(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, _, user_id| async move {
                    // Soft-delete the story
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
                            current_user_id: user_id.and_then(|value| Some(value.to_string())),
                        }))
                        .await;

                    assert!(response.is_ok());

                    // Should not increment the `view_count`
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
    }
}
