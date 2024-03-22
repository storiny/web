use crate::{
    error::{
        AppError,
        ToastErrorResponse,
    },
    grpc::defs::story_def::v1::StoryVisibility,
    jobs::{
        notify::{
            story_add_by_tag::NotifyStoryAddByTagJob,
            story_add_by_user::NotifyStoryAddByUserJob,
        },
        storage::JobStorage,
    },
    middlewares::identity::identity::Identity,
    realms::realm::{
        RealmData,
        RealmDestroyReason,
    },
    utils::generate_story_slug::generate_story_slug,
    AppState,
};
use actix_web::{
    post,
    put,
    web,
    web::Json,
    HttpResponse,
};
use apalis::prelude::Storage;
use futures_util::future;
use lockable::AsyncLimit;
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::Row;
use time::OffsetDateTime;
use tracing::debug;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    blog_id: String,
    story_id: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(range(min = 1, max = 12_000, message = "Invalid word count"))]
    word_count: u16,
}

// Accept a new story or draft.
#[post("/v1/me/blogs/{blog_id}/stories/{story_id}")]
#[tracing::instrument(
    name = "POST /v1/me/blogs/{blog_id}/stories/{story_id}",
    skip_all,
    fields(
        user_id = user.id().ok(),
        blog_id = %path.blog_id,
        story_id = %path.story_id,
        word_count = %payload.word_count
    ),
    err
)]
async fn post(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    payload: Json<Request>,
    user: Identity,
    realm_map: RealmData,
    notify_story_add_by_user_job_storage: web::Data<JobStorage<NotifyStoryAddByUserJob>>,
    notify_story_add_by_tag_job_storage: web::Data<JobStorage<NotifyStoryAddByTagJob>>,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;

    let blog_id = path
        .blog_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid blog ID"))?;

    let story_id = path
        .story_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid story ID"))?;

    let mut realm = realm_map
        .async_lock(story_id, AsyncLimit::no_limit())
        .await
        .map_err(|error| {
            AppError::InternalError(format!("unable to acquire a lock on the realm: {error:?}"))
        })?;

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    let result = sqlx::query(
        r#"
WITH blog_story AS (
    SELECT
        b.is_active,
        s.published_at
    FROM blog_stories AS bs
        INNER JOIN blogs AS b
            ON b.id = bs.blog_id
        INNER JOIN stories AS s
            ON s.id = bs.story_id
    WHERE
        bs.story_id = $2
        AND bs.blog_id = $3
        AND bs.deleted_at IS NULL
        AND bs.accepted_at IS NULL
), blog_as_owner AS (
    SELECT 1 FROM blogs
    WHERE
        id = $3
        AND user_id = $1
        AND EXISTS (SELECT FROM blog_story)
), blog_as_editor AS (
    SELECT 1 FROM blog_editors
    WHERE
        blog_id = $3
        AND user_id = $1
        AND accepted_at IS NOT NULL
        AND deleted_at IS NULL
        AND EXISTS (SELECT FROM blog_story)
        AND NOT EXISTS (
            SELECT FROM blog_as_owner
        )
), sanity_check AS (
    SELECT COALESCE(
        (SELECT TRUE FROM blog_as_owner),
        (SELECT TRUE FROM blog_as_editor)
    ) AS "found"
)
SELECT
    COALESCE(
        (SELECT TRUE FROM blog_as_owner),
        (SELECT TRUE FROM blog_as_editor)
    ) AS "found",
    (SELECT is_active FROM blog_story) AS "is_active",
    (SELECT published_at FROM blog_story) AS "published_at"
"#,
    )
    .bind(user_id)
    .bind(story_id)
    .bind(blog_id)
    .fetch_one(&mut *txn)
    .await?;

    if !result.get::<Option<bool>, _>("found").unwrap_or_default() {
        return Err(AppError::ToastError(ToastErrorResponse::new(
            None,
            "Missing permission or the story is unavailable",
        )));
    }

    if !result
        .get::<Option<bool>, _>("is_active")
        .unwrap_or_default()
    {
        return Err(AppError::ToastError(ToastErrorResponse::new(
            None,
            "This story cannot be published on a locked blog",
        )));
    }

    if result
        .get::<Option<OffsetDateTime>, _>("published_at")
        .is_some()
    {
        // Accept a published story.
        match sqlx::query(
            r#"
UPDATE blog_stories
SET accepted_at = NOW()
WHERE
    blog_id = $1
    AND story_id = $2
"#,
        )
        .bind(blog_id)
        .bind(story_id)
        .execute(&mut *txn)
        .await?
        .rows_affected()
        {
            0 => Err(AppError::from("Unable to accept this story")),
            _ => {
                // Drop the realm.
                if let Some(realm_inner) = realm.value() {
                    debug!("realm is present in the map, destroying");
                    realm_inner
                        .destroy(RealmDestroyReason::StoryPublished)
                        .await;
                }

                txn.commit().await?;

                Ok(HttpResponse::NoContent().finish())
            }
        }
    } else {
        // Accept a draft and publish it.
        let story = sqlx::query(
            r#"
SELECT title FROM stories
WHERE id = $1
"#,
        )
        .bind(story_id)
        .fetch_one(&mut *txn)
        .await
        .map_err(|error| {
            if matches!(error, sqlx::Error::RowNotFound) {
                AppError::ToastError(ToastErrorResponse::new(None, "Story not found"))
            } else {
                AppError::SqlxError(error)
            }
        })?;

        let story_slug =
            generate_story_slug(&mut txn, &story_id, &story.get::<String, _>("title")).await?;

        let story = sqlx::query(
            r#"
WITH accepted_story AS (
    UPDATE blog_stories
    SET accepted_at = NOW()
    WHERE
        blog_id = $2
        AND story_id = $1
)
UPDATE stories
SET
    published_at = NOW(),
    slug = $3,
    word_count = $4
WHERE
    id = $1
RETURNING visibility
"#,
        )
        .bind(story_id)
        .bind(blog_id)
        .bind(&story_slug)
        .bind(payload.word_count as i16)
        .fetch_one(&mut *txn)
        .await
        .map_err(|error| {
            if matches!(error, sqlx::Error::RowNotFound) {
                AppError::ToastError(ToastErrorResponse::new(None, "Story not found"))
            } else {
                AppError::SqlxError(error)
            }
        })?;

        // Drop the realm.
        if let Some(realm_inner) = realm.value() {
            debug!("realm is present in the map, destroying");

            realm_inner
                .destroy(RealmDestroyReason::StoryPublished)
                .await;
        }

        realm.remove();

        if story.get::<i16, _>("visibility") == StoryVisibility::Public as i16 {
            // Queue push notification jobs.
            let mut notify_story_add_by_user_job =
                (*notify_story_add_by_user_job_storage.into_inner()).clone();
            let mut notify_story_add_by_tag_job =
                (*notify_story_add_by_tag_job_storage.into_inner()).clone();

            future::try_join(
                notify_story_add_by_user_job.push(NotifyStoryAddByUserJob { story_id }),
                notify_story_add_by_tag_job.push(NotifyStoryAddByTagJob { story_id }),
            )
            .await
            .map_err(|error| {
                AppError::InternalError(format!("unable to push the jobs: {error:?}"))
            })?;
        }

        txn.commit().await?;

        Ok(HttpResponse::NoContent().finish())
    }
}

/// Edit an already accepted story.
#[put("/v1/me/blogs/{blog_id}/stories/{story_id}")]
#[tracing::instrument(
    name = "PUT /v1/me/blogs/{blog_id}/stories/{story_id}",
    skip_all,
    fields(
        user_id = user.id().ok(),
        blog_id = %path.blog_id,
        story_id = %path.story_id,
        word_count = %payload.word_count
    ),
    err
)]
async fn put(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    payload: actix_web_validator::Json<Request>,
    user: Identity,
    realm_map: RealmData,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;

    let blog_id = path
        .blog_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid blog ID"))?;

    let story_id = path
        .story_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid story ID"))?;

    let mut realm = realm_map
        .async_lock(story_id, AsyncLimit::no_limit())
        .await
        .map_err(|error| {
            AppError::InternalError(format!("unable to acquire a lock on the realm: {error:?}"))
        })?;

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    let result = sqlx::query(
        r#"
WITH blog_story AS (
    SELECT b.is_active
    FROM blog_stories AS bs
        INNER JOIN blogs AS b
            ON b.id = bs.blog_id
        INNER JOIN stories AS s
            ON s.id = bs.story_id
    WHERE
        bs.story_id = $2
        AND bs.blog_id = $3
        AND bs.deleted_at IS NULL
        AND bs.accepted_at IS NOT NULL
), blog_as_owner AS (
    SELECT 1 FROM blogs
    WHERE
        id = $3
        AND user_id = $1
        AND EXISTS (SELECT FROM blog_story)
), blog_as_editor AS (
    SELECT 1 FROM blog_editors
    WHERE
        blog_id = $3
        AND user_id = $1
        AND accepted_at IS NOT NULL
        AND deleted_at IS NULL
        AND EXISTS (SELECT FROM blog_story)
        AND NOT EXISTS (
            SELECT FROM blog_as_owner
        )
), sanity_check AS (
    SELECT COALESCE(
        (SELECT TRUE FROM blog_as_owner),
        (SELECT TRUE FROM blog_as_editor)
    ) AS "found"
)
SELECT
    COALESCE(
        (SELECT TRUE FROM blog_as_owner),
        (SELECT TRUE FROM blog_as_editor)
    ) AS "found",
    (SELECT is_active FROM blog_story) AS "is_active"
"#,
    )
    .bind(user_id)
    .bind(story_id)
    .bind(blog_id)
    .fetch_one(&mut *txn)
    .await?;

    if !result.get::<Option<bool>, _>("found").unwrap_or_default() {
        return Err(AppError::ToastError(ToastErrorResponse::new(
            None,
            "Missing permission or the story is unavailable",
        )));
    }

    if !result
        .get::<Option<bool>, _>("is_active")
        .unwrap_or_default()
    {
        return Err(AppError::ToastError(ToastErrorResponse::new(
            None,
            "This story cannot be published on a locked blog",
        )));
    }

    // Soft-delete the old document if a newer modified version of the original document is
    // available for the story.
    sqlx::query(
        r#"
UPDATE documents
SET story_id = NULL
WHERE
    story_id = $1
    AND is_editable IS FALSE
AND EXISTS (
    SELECT 1 FROM documents d
    WHERE d.story_id = $1
        AND d.is_editable IS TRUE
)
RETURNING id
"#,
    )
    .bind(story_id)
    .fetch_one(&mut *txn)
    .await
    .map_err(|error| {
        if matches!(error, sqlx::Error::RowNotFound) {
            AppError::ToastError(ToastErrorResponse::new(
                None,
                "Story does not exist or has not been edited yet",
            ))
        } else {
            AppError::SqlxError(error)
        }
    })?;

    match sqlx::query(
        r#"
WITH updated_document AS (
    UPDATE documents
    SET is_editable = FALSE
    WHERE story_id = $1
)
UPDATE stories
SET
    edited_at = NOW(),
    word_count = $2
WHERE
    id = $1
"#,
    )
    .bind(story_id)
    .bind(payload.word_count as i16)
    .execute(&mut *txn)
    .await?
    .rows_affected()
    {
        0 => Err(ToastErrorResponse::new(None, "Story not found").into()),
        _ => {
            // Drop the realm.
            if let Some(realm_inner) = realm.value() {
                debug!("realm is present in the map, destroying");

                realm_inner
                    .destroy(RealmDestroyReason::StoryPublished)
                    .await;
            }

            realm.remove();

            txn.commit().await?;

            Ok(HttpResponse::NoContent().finish())
        }
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
    cfg.service(put);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        jobs::notify::{
            story_add_by_tag::NOTIFY_STORY_ADD_BY_TAG_JOB_NAME,
            story_add_by_user::NOTIFY_STORY_ADD_BY_USER_JOB_NAME,
        },
        test_utils::{
            assert_toast_error_response,
            get_redis_pool,
            init_app_for_test,
            RedisTestContext,
        },
    };
    use actix_web::{
        services,
        test,
    };
    use redis::AsyncCommands;
    use sqlx::{
        PgPool,
        Row,
    };
    use std::collections::HashMap;
    use storiny_macros::test_context;
    use time::OffsetDateTime;

    // Accept a new story or draft.

    #[derive(Debug, Deserialize)]
    struct JobData {
        story_id: i64,
    }

    #[derive(Debug, Deserialize)]
    struct CachedJob {
        job: JobData,
    }

    async fn get_notify_jobs_by_name(job_name: &str) -> Vec<JobData> {
        let redis_pool = get_redis_pool();
        let mut redis_conn = redis_pool.get().await.unwrap();

        redis_conn
            .hgetall::<_, HashMap<String, String>>(format!("{}:data", job_name))
            .await
            .expect("unable to get notify jobs")
            .into_iter()
            .filter_map(|(_, data)| serde_json::from_str::<CachedJob>(&data).ok())
            .map(|item| item.job)
            .collect::<Vec<_>>()
    }

    #[sqlx::test]
    async fn should_not_accept_an_already_accepted_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) =
            init_app_for_test(services![post, put], pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        // Insert a published story.
        let result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id, published_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Add story to the blog.
        let result = sqlx::query(
            r#"
INSERT INTO blog_stories (blog_id, story_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(blog_id)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/stories/{}", 2))
            .set_json(Request { word_count: 25_u16 })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Missing permission or the story is unavailable").await;

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_publish_a_soft_deleted_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) =
            init_app_for_test(services![post, put], pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        // Insert a published story.
        let result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id, published_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Add story to the blog with the deleted flag.
        let result = sqlx::query(
            r#"
INSERT INTO blog_stories (blog_id, story_id, deleted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(blog_id)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/stories/{}", 2))
            .set_json(Request { word_count: 25_u16 })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Missing permission or the story is unavailable").await;

        Ok(())
    }

    // Edit an existing story.

    #[sqlx::test]
    async fn can_edit_a_story_as_blog_owner(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) =
            init_app_for_test(services![post, put], pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        // Insert a published story with an editable document.
        let result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (id, name, username, email)
    VALUES ($1, 'Story writer', 'story_writer', 'story_writer@storiny.com')
), inserted_story AS (
    INSERT INTO stories (id, user_id, published_at)
    VALUES ($2, $1, NOW())
)
INSERT INTO documents (story_id, is_editable)
VALUES ($2, TRUE)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Add the user as editor.
        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(1_i64)
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Add story to the blog.
        let result = sqlx::query(
            r#"
INSERT INTO blog_stories (blog_id, story_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(blog_id)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::put()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/stories/{}", 2))
            .set_json(Request { word_count: 25_u16 })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Story should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT word_count, edited_at FROM stories
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("word_count"), 25);
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("edited_at")
                .is_some()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_edit_a_story_as_blog_editor(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) =
            init_app_for_test(services![post, put], pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Blog owner', 'blog_owner', 'blog_owner@storiny.com')
    RETURNING id
)
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, (SELECT id FROM inserted_user))
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        // Insert a published story with an editable document.
        let result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (id, name, username, email)
    VALUES ($1, 'Story writer', 'story_writer', 'story_writer@storiny.com')
), inserted_story AS (
    INSERT INTO stories (id, user_id, published_at)
    VALUES ($2, $1, NOW())
)
INSERT INTO documents (story_id, is_editable)
VALUES ($2, TRUE)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Add the story writer and the current user as editors.
        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id, accepted_at)
VALUES ($1, $3, NOW()), ($2, $3, NULL)
"#,
        )
        .bind(1_i64)
        .bind(user_id.unwrap())
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 2);

        // Add story to the blog.
        let result = sqlx::query(
            r#"
INSERT INTO blog_stories (blog_id, story_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(blog_id)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::put()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/stories/{}", 2))
            .set_json(Request { word_count: 25_u16 })
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should still return an error response as the editor invite has not been accepted yet.
        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Missing permission or the story is unavailable").await;

        // Accept the editor invite.
        let result = sqlx::query(
            r#"
UPDATE blog_editors
SET accepted_at = NOW()
WHERE user_id = $1
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::put()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/stories/{}", 2))
            .set_json(Request { word_count: 25_u16 })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Story should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT word_count, edited_at FROM stories
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("word_count"), 25);
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("edited_at")
                .is_some()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_edit_a_story_not_having_an_editable_document(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) =
            init_app_for_test(services![post, put], pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        // Insert a published story.
        let result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (id, name, username, email)
    VALUES ($1, 'Story writer', 'story_writer', 'story_writer@storiny.com')
)
INSERT INTO stories (id, user_id, published_at)
VALUES ($2, $1, NOW())
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Add the user as editor.
        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(1_i64)
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Add story to the blog.
        let result = sqlx::query(
            r#"
INSERT INTO blog_stories (blog_id, story_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(blog_id)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::put()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/stories/{}", 2))
            .set_json(Request { word_count: 25_u16 })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story does not exist or has not been edited yet").await;

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_edit_a_pending_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) =
            init_app_for_test(services![post, put], pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        // Insert a published story.
        let result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id, published_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Add story to the blog.
        let result = sqlx::query(
            r#"
INSERT INTO blog_stories (blog_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(blog_id)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::put()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/stories/{}", 2))
            .set_json(Request { word_count: 25_u16 })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Missing permission or the story is unavailable").await;

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_edit_a_soft_deleted_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) =
            init_app_for_test(services![post, put], pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        // Insert a published story.
        let result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id, published_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Add story to the blog with the deleted flag.
        let result = sqlx::query(
            r#"
INSERT INTO blog_stories (blog_id, story_id, deleted_at, accepted_at)
VALUES ($1, $2, NOW(), NOW())
"#,
        )
        .bind(blog_id)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::put()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/stories/{}", 2))
            .set_json(Request { word_count: 25_u16 })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Missing permission or the story is unavailable").await;

        Ok(())
    }

    mod serial {
        use super::*;

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_accept_a_draft_as_blog_owner(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (app, cookie, user_id) =
                init_app_for_test(services![post, put], pool, true, false, None).await;

            // Insert a blog.
            let result = sqlx::query(
                r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
            )
            .bind("Sample blog".to_string())
            .bind("sample-blog".to_string())
            .bind(user_id.unwrap())
            .fetch_one(&mut *conn)
            .await?;

            let blog_id = result.get::<i64, _>("id");

            // Insert a draft.
            let result = sqlx::query(
                r#"
WITH inserted_user AS (
    INSERT INTO users (id, name, username, email)
    VALUES ($1, 'Story writer', 'story_writer', 'story_writer@storiny.com')
)
INSERT INTO stories (id, user_id)
VALUES ($2, $1)
"#,
            )
            .bind(1_i64)
            .bind(2_i64)
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            // Add the user as editor.
            let result = sqlx::query(
                r#"
INSERT INTO blog_editors (user_id, blog_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
            )
            .bind(1_i64)
            .bind(blog_id)
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            // Add the draft to the blog.
            let result = sqlx::query(
                r#"
INSERT INTO blog_stories (story_id, blog_id)
VALUES ($1, $2)
"#,
            )
            .bind(2_i64)
            .bind(blog_id)
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri(&format!("/v1/me/blogs/{blog_id}/stories/{}", 2))
                .set_json(Request { word_count: 25_u16 })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Blog story relation should get updated in the database.
            let result = sqlx::query(
                r#"
SELECT accepted_at
FROM blog_stories
WHERE story_id = $1
"#,
            )
            .bind(2_i64)
            .fetch_one(&mut *conn)
            .await?;

            assert!(
                result
                    .get::<Option<OffsetDateTime>, _>("accepted_at")
                    .is_some()
            );

            // Story should get updated in the database.
            let result = sqlx::query(
                r#"
SELECT
    slug,
    published_at,
    word_count
FROM stories
WHERE id = $1
"#,
            )
            .bind(2_i64)
            .fetch_one(&mut *conn)
            .await?;

            assert!(result.get::<Option<String>, _>("slug").is_some());
            assert!(
                result
                    .get::<Option<OffsetDateTime>, _>("published_at")
                    .is_some()
            );
            assert_eq!(result.get::<i32, _>("word_count"), 25);

            // Should insert push notification jobs.

            let story_add_by_user_jobs =
                get_notify_jobs_by_name(NOTIFY_STORY_ADD_BY_USER_JOB_NAME).await;
            let story_add_by_tag_jobs =
                get_notify_jobs_by_name(NOTIFY_STORY_ADD_BY_TAG_JOB_NAME).await;

            assert!(
                story_add_by_user_jobs
                    .iter()
                    .any(|job| job.story_id == 2_i64)
            );
            assert!(
                story_add_by_tag_jobs
                    .iter()
                    .any(|job| job.story_id == 2_i64)
            );

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_accept_a_published_story_as_blog_owner(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (app, cookie, user_id) =
                init_app_for_test(services![post, put], pool, true, false, None).await;

            // Insert a blog.
            let result = sqlx::query(
                r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
            )
            .bind("Sample blog".to_string())
            .bind("sample-blog".to_string())
            .bind(user_id.unwrap())
            .fetch_one(&mut *conn)
            .await?;

            let blog_id = result.get::<i64, _>("id");

            // Insert a published story.
            let result = sqlx::query(
                r#"
WITH inserted_user AS (
    INSERT INTO users (id, name, username, email)
    VALUES ($1, 'Story writer', 'story_writer', 'story_writer@storiny.com')
)
INSERT INTO stories (id, user_id, published_at, first_published_at)
VALUES ($2, $1, NOW(), NOW())
"#,
            )
            .bind(1_i64)
            .bind(2_i64)
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            // Add the user as editor.
            let result = sqlx::query(
                r#"
INSERT INTO blog_editors (user_id, blog_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
            )
            .bind(1_i64)
            .bind(blog_id)
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            // Add the story to the blog.
            let result = sqlx::query(
                r#"
INSERT INTO blog_stories (story_id, blog_id)
VALUES ($1, $2)
"#,
            )
            .bind(2_i64)
            .bind(blog_id)
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri(&format!("/v1/me/blogs/{blog_id}/stories/{}", 2))
                .set_json(Request { word_count: 25_u16 })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Blog story relation should get updated in the database.
            let result = sqlx::query(
                r#"
SELECT accepted_at
FROM blog_stories
WHERE story_id = $1
"#,
            )
            .bind(2_i64)
            .fetch_one(&mut *conn)
            .await?;

            assert!(
                result
                    .get::<Option<OffsetDateTime>, _>("accepted_at")
                    .is_some()
            );

            // Should not insert push notification jobs.

            let story_add_by_user_jobs =
                get_notify_jobs_by_name(NOTIFY_STORY_ADD_BY_USER_JOB_NAME).await;
            let story_add_by_tag_jobs =
                get_notify_jobs_by_name(NOTIFY_STORY_ADD_BY_TAG_JOB_NAME).await;

            assert!(story_add_by_user_jobs.is_empty());
            assert!(story_add_by_tag_jobs.is_empty());

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_accept_a_draft_as_blog_editor(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (app, cookie, user_id) =
                init_app_for_test(services![post, put], pool, true, false, None).await;

            // Insert a blog.
            let result = sqlx::query(
                r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Blog owner', 'blog_owner', 'blog_owner@storiny.com')
    RETURNING id
)
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, (SELECT id FROM inserted_user))
RETURNING id
"#,
            )
            .bind("Sample blog".to_string())
            .bind("sample-blog".to_string())
            .fetch_one(&mut *conn)
            .await?;

            let blog_id = result.get::<i64, _>("id");

            // Insert a draft.
            let result = sqlx::query(
                r#"
WITH inserted_user AS (
    INSERT INTO users (id, name, username, email)
    VALUES ($1, 'Story writer', 'story_writer', 'story_writer@storiny.com')
)
INSERT INTO stories (id, user_id)
VALUES ($2, $1)
"#,
            )
            .bind(1_i64)
            .bind(2_i64)
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            // Add the story writer and the current user as editors.
            let result = sqlx::query(
                r#"
INSERT INTO blog_editors (user_id, blog_id, accepted_at)
VALUES ($1, $3, NOW()), ($2, $3, NULL)
"#,
            )
            .bind(1_i64)
            .bind(user_id.unwrap())
            .bind(blog_id)
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 2);

            // Add the draft to the blog.
            let result = sqlx::query(
                r#"
INSERT INTO blog_stories (story_id, blog_id)
VALUES ($1, $2)
"#,
            )
            .bind(2_i64)
            .bind(blog_id)
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            let req = test::TestRequest::post()
                .cookie(cookie.clone().unwrap())
                .uri(&format!("/v1/me/blogs/{blog_id}/stories/{}", 2))
                .set_json(Request { word_count: 25_u16 })
                .to_request();
            let res = test::call_service(&app, req).await;

            // Should still return an error response as the editor invite has not been accepted yet.
            assert!(res.status().is_client_error());
            assert_toast_error_response(res, "Missing permission or the story is unavailable")
                .await;

            // Accept the editor invite.
            let result = sqlx::query(
                r#"
UPDATE blog_editors
SET accepted_at = NOW()
WHERE user_id = $1
"#,
            )
            .bind(user_id.unwrap())
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri(&format!("/v1/me/blogs/{blog_id}/stories/{}", 2))
                .set_json(Request { word_count: 25_u16 })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Blog story relation should get updated in the database.
            let result = sqlx::query(
                r#"
SELECT accepted_at
FROM blog_stories
WHERE story_id = $1
"#,
            )
            .bind(2_i64)
            .fetch_one(&mut *conn)
            .await?;

            assert!(
                result
                    .get::<Option<OffsetDateTime>, _>("accepted_at")
                    .is_some()
            );

            // Story should get updated in the database.
            let result = sqlx::query(
                r#"
SELECT
    slug,
    published_at,
    word_count
FROM stories
WHERE id = $1
"#,
            )
            .bind(2_i64)
            .fetch_one(&mut *conn)
            .await?;

            assert!(result.get::<Option<String>, _>("slug").is_some());
            assert!(
                result
                    .get::<Option<OffsetDateTime>, _>("published_at")
                    .is_some()
            );
            assert_eq!(result.get::<i32, _>("word_count"), 25);

            // Should insert push notification jobs.

            let story_add_by_user_jobs =
                get_notify_jobs_by_name(NOTIFY_STORY_ADD_BY_USER_JOB_NAME).await;
            let story_add_by_tag_jobs =
                get_notify_jobs_by_name(NOTIFY_STORY_ADD_BY_TAG_JOB_NAME).await;

            assert!(
                story_add_by_user_jobs
                    .iter()
                    .any(|job| job.story_id == 2_i64)
            );
            assert!(
                story_add_by_tag_jobs
                    .iter()
                    .any(|job| job.story_id == 2_i64)
            );

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_accept_a_published_story_as_blog_editor(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (app, cookie, user_id) =
                init_app_for_test(services![post, put], pool, true, false, None).await;

            // Insert a blog.
            let result = sqlx::query(
                r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Blog owner', 'blog_owner', 'blog_owner@storiny.com')
    RETURNING id
)
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, (SELECT id FROM inserted_user))
RETURNING id
"#,
            )
            .bind("Sample blog".to_string())
            .bind("sample-blog".to_string())
            .fetch_one(&mut *conn)
            .await?;

            let blog_id = result.get::<i64, _>("id");

            // Insert a published story.
            let result = sqlx::query(
                r#"
WITH inserted_user AS (
    INSERT INTO users (id, name, username, email)
    VALUES ($1, 'Story writer', 'story_writer', 'story_writer@storiny.com')
)
INSERT INTO stories (id, user_id, published_at, first_published_at)
VALUES ($2, $1, NOW(), NOW())
"#,
            )
            .bind(1_i64)
            .bind(2_i64)
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            // Add the story writer and the current user as editors.
            let result = sqlx::query(
                r#"
INSERT INTO blog_editors (user_id, blog_id, accepted_at)
VALUES ($1, $3, NOW()), ($2, $3, NULL)
"#,
            )
            .bind(1_i64)
            .bind(user_id.unwrap())
            .bind(blog_id)
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 2);

            // Add the story to the blog.
            let result = sqlx::query(
                r#"
INSERT INTO blog_stories (story_id, blog_id)
VALUES ($1, $2)
"#,
            )
            .bind(2_i64)
            .bind(blog_id)
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            let req = test::TestRequest::post()
                .cookie(cookie.clone().unwrap())
                .uri(&format!("/v1/me/blogs/{blog_id}/stories/{}", 2))
                .set_json(Request { word_count: 25_u16 })
                .to_request();
            let res = test::call_service(&app, req).await;

            // Should still return an error response as the editor invite has not been accepted yet.
            assert!(res.status().is_client_error());
            assert_toast_error_response(res, "Missing permission or the story is unavailable")
                .await;

            // Accept the editor invite.
            let result = sqlx::query(
                r#"
UPDATE blog_editors
SET accepted_at = NOW()
WHERE user_id = $1
"#,
            )
            .bind(user_id.unwrap())
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri(&format!("/v1/me/blogs/{blog_id}/stories/{}", 2))
                .set_json(Request { word_count: 25_u16 })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Blog story relation should get updated in the database.
            let result = sqlx::query(
                r#"
SELECT accepted_at
FROM blog_stories
WHERE story_id = $1
"#,
            )
            .bind(2_i64)
            .fetch_one(&mut *conn)
            .await?;

            assert!(
                result
                    .get::<Option<OffsetDateTime>, _>("accepted_at")
                    .is_some()
            );

            // Should not insert push notification jobs.

            let story_add_by_user_jobs =
                get_notify_jobs_by_name(NOTIFY_STORY_ADD_BY_USER_JOB_NAME).await;
            let story_add_by_tag_jobs =
                get_notify_jobs_by_name(NOTIFY_STORY_ADD_BY_TAG_JOB_NAME).await;

            assert!(story_add_by_user_jobs.is_empty());
            assert!(story_add_by_tag_jobs.is_empty());

            Ok(())
        }
    }
}
