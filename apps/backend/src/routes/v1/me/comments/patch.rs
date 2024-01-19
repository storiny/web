use crate::{
    error::{
        AppError,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    utils::md_to_html::{
        md_to_html,
        MarkdownSource,
    },
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

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(length(min = 1, max = 2048, message = "Invalid content length"))]
    content: String,
}

#[derive(Deserialize, Validate)]
struct Fragments {
    comment_id: String,
}

#[patch("/v1/me/comments/{comment_id}")]
#[tracing::instrument(
    name = "PATCH /v1/me/comments/{comment_id}",
    skip_all,
    fields(
        user_id = user.id().ok(),
        comment_id = %path.comment_id,
        content = %payload.content
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
    let comment_id = path
        .comment_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid comment ID"))?;

    let content = payload.content.trim();
    let rendered_content = if content.is_empty() {
        "".to_string()
    } else {
        md_to_html(MarkdownSource::Response(content))
    };

    match sqlx::query(
        r#"
UPDATE comments
SET
    content = $1,
    rendered_content = $2,
    edited_at = NOW()
WHERE
    user_id = $3
    AND id = $4
    AND deleted_at IS NULL
"#,
    )
    .bind(content)
    .bind(&rendered_content)
    .bind(user_id)
    .bind(comment_id)
    .execute(&data.db_pool)
    .await?
    .rows_affected()
    {
        0 => Err(ToastErrorResponse::new(None, "Comment not found").into()),
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
        assert_toast_error_response,
        init_app_for_test,
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };
    use time::OffsetDateTime;

    #[sqlx::test(fixtures("comment"))]
    async fn can_edit_a_comment(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Insert a comment.
        sqlx::query(
            r#"
INSERT INTO comments (id, content, user_id, story_id)
VALUES ($1, $2, $3, $4)
"#,
        )
        .bind(4_i64)
        .bind("Sample content")
        .bind(user_id)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/comments/{}", 4))
            .set_json(Request {
                content: "Sample **comment** content!".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Comment should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT rendered_content, edited_at FROM comments
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("rendered_content"),
            md_to_html(MarkdownSource::Response("Sample **comment** content!"))
        );
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("edited_at")
                .is_some()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("comment"))]
    async fn should_not_edit_a_soft_deleted_comment(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Insert a comment.
        sqlx::query(
            r#"
INSERT INTO comments (id, content, user_id, story_id)
VALUES ($1, $2, $3, $4)
"#,
        )
        .bind(4_i64)
        .bind("Sample content")
        .bind(user_id)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Soft-delete the comment.
        let update_result = sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(update_result.rows_affected(), 1);

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/comments/{}", 4))
            .set_json(Request {
                content: "Sample **comment** content!".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Comment not found").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_an_error_response_when_editing_an_unknown_comment(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(patch, pool, true, false, None).await;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/comments/{}", 12345))
            .set_json(Request {
                content: "Sample **comment** content!".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Comment not found").await;

        Ok(())
    }
}
