use crate::{
    error::{
        AppError,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
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

#[derive(Deserialize, Validate)]
struct Fragments {
    comment_id: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    hidden: bool,
}

#[post("/v1/public/comments/{comment_id}/visibility")]
#[tracing::instrument(
    name = "POST /v1/public/comments/{comment_id}/visibility",
    skip_all,
    fields(
        user_id = user.id().ok(),
        comment_id = %path.comment_id,
        payload
    ),
    err
)]
async fn post(
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

    match sqlx::query(
        r#"
UPDATE comments c
SET hidden = $3
WHERE
    c.id = $2
    AND EXISTS (
        SELECT 1 FROM stories s
        WHERE
            s.id = c.story_id
            AND s.user_id = $1
            AND s.published_at IS NOT NULL
            AND s.deleted_at IS NULL
    )
    AND c.deleted_at IS NULL
"#,
    )
    .bind(user_id)
    .bind(comment_id)
    .bind(payload.hidden)
    .execute(&data.db_pool)
    .await?
    .rows_affected()
    {
        0 => Err(ToastErrorResponse::new(None, "Comment not found").into()),
        _ => Ok(HttpResponse::NoContent().finish()),
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

    #[sqlx::test(fixtures("visibility"))]
    async fn can_hide_and_unhide_a_comment(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Hide the comment.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/public/comments/{}/visibility", 2))
            .set_json(Request { hidden: true })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // `hidden` should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT hidden FROM comments
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("hidden"));

        // Unhide the comment.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/public/comments/{}/visibility", 2))
            .set_json(Request { hidden: false })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // `hidden` should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT hidden FROM comments
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("hidden"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_a_missing_comment(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/public/comments/12345/visibility")
            .set_json(Request { hidden: false })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Comment not found").await;

        Ok(())
    }

    #[sqlx::test(fixtures("visibility"))]
    async fn should_not_hide_comment_on_a_story_published_by_a_different_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Change the writer of the story.
        let result = sqlx::query(
            r#"
WITH new_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('New user', 'new_user', 'new@example.com')
    RETURNING id
)
UPDATE stories
SET user_id = (SELECT id FROM new_user)
WHERE user_id = $1
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/public/comments/{}/visibility", 2))
            .set_json(Request { hidden: true })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Comment not found").await;

        Ok(())
    }

    #[sqlx::test(fixtures("visibility"))]
    async fn should_not_hide_a_soft_deleted_comment(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Soft-delete the comment.
        let result = sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/public/comments/{}/visibility", 2))
            .set_json(Request { hidden: true })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Comment not found").await;

        Ok(())
    }
}
