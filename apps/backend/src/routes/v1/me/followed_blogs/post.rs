use crate::{
    constants::resource_limit::ResourceLimit,
    error::AppError,
    middlewares::identity::identity::Identity,
    utils::{
        check_resource_limit::check_resource_limit,
        incr_resource_limit::incr_resource_limit,
    },
    AppState,
};
use actix_web::{
    http::StatusCode,
    post,
    web,
    HttpResponse,
};
use serde::Deserialize;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    blog_id: String,
}

#[post("/v1/me/followed-blogs/{blog_id}")]
#[tracing::instrument(
    name = "POST /v1/me/followed-blogs/{blog_id}",
    skip_all,
    fields(
        user_id = user.id().ok(),
        blog_id = %path.blog_id
    ),
    err
)]
async fn post(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let blog_id = path
        .blog_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid blog ID"))?;

    if !check_resource_limit(&data.redis, ResourceLimit::FollowBlog, user_id).await? {
        return Err(AppError::new_client_error_with_status(
            StatusCode::TOO_MANY_REQUESTS,
            "Daily limit exceeded for following blogs. Try again tomorrow.",
        ));
    }

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    match sqlx::query(
        r#"
INSERT INTO blog_followers (user_id, blog_id)
VALUES ($1, $2)
"#,
    )
    .bind(user_id)
    .bind(blog_id)
    .execute(&mut *txn)
    .await
    {
        Ok(_) => {
            incr_resource_limit(&data.redis, ResourceLimit::FollowBlog, user_id).await?;

            txn.commit().await?;

            Ok(HttpResponse::Created().finish())
        }
        Err(error) => {
            if let Some(db_err) = error.as_database_error() {
                let error_kind = db_err.kind();

                // Do not throw if the blog is already followed.
                if matches!(error_kind, sqlx::error::ErrorKind::UniqueViolation) {
                    return Ok(HttpResponse::NoContent().finish());
                }

                // Target blog is not present in the table.
                if matches!(error_kind, sqlx::error::ErrorKind::ForeignKeyViolation) {
                    return Err(AppError::from("Blog does not exist"));
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
    use actix_web::{
        http::StatusCode,
        test,
    };
    use sqlx::{
        PgPool,
        Row,
    };
    use storiny_macros::test_context;

    #[sqlx::test]
    async fn can_reject_a_blog_follow_request_for_a_missing_blog(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/followed-blogs/{}", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Blog does not exist").await;

        Ok(())
    }

    mod serial {
        use super::*;

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("followed_blog"))]
        async fn can_follow_a_blog(ctx: &mut RedisTestContext, pool: PgPool) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri(&format!("/v1/me/followed-blogs/{}", 2))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Followed blog relation should be present in the database.
            let result = sqlx::query(
                r#"
SELECT EXISTS (
    SELECT 1 FROM blog_followers
    WHERE user_id = $1 AND blog_id = $2
)
"#,
            )
            .bind(user_id.unwrap())
            .bind(2_i64)
            .fetch_one(&mut *conn)
            .await?;

            assert!(result.get::<bool, _>("exists"));

            // Should also increment the resource limit.
            let result =
                get_resource_limit(&ctx.redis_pool, ResourceLimit::FollowBlog, user_id.unwrap())
                    .await;

            assert_eq!(result, 1);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_a_blog_follow_request_on_exceeding_the_resource_limit(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

            exceed_resource_limit(&ctx.redis_pool, ResourceLimit::FollowBlog, user_id.unwrap())
                .await;

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri(&format!("/v1/me/followed-blogs/{}", 2))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert_eq!(res.status(), StatusCode::TOO_MANY_REQUESTS);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("followed_blog"))]
        async fn should_not_throw_when_following_an_already_followed_blog(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

            // Follow the blog for the first time.
            let req = test::TestRequest::post()
                .cookie(cookie.clone().unwrap())
                .uri(&format!("/v1/me/followed-blogs/{}", 2))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Try following the blog again.
            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri(&format!("/v1/me/followed-blogs/{}", 2))
                .to_request();
            let res = test::call_service(&app, req).await;

            // Should not throw.
            assert!(res.status().is_success());

            Ok(())
        }
    }
}
