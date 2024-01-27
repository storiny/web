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
    followed_id: String,
}

#[delete("/v1/me/subscriptions/{followed_id}")]
#[tracing::instrument(
    name = "DELETE /v1/me/subscriptions/{followed_id}",
    skip_all,
    fields(
        follower_id = user.id().ok(),
        followed_id = %path.followed_id
    ),
    err
)]
async fn delete(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let follower_id = user.id()?;
    let followed_id = path
        .followed_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid user ID"))?;

    match sqlx::query(
        r#"
UPDATE relations
SET subscribed_at = NULL
WHERE
    follower_id = $1
    AND followed_id = $2
    AND deleted_at IS NULL
"#,
    )
    .bind(follower_id)
    .bind(followed_id)
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
    use time::OffsetDateTime;

    #[sqlx::test(fixtures("subscription"))]
    async fn can_unsubscribe_from_a_relation(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

        // Follow a user.
        let result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
RETURNING subscribed_at
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Should have subscribed initially.
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("subscribed_at")
                .is_some()
        );

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/subscriptions/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Subscription should not be present in the database.
        let result = sqlx::query(
            r#"
SELECT subscribed_at FROM relations
WHERE follower_id = $1 AND followed_id = $2
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("subscribed_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("subscription"))]
    async fn should_not_throw_when_unsubscribing_from_an_already_unsubscribed_relation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

        // Follow a user.
        let result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
RETURNING subscribed_at
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Should have subscribed initially.
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("subscribed_at")
                .is_some()
        );

        // Unsubscribe for the first time.
        let req = test::TestRequest::delete()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/subscriptions/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Try unsubscribing again.
        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/subscriptions/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should not throw.
        assert!(res.status().is_success());

        Ok(())
    }

    #[sqlx::test(fixtures("subscription"))]
    async fn should_not_unsubscribe_from_a_soft_deleted_relation(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

        // Insert a soft-deleted relation.
        let result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id, deleted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::delete()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/subscriptions/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Subscription not found").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_unsubscription_request_for_a_missing_relation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(delete, pool, true, false, None).await;

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/subscriptions/{}", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Subscription not found").await;

        Ok(())
    }
}
