use crate::{
    error::AppError,
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_web::{
    delete,
    web,
    HttpResponse,
};
use serde::Deserialize;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    blog_id: String,
    user_id: String,
}

#[delete("/v1/me/blogs/{blog_id}/editors/{user_id}")]
#[tracing::instrument(
    name = "DELETE /v1/me/blogs/{blog_id}/editors/{user_id}",
    skip_all,
    fields(
        current_user_id = user.id().ok(),
        blog_id = %path.blog_id,
        editor_user_id = %path.user_id
    ),
    err
)]
async fn delete(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let current_user_id = user.id()?;

    let blog_id = path
        .blog_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid blog ID"))?;

    let editor_user_id = path
        .user_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid user ID"))?;

    match sqlx::query(
        r#"
DELETE FROM blog_editors be
USING blogs b
WHERE
    b.id = $3
    AND b.user_id = $1
    AND b.deleted_at IS NULL
    AND be.blog_id = b.id
    AND be.user_id = $2
    AND be.accepted_at IS NOT NULL
"#,
    )
    .bind(current_user_id)
    .bind(editor_user_id)
    .bind(blog_id)
    .execute(&data.db_pool)
    .await?
    .rows_affected()
    {
        0 => Err(AppError::from("Editor not found")),
        _ => Ok(HttpResponse::NoContent().finish()),
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

    #[sqlx::test(fixtures("editor"))]
    async fn can_remove_an_editor(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(delete, pool, true, true, Some(1_i64)).await;

        // Add an editor.
        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{}/editors/{}", 3, 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Editor should not be present in the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM blog_editors
    WHERE user_id = $1 AND blog_id = $2
)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("editor"))]
    async fn can_return_an_error_response_when_removing_an_unknown_editor(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(delete, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{}/editors/{}", 3, 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Editor not found").await;

        Ok(())
    }

    #[sqlx::test(fixtures("editor"))]
    async fn can_return_an_error_response_for_a_missing_blog(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(delete, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{}/editors/{}", 12345, 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Editor not found").await;

        Ok(())
    }

    #[sqlx::test(fixtures("editor"))]
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
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{}/editors/{}", 3, 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Editor not found").await;

        Ok(())
    }
}
