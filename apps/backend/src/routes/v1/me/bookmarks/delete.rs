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
    story_id: String,
}

#[delete("/v1/me/bookmarks/{story_id}")]
#[tracing::instrument(
    name = "DELETE /v1/me/bookmarks/{story_id}",
    skip_all,
    fields(
        user_id = user.id().ok(),
        story_id = %path.story_id
    ),
    err
)]
async fn delete(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let story_id = path
        .story_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid story ID"))?;

    match sqlx::query(
        r#"
DELETE FROM bookmarks
WHERE
    user_id = $1
    AND story_id = $2
"#,
    )
    .bind(user_id)
    .bind(story_id)
    .execute(&data.db_pool)
    .await?
    .rows_affected()
    {
        0 => Err(AppError::from("Story or bookmark not found")),
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

    #[sqlx::test(fixtures("bookmark"))]
    async fn can_unbookmark_a_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

        // Bookmark the story.
        let result = sqlx::query(
            r#"
INSERT INTO bookmarks (user_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/bookmarks/{}", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Bookmark should not be present in the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM bookmarks
    WHERE user_id = $1 AND story_id = $2
)
"#,
        )
        .bind(user_id)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_an_error_response_when_unbookmarking_an_unknown_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(delete, pool, true, false, None).await;

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/bookmarks/{}", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Story or bookmark not found").await;

        Ok(())
    }
}
