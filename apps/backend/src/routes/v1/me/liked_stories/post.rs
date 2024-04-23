use crate::{
    constants::{
        notification_entity_type::NotificationEntityType,
        resource_limit::ResourceLimit,
        sql_states::SqlState,
    },
    error::AppError,
    middlewares::identity::identity::Identity,
    utils::{
        check_resource_limit::check_resource_limit,
        incr_resource_limit::incr_resource_limit,
    },
    AppState,
};
use actix_http::StatusCode;
use actix_web::{
    post,
    web,
    HttpResponse,
};
use serde::Deserialize;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    story_id: String,
}

#[post("/v1/me/liked-stories/{story_id}")]
#[tracing::instrument(
    name = "POST /v1/me/liked-stories/{story_id}",
    skip_all,
    fields(
        user_id = user.id().ok(),
        story_id = %path.story_id
    ),
    err
)]
async fn post(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let story_id = path
        .story_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid story ID"))?;

    if !check_resource_limit(&data.redis, ResourceLimit::LikeStory, user_id).await? {
        return Err(AppError::new_client_error_with_status(
            StatusCode::TOO_MANY_REQUESTS,
            "Daily limit exceeded for liking stories. Try again tomorrow.",
        ));
    }

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    match sqlx::query(
        r#"                        
WITH inserted_story_like AS (
        INSERT INTO story_likes (user_id, story_id)
        VALUES ($1, $2)
        RETURNING TRUE AS "inserted"
    ),
    liked_story AS (
        SELECT user_id FROM stories
        WHERE id = $2
    ),
    inserted_notification AS (
        INSERT INTO notifications (entity_type, entity_id, notifier_id)
        SELECT $3, $2, $1
        WHERE
            EXISTS (SELECT 1 FROM liked_story)
            -- Do not insert the notification if the user likes its own story.
            AND $1 <> (SELECT user_id FROM liked_story)
        RETURNING id
    )
INSERT INTO
    notification_outs (notified_id, notification_id)
SELECT
    (SELECT user_id FROM liked_story),
    (SELECT id FROM inserted_notification)
WHERE
    EXISTS (SELECT 1 FROM liked_story)
    AND EXISTS (SELECT 1 FROM inserted_notification)
"#,
    )
    .bind(user_id)
    .bind(story_id)
    .bind(NotificationEntityType::StoryLike as i16)
    .execute(&mut *txn)
    .await
    {
        Ok(_) => {
            incr_resource_limit(&data.redis, ResourceLimit::LikeStory, user_id).await?;

            txn.commit().await?;

            Ok(HttpResponse::Created().finish())
        }
        Err(error) => {
            if let Some(db_err) = error.as_database_error() {
                let error_kind = db_err.kind();

                // Do not throw if the story is already liked.
                if matches!(error_kind, sqlx::error::ErrorKind::UniqueViolation) {
                    return Ok(HttpResponse::NoContent().finish());
                }

                // Target story is not present in the table.
                if matches!(error_kind, sqlx::error::ErrorKind::ForeignKeyViolation) {
                    return Err(AppError::from("Story does not exist"));
                }

                let error_code = db_err.code().unwrap_or_default();

                // Check if the story is soft-deleted or unpublished.
                if error_code == SqlState::EntityUnavailable.to_string() {
                    return Err(AppError::from(
                        "Story being liked is either deleted or unpublished",
                    ));
                }
            }

            Err(AppError::SqlxError(error))
        }
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_response_body_text,
        exceed_resource_limit,
        get_resource_limit,
        init_app_for_test,
        RedisTestContext,
    };
    use actix_http::StatusCode;
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };
    use storiny_macros::test_context;

    #[sqlx::test(fixtures("liked_story"))]
    async fn should_not_like_a_soft_deleted_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        // Soft-delete the story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Try liking the story.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/liked-stories/{}", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Story being liked is either deleted or unpublished").await;

        Ok(())
    }

    #[sqlx::test(fixtures("liked_story"))]
    async fn should_not_like_an_unpublished_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        // Unpublish the story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Try liking the story.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/liked-stories/{}", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Story being liked is either deleted or unpublished").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_story_like_request_for_a_missing_story(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/liked-stories/{}", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Story does not exist").await;

        Ok(())
    }

    mod serial {
        use super::*;

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("liked_story"))]
        async fn can_like_a_story(ctx: &mut RedisTestContext, pool: PgPool) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri(&format!("/v1/me/liked-stories/{}", 3))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Story like should be present in the database.
            let result = sqlx::query(
                r#"
SELECT EXISTS (
    SELECT 1 FROM story_likes
    WHERE user_id = $1 AND story_id = $2
)
"#,
            )
            .bind(user_id)
            .bind(3_i64)
            .fetch_one(&mut *conn)
            .await?;

            assert!(result.get::<bool, _>("exists"));

            // Should also insert a notification.
            let result = sqlx::query(
                r#"
SELECT EXISTS (
    SELECT 1 FROM notifications
    WHERE entity_id = $1
)
"#,
            )
            .bind(3_i64)
            .fetch_one(&mut *conn)
            .await?;

            assert!(result.get::<bool, _>("exists"));

            // Should also increment the resource limit.
            let result =
                get_resource_limit(&ctx.redis_pool, ResourceLimit::LikeStory, user_id.unwrap())
                    .await;

            assert_eq!(result, 1);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_a_story_like_request_on_exceeding_the_resource_limit(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

            exceed_resource_limit(&ctx.redis_pool, ResourceLimit::LikeStory, user_id.unwrap())
                .await;

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri(&format!("/v1/me/liked-stories/{}", 3))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert_eq!(res.status(), StatusCode::TOO_MANY_REQUESTS);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("liked_story"))]
        async fn should_not_throw_when_liking_an_already_liked_story(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

            // Like the story for the first time.
            let req = test::TestRequest::post()
                .cookie(cookie.clone().unwrap())
                .uri(&format!("/v1/me/liked-stories/{}", 3))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Try liking the story again.
            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri(&format!("/v1/me/liked-stories/{}", 3))
                .to_request();
            let res = test::call_service(&app, req).await;

            // Should not throw.
            assert!(res.status().is_success());

            // Should not insert another notification.
            let result = sqlx::query(
                r#"
SELECT 1 FROM notification_outs
WHERE
    notification_id = (
        SELECT id FROM notifications
        WHERE entity_id = $1
    )
"#,
            )
            .bind(3_i64)
            .fetch_all(&mut *conn)
            .await?;

            assert_eq!(result.len(), 1);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("liked_story"))]
        async fn should_not_insert_a_notification_when_the_user_likes_its_own_story(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

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
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri(&format!("/v1/me/liked-stories/{}", 3))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Story like should be present in the database.
            let result = sqlx::query(
                r#"
SELECT EXISTS (
    SELECT 1 FROM story_likes
    WHERE user_id = $1 AND story_id = $2
)
"#,
            )
            .bind(user_id)
            .bind(3_i64)
            .fetch_one(&mut *conn)
            .await?;

            assert!(result.get::<bool, _>("exists"));

            // Should not insert a notification.
            let result = sqlx::query(
                r#"
SELECT EXISTS (
    SELECT 1 FROM notifications
    WHERE entity_id = $1
)
"#,
            )
            .bind(3_i64)
            .fetch_one(&mut *conn)
            .await?;

            assert!(!result.get::<bool, _>("exists"));

            Ok(())
        }
    }
}
