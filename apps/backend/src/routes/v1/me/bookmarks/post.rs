use crate::{
    constants::{
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

#[post("/v1/me/bookmarks/{story_id}")]
async fn post(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => {
            match path.story_id.parse::<i64>() {
                Ok(story_id) => {
                    if !check_resource_limit(&data.redis, ResourceLimit::BookmarkStory, user_id)
                        .await
                        .unwrap_or_default()
                    {
                        return Ok(HttpResponse::TooManyRequests().body(
                            "Daily limit exceeded for bookmarking stories. Try again tomorrow.",
                        ));
                    }

                    match sqlx::query(
                        r#"
                        INSERT INTO bookmarks(user_id, story_id)
                        VALUES ($1, $2)
                        "#,
                    )
                    .bind(user_id)
                    .bind(story_id)
                    .execute(&data.db_pool)
                    .await
                    {
                        Ok(_) => {
                            let _ = incr_resource_limit(
                                &data.redis,
                                ResourceLimit::BookmarkStory,
                                user_id,
                            )
                            .await;

                            Ok(HttpResponse::Created().finish())
                        }
                        Err(err) => {
                            if let Some(db_err) = err.into_database_error() {
                                match db_err.kind() {
                                    // Do not throw if already bookmarked
                                    sqlx::error::ErrorKind::UniqueViolation => {
                                        Ok(HttpResponse::NoContent().finish())
                                    }
                                    // Target story is not present in the table
                                    sqlx::error::ErrorKind::ForeignKeyViolation => {
                                        Ok(HttpResponse::BadRequest().body("Story does not exist"))
                                    }
                                    _ => {
                                        // Check if the story is soft-deleted or unpublished
                                        if db_err.code().unwrap_or_default()
                                            == SqlState::EntityUnavailable.to_string()
                                        {
                                            Ok(HttpResponse::BadRequest().body("Story being bookmarked is either deleted or unpublished"))
                                        } else {
                                            Ok(HttpResponse::InternalServerError().finish())
                                        }
                                    }
                                }
                            } else {
                                Ok(HttpResponse::InternalServerError().finish())
                            }
                        }
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
    use serial_test::serial;
    use sqlx::{
        PgPool,
        Row,
    };
    use storiny_macros::test_context;

    #[test_context(RedisTestContext)]
    #[sqlx::test(fixtures("bookmark"))]
    #[serial(redis)]
    async fn can_bookmark_a_story(ctx: &mut RedisTestContext, pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/bookmarks/{}", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Bookmark should be present in the database
        let result = sqlx::query(
            r#"
            SELECT EXISTS(
                SELECT 1 FROM bookmarks
                WHERE user_id = $1 AND story_id = $2
            )
            "#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("exists"));

        // Should also increment the resource limit
        let result = get_resource_limit(
            &ctx.redis_pool,
            ResourceLimit::BookmarkStory,
            user_id.unwrap(),
        )
        .await;

        assert_eq!(result, 1);

        Ok(())
    }

    #[test_context(RedisTestContext)]
    #[sqlx::test]
    #[serial(redis)]
    async fn can_reject_bookmark_on_exceeding_the_resource_limit(
        ctx: &mut RedisTestContext,
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let redis_pool = &ctx.redis_pool;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Exceed the resource limit
        exceed_resource_limit(redis_pool, ResourceLimit::BookmarkStory, user_id.unwrap()).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/bookmarks/{}", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert_eq!(res.status(), StatusCode::TOO_MANY_REQUESTS);

        Ok(())
    }

    #[test_context(RedisTestContext)]
    #[sqlx::test(fixtures("bookmark"))]
    #[serial(redis)]
    async fn should_not_throw_when_bookmarking_an_already_bookmarked_story(
        _ctx: &mut RedisTestContext,
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        // Bookmark the story for the first time
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/bookmarks/{}", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Try bookmarking the story again
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/bookmarks/{}", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should not throw
        assert!(res.status().is_success());

        Ok(())
    }

    #[sqlx::test(fixtures("bookmark"))]
    async fn should_not_bookmark_a_soft_deleted_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        // Soft-delete the target story
        let result = sqlx::query(
            r#"
            UPDATE stories
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Try bookmarking the story
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/bookmarks/{}", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(
            res,
            "Story being bookmarked is either deleted or unpublished",
        )
        .await;

        Ok(())
    }

    #[sqlx::test(fixtures("bookmark"))]
    async fn should_not_bookmark_an_unpublished_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        // Unpublish the target story
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

        // Try bookmarking the story
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/bookmarks/{}", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(
            res,
            "Story being bookmarked is either deleted or unpublished",
        )
        .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_bookmark_for_a_missing_story(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/bookmarks/{}", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Story does not exist").await;

        Ok(())
    }
}
