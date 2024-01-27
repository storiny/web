use crate::{
    constants::{
        notification_entity_type::NotificationEntityType,
        resource_limit::ResourceLimit,
        sql_states::SqlState,
    },
    error::{
        AppError,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    utils::{
        check_resource_limit::check_resource_limit,
        incr_resource_limit::incr_resource_limit,
        md_to_html::{
            md_to_html,
            MarkdownSource,
        },
    },
    AppState,
};
use actix_web::{
    http::StatusCode,
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
#[tracing::instrument(
    name = "POST /v1/me/replies",
    skip_all,
    fields(
        user_id = user.id().ok(),
        comment_id = %payload.comment_id,
        content = %payload.content
    ),
    err
)]
async fn post(
    payload: Json<Request>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let comment_id = payload
        .comment_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid comment ID"))?;

    if !check_resource_limit(&data.redis, ResourceLimit::CreateReply, user_id).await? {
        return Err(ToastErrorResponse::new(
            Some(StatusCode::TOO_MANY_REQUESTS),
            "Daily limit exceeded for posting replies. Try again tomorrow.",
        )
        .into());
    }

    let content = payload.content.trim();
    let rendered_content = if content.is_empty() {
        "".to_string()
    } else {
        md_to_html(MarkdownSource::Response(content))
    };

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    match sqlx::query(
        r#"          
WITH inserted_reply AS (
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
        SELECT
            $5,
            (SELECT id FROM inserted_reply),
            (SELECT user_id FROM inserted_reply)
        WHERE
            EXISTS (SELECT 1 FROM reply_comment)
            -- Do not insert the notification if the user replies to its own comment.
            AND $3 <> (SELECT user_id FROM reply_comment)
        RETURNING id
    )
INSERT INTO
    notification_outs (notified_id, notification_id)
SELECT
    (SELECT user_id FROM reply_comment),
    (SELECT id FROM inserted_notification)
WHERE
    EXISTS (SELECT 1 FROM reply_comment)
    AND EXISTS (SELECT 1 FROM inserted_notification)
"#,
    )
    .bind(content)
    .bind(&rendered_content)
    .bind(user_id)
    .bind(comment_id)
    .bind(NotificationEntityType::ReplyAdd as i16)
    .execute(&mut *txn)
    .await
    {
        Ok(_) => {
            incr_resource_limit(&data.redis, ResourceLimit::CreateReply, user_id).await?;

            txn.commit().await?;

            Ok(HttpResponse::Created().finish())
        }
        Err(error) => {
            if let Some(db_err) = error.as_database_error() {
                let error_kind = db_err.kind();

                // Target comment is not present in the table.
                if matches!(error_kind, sqlx::error::ErrorKind::ForeignKeyViolation) {
                    return Err(AppError::ToastError(ToastErrorResponse::new(
                        None,
                        "Comment does not exist",
                    )));
                }

                let error_code = db_err.code().unwrap_or_default();

                // Check if the comment is soft-deleted.
                if error_code == SqlState::EntityUnavailable.to_string() {
                    return Err(AppError::ToastError(ToastErrorResponse::new(
                        None,
                        "Comment is deleted",
                    )));
                }

                // Check if the reply writer is blocked by the comment writer.
                if error_code == SqlState::ReplyWriterBlockedByCommentWriter.to_string() {
                    return Err(AppError::ToastError(ToastErrorResponse::new(
                        Some(StatusCode::FORBIDDEN),
                        "You are being blocked by the comment writer",
                    )));
                }
            }

            Err(AppError::SqlxError(error))
        }
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
        exceed_resource_limit,
        get_resource_limit,
        init_app_for_test,
        RedisTestContext,
    };
    use actix_web::{
        http::StatusCode,
        test,
    };
    use sqlx::{
        PgPool,
        Row,
    };
    use storiny_macros::test_context;

    #[sqlx::test(fixtures("reply"))]
    async fn can_reject_a_reply_for_a_soft_deleted_comment(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        // Soft-delete the comment.
        sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NOW()
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
    async fn can_reject_a_reply_when_comment_writer_has_blocked_the_reply_writer(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Get blocked by the comment writer.
        sqlx::query(
            r#"
INSERT INTO blocks (blocker_id, blocked_id)
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

    #[sqlx::test]
    async fn can_reject_a_reply_for_a_missing_comment(pool: PgPool) -> sqlx::Result<()> {
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

    mod serial {
        use super::*;

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("reply"))]
        async fn can_add_a_reply(ctx: &mut RedisTestContext, pool: PgPool) -> sqlx::Result<()> {
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

            // Reply should be present in the database, with rendered markdown.
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

            // Should also insert a notification.
            let notification_result = sqlx::query(
                r#"
SELECT EXISTS (
    SELECT 1 FROM notifications
    WHERE entity_id = $1
)
"#,
            )
            .bind(result.get::<i64, _>("id"))
            .fetch_one(&mut *conn)
            .await?;

            assert!(notification_result.get::<bool, _>("exists"));

            // Should also increment the resource limit.
            let result = get_resource_limit(
                &ctx.redis_pool,
                ResourceLimit::CreateReply,
                user_id.unwrap(),
            )
            .await;

            assert_eq!(result, 1);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_a_reply_request_on_exceeding_the_resource_limit(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

            exceed_resource_limit(
                &ctx.redis_pool,
                ResourceLimit::CreateReply,
                user_id.unwrap(),
            )
            .await;

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri("/v1/me/replies")
                .set_json(Request {
                    content: "Sample **reply** content!".to_string(),
                    comment_id: "3".to_string(),
                })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert_eq!(res.status(), StatusCode::TOO_MANY_REQUESTS);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("reply"))]
        async fn should_not_insert_a_notification_when_the_user_replies_to_its_own_comment(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

            // Update the writer of the comment.
            let result = sqlx::query(
                r#"
UPDATE comments
SET user_id = $1
WHERE id = $2
"#,
            )
            .bind(user_id.unwrap())
            .bind(3_i64)
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

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

            // Reply should be present in the database, with rendered markdown.
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

            // Should not insert a notification.
            let notification_result = sqlx::query(
                r#"
SELECT EXISTS (
    SELECT 1 FROM notifications
    WHERE entity_id = $1
)
"#,
            )
            .bind(result.get::<i64, _>("id"))
            .fetch_one(&mut *conn)
            .await?;

            assert!(!notification_result.get::<bool, _>("exists"));

            Ok(())
        }
    }
}
