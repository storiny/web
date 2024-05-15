use crate::{
    constants::{
        blog_slug_regex::BLOG_SLUG_REGEX,
        reserved_keywords::RESERVED_KEYWORDS,
    },
    error::{
        AppError,
        FormErrorResponse,
    },
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_http::StatusCode;
use actix_web::{
    patch,
    web,
    HttpResponse,
};
use actix_web_validator::Json;
use serde::{
    Deserialize,
    Serialize,
};
use slugify::slugify;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    blog_id: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(regex = "BLOG_SLUG_REGEX")]
    #[validate(length(min = 3, max = 24, message = "Invalid slug length"))]
    slug: String,
}

#[patch("/v1/me/blogs/{blog_id}/settings/slug")]
#[tracing::instrument(
    name = "PATCH /v1/me/blogs/{blog_id}/settings/slug",
    skip_all,
    fields(
        user = user.id().ok(),
        blog_id = %path.blog_id,
        payload
    ),
    err
)]
async fn patch(
    payload: Json<Request>,
    data: web::Data<AppState>,
    path: web::Path<Fragments>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let blog_id = path
        .blog_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid blog ID"))?;

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

    match sqlx::query(
        r#"
UPDATE blogs
SET slug = $3
WHERE
    id = $2
    AND user_id = $1
    AND deleted_at IS NULL
"#,
    )
    .bind(user_id)
    .bind(blog_id)
    .bind(slug)
    .execute(&data.db_pool)
    .await
    {
        Ok(result) => match result.rows_affected() {
            0 => Err(AppError::from("The blog does not exist")),
            _ => Ok(HttpResponse::NoContent().finish()),
        },
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
    cfg.service(patch);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_form_error_response,
        assert_response_body_text,
        init_app_for_test,
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test]
    async fn can_update_slug(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id, slug
"#,
        )
        .bind("Sample blog".to_string())
        .bind("initial-slug".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        // Should be `initial-slug` initially.
        assert_eq!(result.get::<String, _>("slug"), "initial-slug".to_string());

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/slug"))
            .set_json(Request {
                slug: "final-slug".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Blog should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT slug
FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<String, _>("slug"), "final-slug".to_string());

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_slug_update_request_for_a_deleted_blog(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

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

        // Delete the blog.
        let result = sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/slug"))
            .set_json(Request {
                slug: "final-slug".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "The blog does not exist").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_slug_update_request_for_a_duplicate_slug(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Insert blogs.
        let result = sqlx::query(
            r#"
WITH duplicate_blog AS (
    INSERT INTO blogs (name, slug, user_id)
    VALUES ($1, $3, $4)
)
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $4)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("initial-slug".to_string())
        .bind("final-slug".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/slug"))
            .set_json(Request {
                slug: "final-slug".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(res, vec![("slug", "This slug is already in use")]).await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_slug_update_request_for_invalid_slugs(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(patch, pool, true, false, None).await;

        let req = test::TestRequest::patch()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/blogs/{}/settings/slug", 12345))
            .set_json(Request {
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

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{}/settings/slug", 12345))
            .set_json(Request {
                slug: "editors".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(res, vec![("slug", "This slug is not available")]).await;

        Ok(())
    }
}
