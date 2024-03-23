use crate::{
    error::AppError,
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
    newsletter_splash_id: Option<Uuid>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Response {
    newsletter_splash_id: Option<Uuid>,
    newsletter_splash_hex: Option<String>,
}

#[patch("/v1/me/blogs/{blog_id}/settings/newsletter_splash")]
#[tracing::instrument(
    name = "PATCH /v1/me/blogs/{blog_id}/settings/newsletter_splash",
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

    if payload.newsletter_splash_id.is_none() {
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
    newsletter_splash_id = NULL,
    newsletter_splash_hex = NULL
WHERE
    id = $2
    AND has_plus_features IS TRUE
    AND (SELECT found FROM sanity_check) IS TRUE
"#,
        )
        .bind(user_id)
        .bind(blog_id)
        .execute(&data.db_pool)
        .await?
        .rows_affected()
        {
            0 => Err(AppError::from(
                "Missing permission, the blog does not exist, or it does not have plus features",
            )),
            _ => Ok(HttpResponse::Ok().json(Response {
                newsletter_splash_id: None,
                newsletter_splash_hex: None,
            })),
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
    SELECT key, hex
    FROM assets
    WHERE key = $3
    LIMIT 1
)
UPDATE blogs
SET
    newsletter_splash_id = (SELECT key FROM selected_asset),
    newsletter_splash_hex = (SELECT hex FROM selected_asset)
WHERE
    id = $2
    AND has_plus_features IS TRUE
    AND EXISTS (SELECT 1 FROM selected_asset)
    AND (SELECT found FROM sanity_check) IS TRUE
RETURNING newsletter_splash_id, newsletter_splash_hex
"#,
        )
        .bind(user_id)
        .bind(blog_id)
        .bind(payload.newsletter_splash_id)
        .fetch_one(&data.db_pool)
        .await
        .map_err(|error| {
            if matches!(error, sqlx::Error::RowNotFound) {
                AppError::from(
                    "Missing permission, the blog does not exist, or it does not have plus features",
                )
            } else {
                AppError::SqlxError(error)
            }
        })?;

        Ok(HttpResponse::Ok().json(Response {
            newsletter_splash_id: result.get::<Option<Uuid>, _>("newsletter_splash_id"),
            newsletter_splash_hex: result.get::<Option<String>, _>("newsletter_splash_hex"),
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
        assert_response_body_text,
        init_app_for_test,
        res_to_string,
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test]
    async fn can_set_a_newsletter_splash_as_blog_owner(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;
        let newsletter_splash_id = Uuid::new_v4();

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id, has_plus_features)
VALUES ($1, $2, $3, TRUE)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        // Insert an asset.
        let result = sqlx::query(
            r#"
INSERT INTO assets (key, hex, height, width, user_id) 
VALUES ($1, $2, $3, $4, $5)
RETURNING id
"#,
        )
        .bind(newsletter_splash_id)
        .bind("000000".to_string())
        .bind(0)
        .bind(0)
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.try_get::<i64, _>("id").is_ok());

        let req = test::TestRequest::patch()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blogs/{blog_id}/settings/newsletter_splash"
            ))
            .set_json(Request {
                newsletter_splash_id: Some(newsletter_splash_id),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Response>(&res_to_string(res).await).unwrap();

        assert_eq!(json.newsletter_splash_id, Some(newsletter_splash_id));
        assert_eq!(json.newsletter_splash_hex, Some("000000".to_string()));

        // Blog should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT newsletter_splash_id, newsletter_splash_hex FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result
                .get::<Option<Uuid>, _>("newsletter_splash_id")
                .unwrap(),
            newsletter_splash_id
        );
        assert_eq!(
            result
                .get::<Option<String>, _>("newsletter_splash_hex")
                .unwrap(),
            "000000".to_string()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_set_a_newsletter_splash_as_blog_editor(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;
        let newsletter_splash_id = Uuid::new_v4();

        // Insert a blog.
        let result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Blog owner', 'blog_owner', 'blog_owner@storiny.com')
    RETURNING id
)
INSERT INTO blogs (name, slug, user_id, has_plus_features)
VALUES ($1, $2, (SELECT id FROM inserted_user), TRUE)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        // Insert an asset.
        let result = sqlx::query(
            r#"
INSERT INTO assets (key, hex, height, width, user_id)
VALUES ($1, $2, $3, $4, $5)
RETURNING id
"#,
        )
        .bind(newsletter_splash_id)
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
                "/v1/me/blogs/{blog_id}/settings/newsletter_splash"
            ))
            .set_json(Request {
                newsletter_splash_id: Some(newsletter_splash_id),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should reject the request as the editor has not been accepted yet.
        assert!(res.status().is_client_error());
        assert_response_body_text(
            res,
            "Missing permission, the blog does not exist, or it does not have plus features",
        )
        .await;

        // Accept the editor request.
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
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blogs/{blog_id}/settings/newsletter_splash"
            ))
            .set_json(Request {
                newsletter_splash_id: Some(newsletter_splash_id),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Response>(&res_to_string(res).await).unwrap();

        assert_eq!(json.newsletter_splash_id, Some(newsletter_splash_id));
        assert_eq!(json.newsletter_splash_hex, Some("000000".to_string()));

        // Blog should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT newsletter_splash_id, newsletter_splash_hex FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result
                .get::<Option<Uuid>, _>("newsletter_splash_id")
                .unwrap(),
            newsletter_splash_id
        );
        assert_eq!(
            result
                .get::<Option<String>, _>("newsletter_splash_hex")
                .unwrap(),
            "000000".to_string()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_remove_a_newsletter_splash(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;
        let newsletter_splash_id = Uuid::new_v4();

        // Insert an asset.
        let result = sqlx::query(
            r#"
INSERT INTO assets (key, hex, height, width, user_id)
VALUES ($1, $2, $3, $4, $5)
"#,
        )
        .bind(newsletter_splash_id)
        .bind("000000".to_string())
        .bind(0)
        .bind(0)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Insert a blog with newsletter_splash.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id, newsletter_splash_id, newsletter_splash_hex, has_plus_features)
VALUES ($1, $2, $3, $4, $5, TRUE)
RETURNING id, newsletter_splash_id, newsletter_splash_hex
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id.unwrap())
        .bind(newsletter_splash_id)
        .bind("000000".to_string())
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result
                .get::<Option<Uuid>, _>("newsletter_splash_id")
                .unwrap(),
            newsletter_splash_id
        );
        assert_eq!(
            result
                .get::<Option<String>, _>("newsletter_splash_hex")
                .unwrap(),
            "000000".to_string()
        );

        let blog_id = result.get::<i64, _>("id");

        // Reset the newsletter_splash
        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{blog_id}/settings/newsletter_splash"
            ))
            .set_json(Request {
                newsletter_splash_id: None,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Response>(&res_to_string(res).await).unwrap();

        assert!(json.newsletter_splash_id.is_none());
        assert!(json.newsletter_splash_hex.is_none());

        // Blog should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT newsletter_splash_id, newsletter_splash_hex FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<Uuid>, _>("newsletter_splash_id")
                .is_none()
        );
        assert!(
            result
                .get::<Option<String>, _>("newsletter_splash_hex")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_an_error_response_for_an_invalid_newsletter_splash_id(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id, has_plus_features)
VALUES ($1, $2, $3, TRUE)
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
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blogs/{blog_id}/settings/newsletter_splash"
            ))
            .set_json(Request {
                newsletter_splash_id: Some(Uuid::new_v4()),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(
            res,
            "Missing permission, the blog does not exist, or it does not have plus features",
        )
        .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_newsletter_splash_update_request_for_a_regular_blog(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;
        let newsletter_splash_id = Uuid::new_v4();

        // Insert a regular blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id, has_plus_features)
VALUES ($1, $2, $3, FALSE)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        // Insert an asset.
        let result = sqlx::query(
            r#"
INSERT INTO assets (key, hex, height, width, user_id)
VALUES ($1, $2, $3, $4, $5)
RETURNING id
"#,
        )
        .bind(newsletter_splash_id)
        .bind("000000".to_string())
        .bind(0)
        .bind(0)
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.try_get::<i64, _>("id").is_ok());

        let req = test::TestRequest::patch()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blogs/{blog_id}/settings/newsletter_splash"
            ))
            .set_json(Request {
                newsletter_splash_id: Some(newsletter_splash_id),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(
            res,
            "Missing permission, the blog does not exist, or it does not have plus features",
        )
        .await;

        // Try removing the newsletter_splash.
        let req = test::TestRequest::patch()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blogs/{blog_id}/settings/newsletter_splash"
            ))
            .set_json(Request {
                newsletter_splash_id: None,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(
            res,
            "Missing permission, the blog does not exist, or it does not have plus features",
        )
        .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_newsletter_splash_update_request_for_a_deleted_blog(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;
        let newsletter_splash_id = Uuid::new_v4();

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id, has_plus_features)
VALUES ($1, $2, $3, TRUE)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        // Soft-delete the blog
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

        // Insert an asset.
        let result = sqlx::query(
            r#"
INSERT INTO assets (key, hex, height, width, user_id)
VALUES ($1, $2, $3, $4, $5)
RETURNING id
"#,
        )
        .bind(newsletter_splash_id)
        .bind("000000".to_string())
        .bind(0)
        .bind(0)
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.try_get::<i64, _>("id").is_ok());

        let req = test::TestRequest::patch()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blogs/{blog_id}/settings/newsletter_splash"
            ))
            .set_json(Request {
                newsletter_splash_id: Some(newsletter_splash_id),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(
            res,
            "Missing permission, the blog does not exist, or it does not have plus features",
        )
        .await;

        // Try removing the newsletter_splash.
        let req = test::TestRequest::patch()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blogs/{blog_id}/settings/newsletter_splash"
            ))
            .set_json(Request {
                newsletter_splash_id: None,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(
            res,
            "Missing permission, the blog does not exist, or it does not have plus features",
        )
        .await;

        Ok(())
    }
}
