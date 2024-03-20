use crate::{
    constants::{
        blog_slug_regex::BLOG_SLUG_REGEX,
        reserved_keywords::RESERVED_KEYWORDS,
        resource_limit::ResourceLimit,
    },
    error::{
        AppError,
        FormErrorResponse,
        ToastErrorResponse,
    },
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
use actix_web_validator::Json;
use serde::{
    Deserialize,
    Serialize,
};
use slugify::slugify;
use sqlx::Row;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(length(min = 3, max = 32, message = "Invalid name length"))]
    name: String,
    #[validate(regex = "BLOG_SLUG_REGEX")]
    #[validate(length(min = 3, max = 24, message = "Invalid slug length"))]
    slug: String,
}

#[post("/v1/me/blogs")]
#[tracing::instrument(
    name = "POST /v1/me/blogs",
    skip_all,
    fields(
        user_id = user.id().ok(),
        name = %payload.name,
        slug = %payload.slug
    ),
    err
)]
async fn post(
    payload: Json<Request>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;

    if !check_resource_limit(&data.redis, ResourceLimit::CreateBlog, user_id).await? {
        return Err(ToastErrorResponse::new(
            Some(StatusCode::TOO_MANY_REQUESTS),
            "Daily limit exceeded for creating blogs. Try again tomorrow.",
        )
        .into());
    }

    let name = &payload.name;
    let slug = slugify!(&payload.slug, separator = "-", max_length = 24);

    // Check if slug is reserved.
    if RESERVED_KEYWORDS.contains(&slug.as_str()) {
        return Err(FormErrorResponse::new(
            Some(StatusCode::FORBIDDEN),
            vec![("slug", "This slug is not available")],
        )
        .into());
    }

    // Check if the slug contain only numbers.
    if slug.chars().all(|c| c.is_ascii_digit()) {
        return Err(FormErrorResponse::new(
            None,
            vec![("slug", "Slug must contain at least one non-digit character")],
        )
        .into());
    }

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    // Check if the user can create a blog.
    let result = sqlx::query(
        r#"
SELECT CASE
    WHEN (
        SELECT COUNT(*) FROM blogs
        WHERE user_id = $1 AND deleted_at IS NULL
    ) >= 1
        THEN FALSE
    ELSE TRUE
END AS "can_create_blog"
"#,
    )
    .bind(user_id)
    .fetch_one(&mut *txn)
    .await?;

    if !result.get::<bool, _>("can_create_blog") {
        return Err(ToastErrorResponse::new(
            None,
            "A Storiny+ membership is required to create more blogs",
        )
        .into());
    }

    // TODO: Insert without plus features on stable release.
    match sqlx::query(
        r#"
INSERT INTO blogs (name, slug, user_id, has_plus_features)
VALUES ($1, $2, $3, TRUE)
"#,
    )
    .bind(name)
    .bind(slug)
    .bind(user_id)
    .execute(&mut *txn)
    .await
    {
        Ok(_) => {
            incr_resource_limit(&data.redis, ResourceLimit::CreateBlog, user_id).await?;

            txn.commit().await?;

            Ok(HttpResponse::Created().finish())
        }
        Err(error) => {
            if let Some(db_err) = error.as_database_error() {
                let error_kind = db_err.kind();

                // Blog slug is already in use.
                if matches!(error_kind, sqlx::error::ErrorKind::UniqueViolation) {
                    return Err(AppError::FormError(FormErrorResponse::new(
                        None,
                        vec![("slug", "This slug is already in use")],
                    )));
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

    mod serial {
        use super::*;
        use crate::test_utils::{
            assert_form_error_response,
            assert_toast_error_response,
        };

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_create_a_blog(ctx: &mut RedisTestContext, pool: PgPool) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri("/v1/me/blogs")
                .set_json(Request {
                    name: "Test blog".to_string(),
                    slug: "test-blog".to_string(),
                })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Blog should be present in the database.
            let result = sqlx::query(
                r#"
SELECT EXISTS (
    SELECT FROM blogs
    WHERE user_id = $1
)
"#,
            )
            .bind(user_id.unwrap())
            .fetch_one(&mut *conn)
            .await?;

            assert!(result.get::<bool, _>("exists"));

            // Should also increment the resource limit.
            let result =
                get_resource_limit(&ctx.redis_pool, ResourceLimit::CreateBlog, user_id.unwrap())
                    .await;

            assert_eq!(result, 1);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_a_blog_on_exceeding_the_resource_limit(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

            exceed_resource_limit(&ctx.redis_pool, ResourceLimit::CreateBlog, user_id.unwrap())
                .await;

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri("/v1/me/blogs")
                .set_json(Request {
                    name: "Test blog".to_string(),
                    slug: "test-blog".to_string(),
                })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert_eq!(res.status(), StatusCode::TOO_MANY_REQUESTS);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_a_blog_with_duplicate_slug(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

            // Insert a blog.
            let result = sqlx::query(
                r#"
WITH inserted_user AS (
	INSERT INTO users (name, username, email)
	VALUES ('Blog owner', 'blog_owner', 'blog_owner@example.com')
    RETURNING id
)
INSERT INTO blogs (name, slug, user_id)
VALUES ('Sample blog', 'test-blog', (SELECT id FROM inserted_user))
"#,
            )
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri("/v1/me/blogs")
                .set_json(Request {
                    name: "Test blog".to_string(),
                    slug: "test-blog".to_string(),
                })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_client_error());
            assert_form_error_response(res, vec![("slug", "This slug is already in use")]).await;

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_overflowing_blogs(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

            // Insert a blog.
            let result = sqlx::query(
                r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ('Sample blog 1', 'test-blog-1', $1)
"#,
            )
            .bind(user_id.unwrap())
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri("/v1/me/blogs")
                .set_json(Request {
                    name: "Test blog 2".to_string(),
                    slug: "test-blog-2".to_string(),
                })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_client_error());
            assert_toast_error_response(
                res,
                "A Storiny+ membership is required to create more blogs",
            )
            .await;

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_invalid_slugs(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

            let req = test::TestRequest::post()
                .cookie(cookie.clone().unwrap())
                .uri("/v1/me/blogs")
                .set_json(Request {
                    name: "Test blog".to_string(),
                    slug: "12345678".to_string(),
                })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_client_error());
            assert_form_error_response(
                res,
                vec![("slug", "Slug must contain at least one non-digit character")],
            )
            .await;

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri("/v1/me/blogs")
                .set_json(Request {
                    name: "Test blog".to_string(),
                    slug: "editors".to_string(),
                })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_client_error());
            assert_form_error_response(res, vec![("slug", "This slug is not available")]).await;

            Ok(())
        }
    }
}
