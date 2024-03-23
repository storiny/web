use crate::{
    error::AppError,
    middlewares::identity::identity::Identity,
    realms::realm::{
        RealmData,
        RealmDestroyReason,
    },
    AppState,
};
use actix_web::{
    delete,
    web,
    HttpResponse,
};
use lockable::AsyncLimit;
use serde::Deserialize;
use tracing::debug;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    blog_id: String,
    story_id: String,
}

#[delete("/v1/me/blogs/{blog_id}/stories/{story_id}")]
#[tracing::instrument(
    name = "DELETE /v1/me/blogs/{blog_id}/stories/{story_id}",
    skip_all,
    fields(
        user_id = user.id().ok(),
        blog_id = %path.blog_id,
        story_id = %path.story_id
    ),
    err
)]
async fn delete(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
    realm_map: RealmData,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;

    let blog_id = path
        .blog_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid blog ID"))?;

    let story_id = path
        .story_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid story ID"))?;

    let realm = realm_map
        .async_lock(story_id, AsyncLimit::no_limit())
        .await
        .map_err(|error| {
            AppError::InternalError(format!("unable to acquire a lock on the realm: {error:?}"))
        })?;

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    match sqlx::query(
        r#"
WITH blog_as_owner AS (
    SELECT 1 FROM blogs
    WHERE
        id = $3
        AND user_id = $1
), blog_as_editor AS (
    SELECT 1 FROM blog_editors
    WHERE
        blog_id = $3
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
DELETE FROM blog_stories bs
USING blogs b
WHERE
    b.id = $3
    AND b.deleted_at IS NULL
    AND bs.blog_id = b.id
    AND bs.story_id = $2
    AND (SELECT found FROM sanity_check) IS TRUE
"#,
    )
    .bind(user_id)
    .bind(story_id)
    .bind(blog_id)
    .execute(&mut *txn)
    .await?
    .rows_affected()
    {
        0 => Err(AppError::from("Blog or story not found")),
        _ => {
            // Drop the realm.
            if let Some(realm_inner) = realm.value() {
                debug!("realm is present in the map, destroying");
                realm_inner.destroy(RealmDestroyReason::Internal).await;
            }

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
        assert_response_body_text,
        init_app_for_test,
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test(fixtures("story"))]
    async fn can_remove_a_story_as_blog_owner(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(delete, pool, true, true, Some(1_i64)).await;

        // Add a story.
        let result = sqlx::query(
            r#"
INSERT INTO blog_stories (story_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{}/stories/{}", 4, 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Blog story should not be present in the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM blog_stories
    WHERE story_id = $1 AND blog_id = $2
)
"#,
        )
        .bind(3_i64)
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_remove_a_story_as_blog_editor(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

        // Insert an editor.
        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Add a story.
        let result = sqlx::query(
            r#"
INSERT INTO blog_stories (story_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::delete()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/blogs/{}/stories/{}", 4, 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should reject the request as the editor has not been accepted yet.
        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Blog or story not found").await;

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

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{}/stories/{}", 4, 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Blog story should not be present in the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM blog_stories
    WHERE story_id = $1 AND blog_id = $2
)
"#,
        )
        .bind(3_i64)
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_return_an_error_response_when_removing_an_unknown_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(delete, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{}/stories/{}", 4, 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Blog or story not found").await;

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_return_an_error_response_for_a_missing_blog(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(delete, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{}/stories/{}", 12345, 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Blog or story not found").await;

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_return_an_error_response_for_a_soft_deleted_blog(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(delete, pool, true, true, Some(1_i64)).await;

        // Soft-delete the blog.
        let result = sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{}/stories/{}", 4, 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Blog or story not found").await;

        Ok(())
    }
}
