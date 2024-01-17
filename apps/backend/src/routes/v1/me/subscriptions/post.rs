use crate::{
    error::AppError,
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_web::{
    post,
    web,
    HttpResponse,
};
use serde::Deserialize;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    followed_id: String,
}

#[post("/v1/me/subscriptions/{followed_id}")]
#[tracing::instrument(
    name = "POST /v1/me/subscriptions/{followed_id}",
    skip_all,
    fields(
        follower_id = user.id().ok(),
        followed_id = %path.followed_id
    ),
    err
)]
async fn post(
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
SET subscribed_at = NOW()
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
    cfg.service(post);
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
    async fn can_subscribe_to_a_relation(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Follow a user without subscribing.
        let result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id, subscribed_at)
VALUES ($1, $2, NULL)
RETURNING subscribed_at
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Should be NULL initially.
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("subscribed_at")
                .is_none()
        );

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/subscriptions/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Subscription should be present in the database.
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
                .is_some()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("subscription"))]
    async fn should_not_throw_when_subscribing_to_an_already_subscribed_relation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Follow a user without subscribing.
        let result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id, subscribed_at)
VALUES ($1, $2, NULL)
RETURNING subscribed_at
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Should be NULL initially.
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("subscribed_at")
                .is_none()
        );

        // Subscribe for the first time.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/subscriptions/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Try subscribing again.
        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/subscriptions/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should not throw.
        assert!(res.status().is_success());

        Ok(())
    }

    #[sqlx::test(fixtures("subscription"))]
    async fn should_not_subscribe_to_a_soft_deleted_relation(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Insert a soft-deleted relation.
        let result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id, subscribed_at, deleted_at)
VALUES ($1, $2, NULL, NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/subscriptions/{}", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Subscription not found").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_subscription_request_for_a_missing_relation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/subscriptions/{}", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Subscription not found").await;

        Ok(())
    }
}
