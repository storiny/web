use crate::{
    constants::{
        blog_domain_regex::BLOG_DOMAIN_REGEX,
        domain_verification_key::DOMAIN_VERIFICATION_TXT_RECORD_KEY,
    },
    error::{
        AppError,
        FormErrorResponse,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    AppState,
    HmacSha1,
};
use actix_web::{
    post,
    web,
    HttpResponse,
};
use actix_web_validator::Json;
use hex::encode as encode_hex;
use hmac::Mac;
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::Row;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    blog_id: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(regex = "BLOG_DOMAIN_REGEX")]
    #[validate(length(min = 3, max = 512, message = "Invalid domain length"))]
    domain: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct Response {
    code: String,
}

#[post("/v1/me/blogs/{blog_id}/settings/domain/code-request")]
#[tracing::instrument(
    name = "POST /v1/me/blogs/{blog_id}/settings/domain/code-request",
    skip_all,
    fields(
        user = user.id().ok(),
        blog_id = %path.blog_id,
        payload
    ),
    err
)]
async fn post(
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

    // Check blog and permissions.
    let result = sqlx::query(
        r#"
WITH domain_check AS (
    SELECT EXISTS (
        SELECT FROM blogs
        WHERE
            domain = $3
            AND id <> $2
    ) AS "found"
), redundant_check AS (
    SELECT EXISTS (
        SELECT FROM blogs
        WHERE
            id = $2
            AND domain IS NOT NULL
    ) AS "redundant"
)
SELECT
	(SELECT "found" FROM domain_check),
	(SELECT "redundant" FROM redundant_check)
FROM blogs
WHERE
    id = $2
    AND user_id = $1
    AND deleted_at IS NULL
"#,
    )
    .bind(user_id)
    .bind(blog_id)
    .bind(&payload.domain)
    .fetch_one(&data.db_pool)
    .await
    .map_err(|error| {
        if matches!(error, sqlx::Error::RowNotFound) {
            AppError::ToastError(ToastErrorResponse::new(None, "Unknown blog"))
        } else {
            AppError::SqlxError(error)
        }
    })?;

    // Check for duplicate domain.
    if result.get::<bool, _>("found") {
        return Err(AppError::FormError(FormErrorResponse::new(
            None,
            vec![("domain", "This domain is already connected to another blog")],
        )));
    }

    // Check for redundant domain.
    if result.get::<bool, _>("redundant") {
        return Err(AppError::ToastError(ToastErrorResponse::new(
            None,
            "This blog already has a domain connected to it",
        )));
    }

    let secret = &data.config.domain_verification_secret;
    let mut mac = HmacSha1::new_from_slice(secret.as_bytes())
        .map_err(|error| AppError::InternalError(error.to_string()))?;
    let fragment = format!("{}:{blog_id}", payload.domain);

    mac.update(fragment.as_bytes());

    let result = mac.finalize();

    Ok(HttpResponse::Ok().json(Response {
        code: format!(
            "{DOMAIN_VERIFICATION_TXT_RECORD_KEY}={}",
            encode_hex(result.into_bytes())
        ),
    }))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_form_error_response,
        assert_toast_error_response,
        init_app_for_test,
        res_to_string,
    };
    use actix_web::test;
    use sqlx::PgPool;

    #[sqlx::test]
    async fn can_request_domain_verification_code(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-slug".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{blog_id}/settings/domain/code-request"
            ))
            .set_json(Request {
                domain: "test.com".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Response>(&res_to_string(res).await).unwrap();

        assert!(json.code.starts_with(DOMAIN_VERIFICATION_TXT_RECORD_KEY));

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_code_request_for_a_deleted_blog(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

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

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{blog_id}/settings/domain/code-request"
            ))
            .set_json(Request {
                domain: "test.com".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Unknown blog").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_code_request_for_a_duplicate_domain(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Insert blogs.
        let result = sqlx::query(
            r#"
WITH duplicate_blog AS (
    INSERT INTO blogs (name, slug, domain, user_id)
    VALUES ($1, $2, $3, $5)
)
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $4, $5)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("one".to_string())
        .bind("test.com".to_string())
        .bind("two".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{blog_id}/settings/domain/code-request"
            ))
            .set_json(Request {
                domain: "test.com".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(
            res,
            vec![("domain", "This domain is already connected to another blog")],
        )
        .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_code_request_for_a_redundant_domain(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Insert a blog with domain.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, domain, user_id)
VALUES ($1, $2, $3, $4)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-slug".to_string())
        .bind("test.com".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{blog_id}/settings/domain/code-request"
            ))
            .set_json(Request {
                domain: "test.com".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "This blog already has a domain connected to it").await;

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_code_request_for_an_unknown_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-slug".to_string())
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blogs/{blog_id}/settings/domain/code-request"
            ))
            .set_json(Request {
                domain: "test.com".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Unknown blog").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_code_request_for_an_invalid_domain(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/settings/domain/code-request",
                12345
            ))
            .set_json(Request {
                domain: "12345678".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());

        Ok(())
    }
}
