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
    reply_id: String,
}

#[delete("/v1/me/liked-replies/{reply_id}")]
#[tracing::instrument(
    name = "DELETE /v1/me/liked-replies/{reply_id}",
    skip_all,
    fields(
        user_id = user.id().ok(),
        reply_id = %path.reply_id
    ),
    err
)]
async fn delete(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let reply_id = path
        .reply_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid reply ID"))?;

    match sqlx::query(
        r#"
DELETE FROM reply_likes
WHERE
    user_id = $1
    AND reply_id = $2
"#,
    )
    .bind(user_id)
    .bind(reply_id)
    .execute(&data.db_pool)
    .await?
    .rows_affected()
    {
        0 => Err(AppError::from("Reply like not found")),
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

    #[sqlx::test(fixtures("liked_reply"))]
    async fn can_unlike_a_reply(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

        // Like a reply.
        let result = sqlx::query(
            r#"
INSERT INTO reply_likes (user_id, reply_id)
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
            .uri(&format!("/v1/me/liked-replies/{}", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Reply like should not be present in the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM reply_likes
    WHERE user_id = $1 AND reply_id = $2
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
    async fn can_return_an_error_response_when_unliking_an_unknown_reply(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(delete, pool, true, false, None).await;

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/liked-replies/{}", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Reply like not found").await;

        Ok(())
    }
}
