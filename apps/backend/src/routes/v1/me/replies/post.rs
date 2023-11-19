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
    #[validate(length(min = 1, max = 1024, message = "Invalid content length"))]
    content: String,
    #[validate(length(min = 1, max = 64, message = "Invalid comment ID"))]
    comment_id: String,
}

#[post("/v1/me/replies")]
async fn post(
    payload: Json<Request>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => {
            match payload.comment_id.parse::<i64>() {
                Ok(comment_id) => {
                    let content = payload.content.trim();
                    let rendered_content = if content.is_empty() {
                        "".to_string()
                    } else {
                        md_to_html(MarkdownSource::Response(content))
                    };

                    match sqlx::query(
                        r#"          
                        WITH
                            inserted_reply AS (
                                INSERT INTO replies (content, rendered_content, user_id, comment_id)
                                    VALUES ($1, $2, $3, $4)
                                    RETURNING id, user_id
                            ),
                            reply_comment AS (
                                SELECT user_id FROM comments
                                WHERE id = $4
                            ),
                            inserted_notification AS (
                                INSERT INTO notifications (entity_type, entity_id, notifier_id)
                                    VALUES
                                        ($5,
                                         (SELECT id FROM inserted_reply),
                                         (SELECT user_id FROM inserted_reply))
                                    RETURNING id
                            )
                        INSERT
                        INTO
                            notification_outs (notified_id, notification_id)
                        SELECT
                            (SELECT user_id FROM reply_comment),
                            (SELECT id FROM inserted_notification)
                        WHERE EXISTS (
                            SELECT 1 FROM reply_comment
                        )
                        "#,
                    )
                    .bind(content)
                    .bind(rendered_content)
                    .bind(user_id)
                    .bind(comment_id)
                    .bind(NotificationEntityType::ReplyAdd as i16)
                    .execute(&data.db_pool)
                    .await
                    {
                        Ok(_) => Ok(HttpResponse::Created().finish()),
                        Err(err) => {
                            if let Some(db_err) = err.into_database_error() {
                                match db_err.kind() {
                                    sqlx::error::ErrorKind::ForeignKeyViolation => {
                                        Ok(HttpResponse::BadRequest().json(
                                            ToastErrorResponse::new("Comment does not exist"),
                                        ))
                                    }
                                    _ => {
                                        let err_code = db_err.code().unwrap_or_default();

                                        // Check if the comment is soft-deleted
                                        if err_code == SqlState::EntityUnavailable.to_string() {
                                            Ok(HttpResponse::BadRequest().json(
                                                ToastErrorResponse::new("Comment is deleted"),
                                            ))
                                        // Check if the reply writer is blocked by the comment
                                        // writer
                                        } else if err_code
                                            == SqlState::ReplyWriterBlockedByCommentWriter
                                                .to_string()
                                        {
                                            Ok(HttpResponse::Forbidden().json(
                                                ToastErrorResponse::new(
                                                    "You are being blocked by the comment writer",
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
                Err(_) => Ok(HttpResponse::BadRequest().body("Invalid comment ID")),
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

    #[sqlx::test(fixtures("reply"))]
    async fn can_add_a_reply(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/replies")
            .set_json(Request {
                content: "Sample **reply** content!".to_string(),
                comment_id: "3".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Reply should be present in the database, with rendered markdown
        let result = sqlx::query(
            r#"
            SELECT id, rendered_content FROM replies
            WHERE user_id = $1 AND comment_id = $2
            "#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("rendered_content"),
            md_to_html(MarkdownSource::Response("Sample **reply** content!"))
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

    #[sqlx::test(fixtures("reply"))]
    async fn can_reject_reply_for_a_missing_comment(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/replies")
            .set_json(Request {
                content: "Sample **reply** content!".to_string(),
                comment_id: "12345".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Comment does not exist").await;

        Ok(())
    }

    #[sqlx::test(fixtures("reply"))]
    async fn can_reject_reply_for_a_soft_deleted_comment(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        // Soft-delete the comment
        sqlx::query(
            r#"
            UPDATE comments
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/replies")
            .set_json(Request {
                content: "Sample **reply** content!".to_string(),
                comment_id: "3".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Comment is deleted").await;

        Ok(())
    }

    #[sqlx::test(fixtures("reply"))]
    async fn can_reject_reply_when_comment_writer_has_blocked_the_reply_writer(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Get blocked by the comment writer
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
            .uri("/v1/me/replies")
            .set_json(Request {
                content: "Sample **reply** content!".to_string(),
                comment_id: "3".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "You are being blocked by the comment writer").await;

        Ok(())
    }
}
