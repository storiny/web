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
    blog_id: String,
}

#[delete("/v1/me/newsletters/{blog_id}")]
#[tracing::instrument(
    name = "DELETE /v1/me/newsletters/{blog_id}",
    skip_all,
    fields(
        user_id = user.id().ok(),
        blog_id = %path.blog_id
    ),
    err
)]
async fn delete(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let blog_id = path
        .blog_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid blog ID"))?;

    match sqlx::query(
        r#"
DELETE FROM subscribers
WHERE
    email = (
        SELECT email
        FROM users
        WHERE
            id = $1
    )
    AND blog_id = $2
"#,
    )
    .bind(user_id)
    .bind(blog_id)
    .execute(&data.db_pool)
    .await?
    .rows_affected()
    {
        0 => Err(AppError::from("Subscription not found")),
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

    #[sqlx::test(fixtures("newsletter"))]
    async fn can_unsubscribe_from_a_newsletter(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

        // Subscribe to a newsletter.
        let result = sqlx::query(
            r#"
WITH target_user AS (
    SELECT email
    FROM users
    WHERE id = $1
)
INSERT INTO subscribers (email, blog_id)
VALUES ((SELECT email FROM target_user), $2)
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/newsletters/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Subscription should not be present in the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT FROM subscribers
    WHERE blog_id = $1
)
"#,
        )
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_an_error_response_when_unsubscribing_from_an_unknown_newsletter(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(delete, pool, true, false, None).await;

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/newsletters/{}", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Subscription not found").await;

        Ok(())
    }
}
