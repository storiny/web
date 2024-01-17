use crate::{
    error::{
        AppError,
        ToastErrorResponse,
    },
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
    AppState,
};
use actix_web::{
    post,
    put,
    web,
    HttpResponse,
};
use actix_web_validator::Json;
use apalis::prelude::Storage;
use futures::future;
use lockable::AsyncLimit;
use nanoid::nanoid;
use serde::{
    Deserialize,
    Serialize,
};
use slugify::slugify;
use sqlx::{
    Postgres,
    Row,
    Transaction,
};
use tracing::debug;
use validator::Validate;

/// The maximum number of retries before a random fixed-length ID suffix is used
/// for the story slug generation procedure.
const MAX_SLUG_GENERATE_ATTEMPTS: u8 = 10;

#[derive(Deserialize, Validate)]
struct Fragments {
    story_id: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(range(min = 1, max = 12_000, message = "Invalid word count"))]
    word_count: u16,
}

/// Generates a unique slug for the story.
///
/// * `txn` - A Postgres transaction.
/// * `story_id` - The ID of the story.
/// * `title` - The title of the story.
async fn generate_story_slug<'a>(
    txn: &mut Transaction<'a, Postgres>,
    story_id: &i64,
    title: &str,
) -> Result<String, sqlx::Error> {
    let character_set: [char; 36] = [
        '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h',
        'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    ];

    // Use a larger ID length for "Untitled story" as it is the default title
    // used for the stories.
    let mut id_length = if title == "Untitled story" { 9 } else { 3 };
    let mut slug_retries: u8 = 0;
    let slugged_title = slugify!(&title, separator = "-", max_length = 64);
    let mut story_slug = format!("{}-{}", slugged_title, nanoid!(id_length, &character_set));

    while match sqlx::query(
        r#"
SELECT 1 FROM stories
WHERE slug = $1
"#,
    )
    .bind(&story_slug)
    .fetch_one(&mut **txn)
    .await
    {
        Ok(_) => true,
        Err(error) => match error {
            sqlx::Error::RowNotFound => false,
            _ => return Err(error),
        },
    } {
        if slug_retries < MAX_SLUG_GENERATE_ATTEMPTS {
            id_length += 1;
            slug_retries += 1;

            // Generate a new slug with bigger ID suffix.
            story_slug = format!("{}-{}", slugged_title, nanoid!(id_length, &character_set));
        } else {
            // Use the `story_id` as the suffix when we run out of all
            // the slug generation attempts.
            story_slug = format!("{}-{}", slugged_title, story_id);
        }
    }

    Ok(story_slug)
}

/// Publish a new story.
#[post("/v1/me/stories/{story_id}/publish")]
#[tracing::instrument(
    name = "POST /v1/me/stories/{story_id}/publish",
    skip_all,
    fields(
        user_id = user.id().ok(),
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

    let story = sqlx::query(
        r#"
SELECT title FROM stories
WHERE
    user_id = $1
    AND id = $2
    AND published_at IS NULL
    AND deleted_at IS NULL
"#,
    )
    .bind(user_id)
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

    match sqlx::query(
        r#"
UPDATE stories
SET
    published_at = NOW(),
    slug = $3,
    word_count = $4
WHERE
    user_id = $1
    AND id = $2
    AND published_at IS NULL
    AND deleted_at IS NULL
"#,
    )
    .bind(user_id)
    .bind(story_id)
    .bind(&story_slug)
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

            txn.commit().await?;

            Ok(HttpResponse::NoContent().finish())
        }
    }
}

/// Edit a published story.
#[put("/v1/me/stories/{story_id}/publish")]
#[tracing::instrument(
    name = "PUT /v1/me/stories/{story_id}/publish",
    skip_all,
    fields(
        user_id = user.id().ok(),
        story_id = %path.story_id,
        word_count = %payload.word_count
    ),
    err
)]
async fn put(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    payload: Json<Request>,
    user: Identity,
    realm_map: RealmData,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
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

    // Soft-delete the old document if a newer modified version of the original document is
    // available for the story,
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
    WHERE story_id = $2
)
UPDATE stories
SET
    edited_at = NOW(),
    word_count = $3
WHERE
    user_id = $1
    AND id = $2
    AND published_at IS NOT NULL
    AND deleted_at IS NULL
"#,
    )
    .bind(user_id)
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
    use time::OffsetDateTime;

    // Publish a new story.

    #[sqlx::test]
    async fn can_publish_a_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) =
            init_app_for_test(services![post, put], pool, true, false, None).await;

        // Insert a draft.
        let result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/publish", 2))
            .set_json(Request { word_count: 25_u16 })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

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
                .expect("Notify job not found")
                .into_iter()
                .filter_map(|(_, data)| serde_json::from_str::<CachedJob>(&data).ok())
                .map(|item| item.job)
                .collect::<Vec<_>>()
        }

        let story_add_by_user_jobs =
            get_notify_jobs_by_name(NOTIFY_STORY_ADD_BY_USER_JOB_NAME).await;
        let story_add_by_tag_jobs = get_notify_jobs_by_name(NOTIFY_STORY_ADD_BY_TAG_JOB_NAME).await;

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

    #[sqlx::test]
    async fn should_not_publish_an_already_published_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) =
            init_app_for_test(services![post, put], pool, true, false, None).await;

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

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/publish", 2))
            .set_json(Request { word_count: 25_u16 })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story not found").await;

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_publish_a_soft_deleted_draft(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) =
            init_app_for_test(services![post, put], pool, true, false, None).await;

        // Insert a soft-deleted draft.
        let result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id, deleted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/publish", 2))
            .set_json(Request { word_count: 25_u16 })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story not found").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_an_unknown_draft(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) =
            init_app_for_test(services![post, put], pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/publish", 12345))
            .set_json(Request { word_count: 25_u16 })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story not found").await;

        Ok(())
    }

    // Edit a story.

    #[sqlx::test]
    async fn can_edit_a_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) =
            init_app_for_test(services![post, put], pool, true, false, None).await;

        // Insert a published story with an editable document.
        let result = sqlx::query(
            r#"
WITH inserted_story AS (
    INSERT INTO stories (id, user_id, published_at)
    VALUES ($1, $2, NOW())
    RETURNING id
)
INSERT INTO documents (story_id, is_editable)
VALUES ($1, TRUE)
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::put()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/publish", 2))
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

        let req = test::TestRequest::put()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/publish", 2))
            .set_json(Request { word_count: 25_u16 })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story does not exist or has not been edited yet").await;

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_edit_an_unpublished_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) =
            init_app_for_test(services![post, put], pool, true, false, None).await;

        // Insert an unpublished story.
        let result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::put()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/publish", 2))
            .set_json(Request { word_count: 25_u16 })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story does not exist or has not been edited yet").await;

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_edit_a_soft_deleted_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) =
            init_app_for_test(services![post, put], pool, true, false, None).await;

        // Insert a soft-deleted story.
        let result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id, deleted_at, published_at)
VALUES ($1, $2, NOW(), NOW())
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::put()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/publish", 2))
            .set_json(Request { word_count: 25_u16 })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story does not exist or has not been edited yet").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_an_unknown_story_when_editing(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) =
            init_app_for_test(services![post, put], pool, true, false, None).await;

        let req = test::TestRequest::put()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/publish", 12345))
            .set_json(Request { word_count: 25_u16 })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story does not exist or has not been edited yet").await;

        Ok(())
    }
}
