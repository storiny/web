use crate::{
    constants::story_category::STORY_CATEGORY_VEC,
    error::{
        AppError,
        FormErrorResponse,
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
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    blog_id: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(length(min = 3, max = 32, message = "Invalid name length"))]
    name: String,
    #[validate(length(min = 0, max = 256, message = "Invalid description length"))]
    description: Option<String>,
    // Blog category is validated in the request handler
    #[validate(length(min = 0, max = 128, message = "Invalid blog category"))]
    category: String,
}

#[patch("/v1/me/blogs/{blog_id}/settings/general")]
#[tracing::instrument(
    name = "PATCH /v1/me/blogs/{blog_id}/settings/general",
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

    // Validate blog category.
    if !STORY_CATEGORY_VEC.contains(&payload.category) {
        return Err(FormErrorResponse::new(None, vec![("category", "Invalid category")]).into());
    }

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
    name = $3,
    description = $4,
    category = $5::story_category
WHERE
    id = $2
    AND (SELECT found FROM sanity_check) IS TRUE
"#,
    )
    .bind(user_id)
    .bind(blog_id)
    .bind(&payload.name)
    .bind(&payload.description)
    .bind(&payload.category)
    .execute(&data.db_pool)
    .await?
    .rows_affected()
    {
        0 => Err(AppError::from(
            "Missing permission or the blog does not exist",
        )),
        _ => Ok(HttpResponse::NoContent().finish()),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(patch);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        constants::story_category::StoryCategory,
        test_utils::{
            assert_form_error_response,
            assert_response_body_text,
            init_app_for_test,
        },
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test]
    async fn can_update_general_settings_as_blog_owner(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id, name, description, category::TEXT
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        // Assert initial values.
        assert_eq!(result.get::<String, _>("name"), "Sample blog".to_string());
        assert!(result.get::<Option<String>, _>("description").is_none());
        assert_eq!(
            result.get::<String, _>("category"),
            StoryCategory::Others.to_string()
        );

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/general"))
            .set_json(Request {
                name: "New name".to_string(),
                description: Some("Some new description".to_string()),
                category: StoryCategory::DIY.to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Blog should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT name, description, category::TEXT
FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<String, _>("name"), "New name".to_string());
        assert_eq!(
            result.get::<Option<String>, _>("description"),
            Some("Some new description".to_string())
        );
        assert_eq!(
            result.get::<String, _>("category"),
            StoryCategory::DIY.to_string()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_update_general_settings_as_blog_editor(pool: PgPool) -> sqlx::Result<()> {
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
RETURNING id, name, description, category::TEXT
"#,
        )
        .bind("Sample blog".to_string())
        .bind("initial-slug".to_string())
        .fetch_one(&mut *conn)
        .await?;

        // Assert initial values.
        assert_eq!(result.get::<String, _>("name"), "Sample blog".to_string());
        assert!(result.get::<Option<String>, _>("description").is_none());
        assert_eq!(
            result.get::<String, _>("category"),
            StoryCategory::Others.to_string()
        );

        let blog_id = result.get::<i64, _>("id");

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
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/general"))
            .set_json(Request {
                name: "New name".to_string(),
                description: Some("Some new description".to_string()),
                category: StoryCategory::DIY.to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should reject the request as the editor has not been accepted yet.
        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Missing permission or the blog does not exist").await;

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
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/general"))
            .set_json(Request {
                name: "New name".to_string(),
                description: Some("Some new description".to_string()),
                category: StoryCategory::DIY.to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Blog should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT name, description, category::TEXT
FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<String, _>("name"), "New name".to_string());
        assert_eq!(
            result.get::<Option<String>, _>("description"),
            Some("Some new description".to_string())
        );
        assert_eq!(
            result.get::<String, _>("category"),
            StoryCategory::DIY.to_string()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_general_settings_request_for_a_deleted_blog(
        pool: PgPool,
    ) -> sqlx::Result<()> {
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
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/general"))
            .set_json(Request {
                name: "New name".to_string(),
                description: Some("Some new description".to_string()),
                category: StoryCategory::DIY.to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Missing permission or the blog does not exist").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_general_settings_request_for_invalid_category(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(patch, pool, true, false, None).await;

        let req = test::TestRequest::patch()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/blogs/{}/settings/general", 12345))
            .set_json(Request {
                name: "New name".to_string(),
                description: Some("Some new description".to_string()),
                category: "invalid-category".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(res, vec![("category", "Invalid category")]).await;

        Ok(())
    }
}
