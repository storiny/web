use crate::{
    constants::sql_states::SqlState,
    error::{
        AppError,
        ToastErrorResponse,
    },
    middleware::identity::identity::Identity,
    models::notification::NotificationEntityType,
    utils::md_to_html::{
        md_to_html,
        MarkdownSource,
    },
    AppState,
};
use actix_web::{
    post,
    web,
    HttpResponse,
};
use actix_web_validator::Json;
use serde::{
    Deserialize,
    Serialize,
};
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(length(min = 1, max = 2048, message = "Invalid content length"))]
    content: String,
    #[validate(length(min = 1, max = 64, message = "Invalid story ID"))]
    story_id: String,
}

#[post("/v1/me/comments")]
async fn post(
    payload: Json<Request>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => {
            match payload.story_id.parse::<i64>() {
                Ok(story_id) => {
                    let content = payload.content.trim();
                    let rendered_content = if content.is_empty() {
                        "".to_string()
                    } else {
                        md_to_html(MarkdownSource::Response(content))
                    };

                    match sqlx::query(
                        r#"
                        WITH
                            inserted_comment AS (
                                INSERT INTO comments (content, rendered_content, user_id, story_id)
                                    VALUES ($1, $2, $3, $4)
                                    RETURNING id
                            ),
                            comment_story AS (
                                SELECT user_id FROM stories
                                WHERE id = $4
                            ),
                            inserted_notification AS (
                                INSERT INTO notifications (entity_type, entity_id, notifier_id)
                                    VALUES
                                        ($5,
                                         (SELECT id FROM inserted_comment),
                                         $3)
                                    RETURNING id
                            )
                        INSERT
                        INTO
                            notification_outs (notified_id, notification_id)
                        SELECT
                            (SELECT user_id FROM comment_story),
                            (SELECT id FROM inserted_notification)
                        WHERE EXISTS (
                            SELECT 1 FROM comment_story
                        )
                        "#,
                    )
                    .bind(content)
                    .bind(rendered_content)
                    .bind(user_id)
                    .bind(story_id)
                    .bind(NotificationEntityType::CommentAdd as i16)
                    .execute(&data.db_pool)
                    .await
                    {
                        Ok(_) => Ok(HttpResponse::Created().finish()),
                        Err(err) => {
                            if let Some(db_err) = err.into_database_error() {
                                match db_err.kind() {
                                    sqlx::error::ErrorKind::ForeignKeyViolation => {
                                        Ok(HttpResponse::BadRequest()
                                            .json(ToastErrorResponse::new("Story does not exist")))
                                    }
                                    _ => {
                                        let err_code = db_err.code().unwrap_or_default();

                                        // Check if the story is soft-deleted or unpublished
                                        if err_code == SqlState::EntityUnavailable.to_string() {
                                            Ok(HttpResponse::BadRequest().json(
                                                ToastErrorResponse::new(
                                                    "Story is either deleted or unpublished",
                                                ),
                                            ))
                                        // Check if the comment writer is blocked by the story
                                        // writer
                                        } else if err_code
                                            == SqlState::CommentWriterBlockedByStoryWriter
                                                .to_string()
                                        {
                                            Ok(HttpResponse::Forbidden().json(
                                                ToastErrorResponse::new(
                                                    "You are being blocked by the story writer",
                                                ),
                                            ))
                                        } else {
                                            Ok(HttpResponse::InternalServerError().finish())
                                        }
                                    }
                                }
                            } else {
                                Ok(HttpResponse::InternalServerError().finish())
                            }
                        }
                    }
                }
                Err(_) => Ok(HttpResponse::BadRequest().body("Invalid story ID")),
            }
        }
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_toast_error_response,
        init_app_for_test,
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test(fixtures("comment"))]
    async fn can_add_a_comment(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/comments")
            .set_json(Request {
                content: "Sample **comment** content!".to_string(),
                story_id: "3".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Comment should be present in the database, with rendered markdown
        let result = sqlx::query(
            r#"
            SELECT id, rendered_content FROM comments
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("rendered_content"),
            md_to_html(MarkdownSource::Response("Sample **comment** content!"))
        );

        // Should also insert a notification
        let notification_result = sqlx::query(
            r#"
            SELECT
                EXISTS (
                    SELECT
                        1
                    FROM
                        notification_outs
                    WHERE
                        notification_id = (
                            SELECT id FROM notifications
                            WHERE entity_id = $1
                        )
                   )
            "#,
        )
        .bind(result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(notification_result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("comment"))]
    async fn can_reject_comment_for_a_missing_story(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/comments")
            .set_json(Request {
                content: "Sample **comment** content!".to_string(),
                story_id: "12345".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story does not exist").await;

        Ok(())
    }

    #[sqlx::test(fixtures("comment"))]
    async fn can_reject_comment_for_a_soft_deleted_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        // Soft-delete the story
        sqlx::query(
            r#"
            UPDATE stories
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/comments")
            .set_json(Request {
                content: "Sample **comment** content!".to_string(),
                story_id: "3".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story is either deleted or unpublished").await;

        Ok(())
    }

    #[sqlx::test(fixtures("comment"))]
    async fn can_reject_comment_for_an_unpublished_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        // Unpublish the story
        sqlx::query(
            r#"
            UPDATE stories
            SET published_at = NULL
            WHERE id = $1
            "#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/comments")
            .set_json(Request {
                content: "Sample **comment** content!".to_string(),
                story_id: "3".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story is either deleted or unpublished").await;

        Ok(())
    }

    #[sqlx::test(fixtures("comment"))]
    async fn can_reject_comment_when_story_writer_has_blocked_the_comment_writer(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Get blocked by the story writer
        sqlx::query(
            r#"
            INSERT INTO blocks(blocker_id, blocked_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/comments")
            .set_json(Request {
                content: "Sample **comment** content!".to_string(),
                story_id: "3".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "You are being blocked by the story writer").await;

        Ok(())
    }
}
