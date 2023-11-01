use crate::error::ToastErrorResponse;
use crate::{error::AppError, middleware::identity::identity::Identity, AppState};
use actix_web::{post, put, web, HttpResponse};
use serde::Deserialize;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    story_id: String,
}

// TODO: Handle publishing and editing logic

// Publish a new story
#[post("/v1/me/stories/{story_id}/publish")]
async fn post(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => match path.story_id.parse::<i64>() {
            Ok(story_id) => {
                match sqlx::query(
                    r#"
                    UPDATE stories
                    SET published_at = now()
                    WHERE
                        user_id = $1
                        AND id = $2
                        AND published_at IS NULL
                        AND deleted_at IS NULL
                    "#,
                )
                .bind(user_id)
                .bind(story_id)
                .execute(&data.db_pool)
                .await?
                .rows_affected()
                {
                    0 => Ok(HttpResponse::BadRequest()
                        .json(ToastErrorResponse::new("Story not found".to_string()))),
                    _ => Ok(HttpResponse::NoContent().finish()),
                }
            }
            Err(_) => Ok(HttpResponse::BadRequest().body("Invalid story ID")),
        },
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
    }
}

// Edit a published story
#[put("/v1/me/stories/{story_id}/publish")]
async fn put(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => match path.story_id.parse::<i64>() {
            Ok(story_id) => {
                match sqlx::query(
                    r#"
                    UPDATE stories
                    SET edited_at = now()
                    WHERE
                        user_id = $1
                        AND id = $2
                        AND published_at IS NOT NULL
                        AND deleted_at IS NULL
                    "#,
                )
                .bind(user_id)
                .bind(story_id)
                .execute(&data.db_pool)
                .await?
                .rows_affected()
                {
                    0 => Ok(HttpResponse::BadRequest()
                        .json(ToastErrorResponse::new("Story not found".to_string()))),
                    _ => Ok(HttpResponse::NoContent().finish()),
                }
            }
            Err(_) => Ok(HttpResponse::BadRequest().body("Invalid story ID")),
        },
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
    cfg.service(put);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{assert_toast_error_response, init_app_for_test};
    use actix_web::{services, test};
    use sqlx::{PgPool, Row};
    use time::OffsetDateTime;

    // Publish a new story

    #[sqlx::test]
    async fn can_publish_a_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) =
            init_app_for_test(services![post, put], pool, true, false).await;

        // Insert a draft
        let result = sqlx::query(
            r#"
            INSERT INTO stories(id, user_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/publish", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Story should get updated in the database
        let result = sqlx::query(
            r#"
            SELECT published_at FROM stories
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(result
            .get::<Option<OffsetDateTime>, _>("published_at")
            .is_some());

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_publish_already_published_stories(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) =
            init_app_for_test(services![post, put], pool, true, false).await;

        // Insert a published story
        let result = sqlx::query(
            r#"
            INSERT INTO stories(id, user_id, published_at)
            VALUES ($1, $2, now())
            "#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/publish", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story not found").await;

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_publish_soft_deleted_drafts(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) =
            init_app_for_test(services![post, put], pool, true, false).await;

        // Insert a soft-deleted draft
        let result = sqlx::query(
            r#"
            INSERT INTO stories(id, user_id, deleted_at)
            VALUES ($1, $2, now())
            "#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/publish", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story not found").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_unknown_drafts(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(services![post, put], pool, true, false).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/publish", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story not found").await;

        Ok(())
    }

    // Edit a story

    #[sqlx::test]
    async fn can_edit_a_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) =
            init_app_for_test(services![post, put], pool, true, false).await;

        // Insert a published story
        let result = sqlx::query(
            r#"
            INSERT INTO stories(id, user_id, published_at)
            VALUES ($1, $2, now())
            "#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::put()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/publish", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Story should get updated in the database
        let result = sqlx::query(
            r#"
            SELECT edited_at FROM stories
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(result
            .get::<Option<OffsetDateTime>, _>("edited_at")
            .is_some());

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_edit_unpublished_stories(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) =
            init_app_for_test(services![post, put], pool, true, false).await;

        // Insert an unpublished story
        let result = sqlx::query(
            r#"
            INSERT INTO stories(id, user_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::put()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/publish", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story not found").await;

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_edit_soft_deleted_stories(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) =
            init_app_for_test(services![post, put], pool, true, false).await;

        // Insert a soft-deleted story
        let result = sqlx::query(
            r#"
            INSERT INTO stories(id, user_id, deleted_at, published_at)
            VALUES ($1, $2, now(), now())
            "#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::put()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/publish", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story not found").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_unknown_stories(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(services![post, put], pool, true, false).await;

        let req = test::TestRequest::put()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/publish", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story not found").await;

        Ok(())
    }
}
