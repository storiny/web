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
    comment_id: String,
}

#[delete("/v1/me/liked-comments/{comment_id}")]
#[tracing::instrument(
    name = "DELETE /v1/me/liked-comments/{comment_id}",
    skip_all,
    fields(
        user_id = user.id().ok(),
        comment_id = %path.comment_id
    ),
    err
)]
async fn delete(
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
DELETE FROM comment_likes
WHERE
    user_id = $1
    AND comment_id = $2
"#,
    )
    .bind(user_id)
    .bind(comment_id)
    .execute(&data.db_pool)
    .await?
    .rows_affected()
    {
        0 => Err(AppError::from("Comment like not found")),
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

    #[sqlx::test(fixtures("liked_comment"))]
    async fn can_unlike_a_comment(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

        // Like a comment.
        let result = sqlx::query(
            r#"
INSERT INTO comment_likes (user_id, comment_id)
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
            .uri(&format!("/v1/me/liked-comments/{}", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Comment like should not be present in the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM comment_likes
    WHERE user_id = $1 AND comment_id = $2
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
    async fn can_return_an_error_response_when_unliking_an_unknown_comment(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(delete, pool, true, false, None).await;

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/liked-comments/{}", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Comment like not found").await;

        Ok(())
    }
}
