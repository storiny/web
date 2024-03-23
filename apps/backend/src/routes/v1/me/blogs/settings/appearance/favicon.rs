use crate::{
    error::{
        AppError,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    AppState,
};
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
use sqlx::Row;
use uuid::Uuid;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    blog_id: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    favicon: Option<Uuid>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Response {
    favicon: Option<Uuid>,
}

#[patch("/v1/me/blogs/{blog_id}/settings/appearance/favicon")]
#[tracing::instrument(
    name = "PATCH /v1/me/blogs/{blog_id}/settings/appearance/favicon",
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
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let blog_id = path
        .blog_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid blog ID"))?;

    if payload.favicon.is_none() {
        match sqlx::query(
            r#"
WITH blog_as_owner AS (
    SELECT 1 FROM blogs
    WHERE
        id = $2
        AND user_id = $1
        AND deleted_at IS NULL
), blog_as_editor AS (
    SELECT 1 FROM blog_editors
    WHERE
        blog_id = $2
        AND user_id = $1
        AND accepted_at IS NOT NULL
        AND deleted_at IS NULL
        AND NOT EXISTS (
            SELECT FROM blog_as_owner
        )
), sanity_check AS (
    SELECT COALESCE(
        (SELECT TRUE FROM blog_as_owner),
        (SELECT TRUE FROM blog_as_editor)
    ) AS "found"
)
UPDATE blogs
SET
    favicon = NULL
WHERE
    id = $2
    AND (SELECT found FROM sanity_check) IS TRUE
"#,
        )
        .bind(user_id)
        .bind(blog_id)
        .execute(&data.db_pool)
        .await?
        .rows_affected()
        {
            0 => Err(AppError::ToastError(ToastErrorResponse::new(
                None,
                "Missing permission, the blog does not exist, or the favicon is invalid",
            ))),
            _ => Ok(HttpResponse::Ok().json(Response { favicon: None })),
        }
    } else {
        let result = sqlx::query(
            r#"
WITH blog_as_owner AS (
    SELECT 1 FROM blogs
    WHERE
        id = $2
        AND user_id = $1
        AND deleted_at IS NULL
), blog_as_editor AS (
    SELECT 1 FROM blog_editors
    WHERE
        blog_id = $2
        AND user_id = $1
        AND accepted_at IS NOT NULL
        AND deleted_at IS NULL
        AND NOT EXISTS (
            SELECT FROM blog_as_owner
        )
), sanity_check AS (
    SELECT COALESCE(
        (SELECT TRUE FROM blog_as_owner),
        (SELECT TRUE FROM blog_as_editor)
    ) AS "found"
), selected_asset AS (
    SELECT key
    FROM assets
    WHERE key = $3
    LIMIT 1
)
UPDATE blogs
SET
    favicon = (SELECT key FROM selected_asset)
WHERE
    id = $2
    AND EXISTS (SELECT 1 FROM selected_asset)
    AND (SELECT found FROM sanity_check) IS TRUE
RETURNING favicon
"#,
        )
        .bind(user_id)
        .bind(blog_id)
        .bind(payload.favicon)
        .fetch_one(&data.db_pool)
        .await
        .map_err(|error| {
            if matches!(error, sqlx::Error::RowNotFound) {
                AppError::ToastError(ToastErrorResponse::new(
                    None,
                    "Missing permission, the blog does not exist, or the favicon is invalid",
                ))
            } else {
                AppError::SqlxError(error)
            }
        })?;

        Ok(HttpResponse::Ok().json(Response {
            favicon: result.get::<Option<Uuid>, _>("favicon"),
        }))
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(patch);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_toast_error_response,
        init_app_for_test,
        res_to_string,
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test]
    async fn can_update_favicon_as_blog_owner(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id, favicon
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        // Should be `NULL` initially.
        assert!(result.get::<Option<Uuid>, _>("favicon").is_none());

        let favicon = Uuid::new_v4();

        // Insert an asset.
        let result = sqlx::query(
            r#"
INSERT INTO assets (key, hex, height, width, user_id)
VALUES ($1, $2, $3, $4, $5)
RETURNING id
"#,
        )
        .bind(favicon)
        .bind("000000".to_string())
        .bind(0)
        .bind(0)
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.try_get::<i64, _>("id").is_ok());

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{blog_id}/settings/appearance/favicon",
            ))
            .set_json(Request {
                favicon: Some(favicon),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Response>(&res_to_string(res).await).unwrap();

        assert_eq!(json.favicon, Some(favicon));

        // Blog should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT favicon FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<Option<Uuid>, _>("favicon").unwrap(), favicon);

        Ok(())
    }

    #[sqlx::test]
    async fn can_update_story_layout_settings_as_blog_editor(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Sample user 1', 'sample_user_1', 'sample_1@storiny.com')
    RETURNING id
)
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, (SELECT id FROM inserted_user))
RETURNING id, favicon
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .fetch_one(&mut *conn)
        .await?;

        // Should be `NULL` initially.
        assert!(result.get::<Option<Uuid>, _>("favicon").is_none());

        let blog_id = result.get::<i64, _>("id");
        let favicon = Uuid::new_v4();

        // Insert an asset.
        let result = sqlx::query(
            r#"
INSERT INTO assets (key, hex, height, width, user_id)
VALUES ($1, $2, $3, $4, $5)
RETURNING id
"#,
        )
        .bind(favicon)
        .bind("000000".to_string())
        .bind(0)
        .bind(0)
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.try_get::<i64, _>("id").is_ok());

        // Add the current user as an editor.
        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::patch()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blogs/{blog_id}/settings/appearance/favicon",
            ))
            .set_json(Request {
                favicon: Some(favicon),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should reject the request as the editor has not been accepted yet.
        assert!(res.status().is_client_error());
        assert_toast_error_response(
            res,
            "Missing permission, the blog does not exist, or the favicon is invalid",
        )
        .await;

        // Accept the editor.
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

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{blog_id}/settings/appearance/favicon",
            ))
            .set_json(Request {
                favicon: Some(favicon),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Response>(&res_to_string(res).await).unwrap();

        assert_eq!(json.favicon, Some(favicon));

        // Blog should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT favicon FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<Option<Uuid>, _>("favicon").unwrap(), favicon);

        Ok(())
    }

    #[sqlx::test]
    async fn can_remove_a_favicon(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;
        let favicon = Uuid::new_v4();

        // Insert an asset.
        let result = sqlx::query(
            r#"
INSERT INTO assets (key, hex, height, width, user_id)
VALUES ($1, $2, $3, $4, $5)
RETURNING id
"#,
        )
        .bind(favicon)
        .bind("000000".to_string())
        .bind(0)
        .bind(0)
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.try_get::<i64, _>("id").is_ok());

        // Insert a blog with favicon.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id, favicon)
VALUES ($1, $2, $3, $4)
RETURNING id, favicon
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id.unwrap())
        .bind(favicon)
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        // Should be present initially.
        assert_eq!(result.get::<Option<Uuid>, _>("favicon").unwrap(), favicon);

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{blog_id}/settings/appearance/favicon",
            ))
            .set_json(Request { favicon: None })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Response>(&res_to_string(res).await).unwrap();

        assert!(json.favicon.is_none());

        // Blog should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT favicon FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<Option<Uuid>, _>("favicon").is_none());

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_an_error_response_for_an_invalid_favicon(pool: PgPool) -> sqlx::Result<()> {
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

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{blog_id}/settings/appearance/favicon",
            ))
            .set_json(Request {
                favicon: Some(Uuid::new_v4()),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(
            res,
            "Missing permission, the blog does not exist, or the favicon is invalid",
        )
        .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_favicon_request_for_a_deleted_blog(pool: PgPool) -> sqlx::Result<()> {
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
            .uri(&format!(
                "/v1/me/blogs/{blog_id}/settings/appearance/favicon"
            ))
            .set_json(Request { favicon: None })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(
            res,
            "Missing permission, the blog does not exist, or the favicon is invalid",
        )
        .await;

        Ok(())
    }
}
