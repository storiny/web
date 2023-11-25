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
    AppState,
};
use actix_web::{
    post,
    put,
    web,
    HttpResponse,
};
use apalis::prelude::Storage;
use futures::future;
use nanoid::nanoid;
use serde::Deserialize;
use slugify::slugify;
use sqlx::{
    Postgres,
    Row,
    Transaction,
};
use validator::Validate;

/// The maximum number of retries before a random fixed-length ID suffix is used
/// for the story slug generation procedure.
static MAX_SLUG_GENERATE_ATTEMPTS: u8 = 10;

#[derive(Deserialize, Validate)]
struct Fragments {
    story_id: String,
}

// TODO: Handle publishing and editing logic (with resource limit)

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
    let character_set: [char; 16] = [
        '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'a', 'b', 'c', 'd', 'e', 'f',
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
        Err(kind) => match kind {
            sqlx::Error::RowNotFound => false,
            _ => return Err(kind),
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

// Publish a new story
#[post("/v1/me/stories/{story_id}/publish")]
async fn post(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
    notify_story_add_by_user_job_storage: web::Data<JobStorage<NotifyStoryAddByUserJob>>,
    notify_story_add_by_tag_job_storage: web::Data<JobStorage<NotifyStoryAddByTagJob>>,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => {
            match path.story_id.parse::<i64>() {
                Ok(story_id) => {
                    let pg_pool = &data.db_pool;
                    let mut txn = pg_pool.begin().await?;

                    match sqlx::query(
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
                    {
                        Ok(story) => {
                            let story_slug = generate_story_slug(
                                &mut txn,
                                &story_id,
                                &story.get::<String, _>("title"),
                            )
                            .await?;

                            match sqlx::query(
                                r#"
                                UPDATE stories
                                SET
                                    published_at = now(),
                                    slug = $3
                                WHERE
                                    user_id = $1
                                    AND id = $2
                                    AND published_at IS NULL
                                    AND deleted_at IS NULL
                                "#,
                            )
                            .bind(user_id)
                            .bind(story_id)
                            .bind(story_slug)
                            .execute(&mut *txn)
                            .await?
                            .rows_affected()
                            {
                                0 => Ok(HttpResponse::BadRequest()
                                    .json(ToastErrorResponse::new("Story not found"))),
                                _ => {
                                    txn.commit().await?;

                                    // Queue push notification jobs
                                    let mut notify_story_add_by_user_job =
                                        (&*notify_story_add_by_user_job_storage.into_inner())
                                            .clone();
                                    let mut notify_story_add_by_tag_job =
                                        (&*notify_story_add_by_tag_job_storage.into_inner())
                                            .clone();

                                    let _ = future::try_join(
                                        notify_story_add_by_user_job
                                            .push(NotifyStoryAddByUserJob { story_id }),
                                        notify_story_add_by_tag_job
                                            .push(NotifyStoryAddByTagJob { story_id }),
                                    )
                                    .await;

                                    Ok(HttpResponse::NoContent().finish())
                                }
                            }
                        }
                        Err(_) => Ok(HttpResponse::BadRequest()
                            .json(ToastErrorResponse::new("Story not found"))),
                    }
                }
                Err(_) => Ok(HttpResponse::BadRequest().body("Invalid story ID")),
            }
        }
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
    }
}

// Edit a published story
#[put("/v1/me/stories/{story_id}/publish")]
async fn put(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => {
            match path.story_id.parse::<i64>() {
                Ok(story_id) => {
                    match sqlx::query(
                        r#"
                        UPDATE stories
                        SET edited_at = now()
                        WHERE
                            user_id = $1
                            AND id = $2
                            AND published_at IS NOT NULL
                            AND deleted_at IS NULL
                        "#,
                    )
                    .bind(user_id)
                    .bind(story_id)
                    .execute(&data.db_pool)
                    .await?
                    .rows_affected()
                    {
                        0 => Ok(HttpResponse::BadRequest()
                            .json(ToastErrorResponse::new("Story not found"))),
                        _ => Ok(HttpResponse::NoContent().finish()),
                    }
                }
                Err(_) => Ok(HttpResponse::BadRequest().body("Invalid story ID")),
            }
        }
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
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

    // Publish a new story

    #[sqlx::test]
    async fn can_publish_a_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) =
            init_app_for_test(services![post, put], pool, true, false, None).await;

        // Insert a draft
        let result = sqlx::query(
            r#"
            INSERT INTO stories(id, user_id)
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
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Story should get updated in the database
        let result = sqlx::query(
            r#"
            SELECT slug, published_at FROM stories
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

        // Should insert push notification jobs

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
    async fn should_not_publish_already_published_stories(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) =
            init_app_for_test(services![post, put], pool, true, false, None).await;

        // Insert a published story
        let result = sqlx::query(
            r#"
            INSERT INTO stories(id, user_id, published_at)
            VALUES ($1, $2, now())
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
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story not found").await;

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_publish_soft_deleted_drafts(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) =
            init_app_for_test(services![post, put], pool, true, false, None).await;

        // Insert a soft-deleted draft
        let result = sqlx::query(
            r#"
            INSERT INTO stories(id, user_id, deleted_at)
            VALUES ($1, $2, now())
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
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story not found").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_unknown_drafts(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) =
            init_app_for_test(services![post, put], pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/publish", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story not found").await;

        Ok(())
    }

    // Edit a story

    #[sqlx::test]
    async fn can_edit_a_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) =
            init_app_for_test(services![post, put], pool, true, false, None).await;

        // Insert a published story
        let result = sqlx::query(
            r#"
            INSERT INTO stories(id, user_id, published_at)
            VALUES ($1, $2, now())
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
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Story should get updated in the database
        let result = sqlx::query(
            r#"
            SELECT edited_at FROM stories
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("edited_at")
                .is_some()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_edit_unpublished_stories(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) =
            init_app_for_test(services![post, put], pool, true, false, None).await;

        // Insert an unpublished story
        let result = sqlx::query(
            r#"
            INSERT INTO stories(id, user_id)
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
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story not found").await;

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_edit_soft_deleted_stories(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) =
            init_app_for_test(services![post, put], pool, true, false, None).await;

        // Insert a soft-deleted story
        let result = sqlx::query(
            r#"
            INSERT INTO stories(id, user_id, deleted_at, published_at)
            VALUES ($1, $2, now(), now())
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
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story not found").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_unknown_stories(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) =
            init_app_for_test(services![post, put], pool, true, false, None).await;

        let req = test::TestRequest::put()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/publish", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story not found").await;

        Ok(())
    }
}
