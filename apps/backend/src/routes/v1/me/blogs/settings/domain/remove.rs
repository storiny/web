use crate::{
    error::{
        AppError,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_web::{
    delete,
    web,
    HttpResponse,
};
use serde::Deserialize;
use sqlx::Row;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    blog_id: String,
}

#[delete("/v1/me/blogs/{blog_id}/settings/domain")]
#[tracing::instrument(
    name = "DELETE /v1/me/blogs/{blog_id}/settings/domain",
    skip_all,
    fields(
        user = user.id().ok(),
        blog_id = %path.blog_id
    ),
    err
)]
async fn delete(
    data: web::Data<AppState>,
    path: web::Path<Fragments>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let blog_id = path
        .blog_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid blog ID"))?;

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    // Check blog and permissions.
    let result = sqlx::query(
        r#"
SELECT domain
FROM blogs
WHERE
    id = $2
    AND user_id = $1
    AND deleted_at IS NULL
"#,
    )
    .bind(user_id)
    .bind(blog_id)
    .fetch_one(&mut *txn)
    .await
    .map_err(|error| {
        if matches!(error, sqlx::Error::RowNotFound) {
            AppError::ToastError(ToastErrorResponse::new(None, "Unknown blog"))
        } else {
            AppError::SqlxError(error)
        }
    })?;

    // Check if the blog has a domain connected to it.
    if result.get::<Option<String>, _>("domain").is_none() {
        return Err(AppError::ToastError(ToastErrorResponse::new(
            None,
            "This blog does not have a domain connected to it",
        )));
    }

    // Remove domain
    match sqlx::query(
        r#"
UPDATE blogs
SET domain = NULL
WHERE
   id = $1
"#,
    )
    .bind(blog_id)
    .execute(&mut *txn)
    .await?
    .rows_affected()
    {
        0 => Err(AppError::InternalError("blog not found".to_string())),
        _ => {
            txn.commit().await?;
            Ok(HttpResponse::NoContent().finish())
        }
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(delete);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_toast_error_response,
        init_app_for_test,
    };
    use actix_web::test;
    use sqlx::PgPool;

    #[sqlx::test]
    async fn can_remove_domain(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

        // Insert a blog with domain.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, domain, user_id)
VALUES ($1, $2, $3, $4)
RETURNING id, domain
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-slug".to_string())
        .bind("sample.com".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<Option<String>, _>("domain"),
            Some("sample.com".to_string())
        );

        let blog_id = result.get::<i64, _>("id");

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/domain"))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Blog should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT domain
FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<Option<String>, _>("domain").is_none());

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_remove_domain_request_for_a_deleted_blog(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

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
        .bind("sample.com".to_string())
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

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/domain"))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Unknown blog").await;

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_remove_domain_request_for_an_unknown_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(delete, pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, domain, user_id)
VALUES ($1, $2, $3, $4)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-slug".to_string())
        .bind("sample.com".to_string())
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        let req = test::TestRequest::delete()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/domain"))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Unknown blog").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_remove_domain_request_for_a_blog_without_domain(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

        // Insert a blog without domain.
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

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/domain"))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "This blog does not have a domain connected to it").await;

        Ok(())
    }
}
