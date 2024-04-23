use crate::{
    error::{
        AppError,
        ToastErrorResponse,
    },
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
    subscriber_id: String,
}

#[delete("/v1/me/blogs/{blog_id}/subscribers/{subscriber_id}")]
#[tracing::instrument(
    name = "DELETE /v1/me/blogs/{blog_id}/subscribers/{subscriber_id}",
    skip_all,
    fields(
        user_id = user.id().ok(),
        subscriber_id = %path.subscriber_id,
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

    let subscriber_id = path
        .subscriber_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid subscriber ID"))?;

    match sqlx::query(
        r#"
DELETE FROM subscribers s
USING blogs b
WHERE
    s.blog_id = $2
    AND s.id = $1
    AND s.blog_id = b.id
    AND b.user_id = $3
"#,
    )
    .bind(subscriber_id)
    .bind(blog_id)
    .bind(user_id)
    .execute(&data.db_pool)
    .await?
    .rows_affected()
    {
        0 => Err(ToastErrorResponse::new(None, "Subscriber not found").into()),
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
        assert_toast_error_response,
        init_app_for_test,
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test(fixtures("subscriber"))]
    async fn can_remove_a_subscriber(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

        // Add a subscriber.
        let insert_result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Subscriber 1', 'subscriber_1', 'subscriber_1@example.com')
    RETURNING email
)
INSERT INTO subscribers (email, blog_id)
VALUES ((SELECT email FROM inserted_user), $1)
RETURNING id
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        let req = test::TestRequest::delete()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/subscribers/{}",
                3_i64,
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should reject the request initially.
        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Subscriber not found").await;

        // Change the owner of the blog.
        let result = sqlx::query(
            r#"
UPDATE blogs
SET user_id = $1
WHERE id = $2
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/subscribers/{}",
                3_i64,
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Subscriber should not be present in the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM subscribers
    WHERE id = $1
)
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_an_error_response_when_trying_to_remove_an_unknown_subscriber(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(delete, pool, true, false, None).await;

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{}/subscribers/{}", 3_i64, 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Subscriber not found").await;

        Ok(())
    }
}
