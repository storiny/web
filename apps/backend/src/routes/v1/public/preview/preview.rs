use crate::{
    error::AppError,
    AppState,
};
use actix_web::{
    get,
    web,
    HttpResponse,
};
use serde::{
    Deserialize,
    Serialize,
};

use crate::middlewares::identity::identity::Identity;
use sqlx::{
    types::Json,
    FromRow,
};
use uuid::Uuid;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    story_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct User {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    username: String,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct Story {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    slug: String,
    title: String,
    splash_id: Option<Uuid>,
    splash_hex: Option<String>,
    description: Option<String>,
    // Stats
    read_count: i32,
    like_count: i32,
    comment_count: i32,
    // Joins
    user: Json<User>,
}

#[get("/v1/public/preview/{story_id}")]
#[tracing::instrument(
    name = "GET /v1/public/preview/{story_id}",
    skip_all,
    fields(
        user_id = tracing::field::Empty,
        story_id = %path.story_id
    ),
    err
)]
async fn get(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    maybe_user: Option<Identity>,
) -> Result<HttpResponse, AppError> {
    let user_id = maybe_user.map(|user| user.id()).transpose()?;

    tracing::Span::current().record("user_id", user_id);

    let story_id = path
        .story_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid story ID"))?;

    let story = if let Some(user_id) = user_id {
        sqlx::query_as::<_, Story>(
            r#"
SELECT
    s.id,
    s.title,
    s.slug,
    s.splash_id,
    s.splash_hex,
    s.description,
    s.read_count,
    s.like_count,
    s.comment_count,
    -- User
    JSON_BUILD_OBJECT('id', u.id, 'username', u.username) AS "user"
FROM
    stories s
        -- Join user
        INNER JOIN users u
            ON u.id = s.user_id
            AND u.deleted_at IS NULL
            AND u.deactivated_at IS NULL
            -- Skip stories from private users
            AND (u.is_private IS FALSE OR u.id = $2)
WHERE
      s.id = $1
      -- Public
  AND (s.visibility = 2 OR s.user_id = $2)
  AND s.published_at IS NOT NULL
  AND s.deleted_at IS NULL
"#,
        )
        .bind(story_id)
        .bind(user_id)
        .fetch_one(&data.db_pool)
        .await
        .map_err(|error| {
            if matches!(error, sqlx::Error::RowNotFound) {
                AppError::from("Story not found")
            } else {
                AppError::SqlxError(error)
            }
        })?
    } else {
        sqlx::query_as::<_, Story>(
            r#"
SELECT
    s.id,
    s.title,
    s.slug,
    s.splash_id,
    s.splash_hex,
    s.description,
    s.read_count,
    s.like_count,
    s.comment_count,
    -- User
    JSON_BUILD_OBJECT('id', u.id, 'username', u.username) AS "user"
FROM
    stories s
        -- Join user
        INNER JOIN users u
            ON u.id = s.user_id
            AND u.deleted_at IS NULL
            AND u.deactivated_at IS NULL
            -- Skip stories from private users
            AND u.is_private IS FALSE
WHERE
      s.id = $1
      -- Public
  AND s.visibility = 2
  AND s.published_at IS NOT NULL
  AND s.deleted_at IS NULL
"#,
        )
        .bind(story_id)
        .fetch_one(&data.db_pool)
        .await
        .map_err(|error| {
            if matches!(error, sqlx::Error::RowNotFound) {
                AppError::from("Story not found")
            } else {
                AppError::SqlxError(error)
            }
        })?
    };

    Ok(HttpResponse::Ok().json(story))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
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
    use sqlx::PgPool;

    #[sqlx::test(fixtures("preview"))]
    async fn can_return_a_story_preview(pool: PgPool) -> sqlx::Result<()> {
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        let req = test::TestRequest::get()
            .uri(&format!("/v1/public/preview/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Story>(&res_to_string(res).await);

        assert!(json.is_ok());

        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_a_missing_story(pool: PgPool) -> sqlx::Result<()> {
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        let req = test::TestRequest::get()
            .uri("/v1/public/preview/12345")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Story not found").await;

        Ok(())
    }

    #[sqlx::test(fixtures("preview"))]
    async fn should_not_return_preview_for_a_soft_deleted_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        // Soft-delete the story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .uri(&format!("/v1/public/preview/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Story not found").await;

        Ok(())
    }

    #[sqlx::test(fixtures("preview"))]
    async fn should_not_return_preview_for_an_unpublished_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        // Unpublish the story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .uri(&format!("/v1/public/preview/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Story not found").await;

        Ok(())
    }
}
