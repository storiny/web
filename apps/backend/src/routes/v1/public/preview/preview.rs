use crate::{error::AppError, AppState};
use actix_web::{get, web, HttpResponse};
use serde::{Deserialize, Serialize};
use sqlx::{types::Json, FromRow};
use uuid::Uuid;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    story_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct User {
    id: i64,
    username: String,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct Story {
    id: i64,
    slug: String,
    title: String,
    splash_id: Option<Uuid>,
    splash_hex: Option<String>,
    description: Option<String>,
    // Stats
    read_count: i64,
    like_count: i64,
    comment_count: i32,
    // Joins
    user: Json<User>,
}

#[get("/v1/public/preview/{story_id}")]
async fn get(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
) -> Result<HttpResponse, AppError> {
    match path.story_id.parse::<i64>() {
        Ok(story_id) => {
            match sqlx::query_as::<_, Story>(
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
            {
                Ok(story) => Ok(HttpResponse::Ok().json(story)),
                Err(kind) => match kind {
                    sqlx::Error::RowNotFound => {
                        Ok(HttpResponse::BadRequest().body("Story not found"))
                    }
                    _ => Ok(HttpResponse::InternalServerError().finish()),
                },
            }
        }
        Err(_) => Ok(HttpResponse::BadRequest().body("Invalid story ID")),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{assert_response_body_text, init_app_for_test, res_to_string};
    use actix_web::test;
    use sqlx::PgPool;

    #[sqlx::test(fixtures("preview"))]
    async fn can_return_story_preview(pool: PgPool) -> sqlx::Result<()> {
        let app = init_app_for_test(get, pool, false, false).await.0;

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
        let app = init_app_for_test(get, pool, false, false).await.0;

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
        let app = init_app_for_test(get, pool, false, false).await.0;

        // Soft-delete the story
        let result = sqlx::query(
            r#"
            UPDATE stories
            SET deleted_at = now()
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
        let app = init_app_for_test(get, pool, false, false).await.0;

        // Unpublish the story
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
