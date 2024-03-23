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
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    blog_id: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    is_story_minimal_layout: bool,
}

#[patch("/v1/me/blogs/{blog_id}/settings/appearance/story-layout")]
#[tracing::instrument(
    name = "PATCH /v1/me/blogs/{blog_id}/settings/appearance/story-layout",
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
SET is_story_minimal_layout = $3
WHERE
    id = $2
    AND (SELECT found FROM sanity_check) IS TRUE
"#,
    )
    .bind(user_id)
    .bind(blog_id)
    .bind(payload.is_story_minimal_layout)
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
    use crate::test_utils::{
        assert_response_body_text,
        init_app_for_test,
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test]
    async fn can_update_story_layout_settings_as_blog_owner(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id, is_story_minimal_layout
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        // Should be `false` initially.
        assert!(!result.get::<bool, _>("is_story_minimal_layout"));

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{blog_id}/settings/appearance/story-layout",
            ))
            .set_json(Request {
                is_story_minimal_layout: true,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Blog should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT is_story_minimal_layout FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("is_story_minimal_layout"));

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
RETURNING id, is_story_minimal_layout
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .fetch_one(&mut *conn)
        .await?;

        // Should be `false` initially.
        assert!(!result.get::<bool, _>("is_story_minimal_layout"));

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
            .uri(&format!(
                "/v1/me/blogs/{blog_id}/settings/appearance/story-layout",
            ))
            .set_json(Request {
                is_story_minimal_layout: true,
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
            .uri(&format!(
                "/v1/me/blogs/{blog_id}/settings/appearance/story-layout",
            ))
            .set_json(Request {
                is_story_minimal_layout: true,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Blog should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT is_story_minimal_layout FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("is_story_minimal_layout"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_story_layout_settings_request_for_a_deleted_blog(
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
            .uri(&format!(
                "/v1/me/blogs/{blog_id}/settings/appearance/story-layout",
            ))
            .set_json(Request {
                is_story_minimal_layout: true,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Missing permission or the blog does not exist").await;

        Ok(())
    }
}
