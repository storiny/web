use crate::{
    error::AppError,
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_web::{
    get,
    web,
    HttpResponse,
};
use actix_web_validator::QsQuery;
use lazy_static::lazy_static;
use regex::Regex;
use serde::{
    Deserialize,
    Serialize,
};

use sqlx::{
    types::Json,
    FromRow,
    Postgres,
    QueryBuilder,
};
use time::OffsetDateTime;
use uuid::Uuid;
use validator::Validate;

lazy_static! {
    static ref TYPE_REGEX: Regex = {
        #[allow(clippy::unwrap_used)]
        Regex::new(r"^(unread|following|friends|all)$").unwrap()
    };
}

#[derive(Serialize, Deserialize, Validate)]
struct QueryParams {
    #[validate(range(min = 1, max = 1000))]
    page: Option<u16>,
    #[validate(regex = "TYPE_REGEX")]
    r#type: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Actor {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    name: String,
    username: String,
    avatar_id: Option<Uuid>,
    avatar_hex: Option<String>,
    public_flags: i32,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct Notification {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    rendered_content: String,
    r#type: i16,
    // Timestamps
    #[serde(with = "crate::iso8601::time")]
    created_at: OffsetDateTime,
    #[serde(with = "crate::iso8601::time::option")]
    read_at: Option<OffsetDateTime>,
    // Boolean flags
    is_subscribed: bool,
    // Joins
    actor: Option<Json<Actor>>,
}

#[get("/v1/me/notifications")]
#[tracing::instrument(
    name = "GET /v1/me/notifications",
    skip_all,
    fields(
        user_id = user.id().ok(),
        r#type = query.r#type,
        page = query.page
    ),
    err
)]
async fn get(
    query: QsQuery<QueryParams>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;

    let page = query.page.unwrap_or(1) - 1;
    let r#type = query.r#type.clone().unwrap_or("unread".to_string());

    let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
        r#"
SELECT 
    nu.notification_id AS "id",
    nu.read_at,
    nu.created_at,
    -- Render notification content
    CASE
        WHEN
            nu.rendered_content IS NULL
            -- Also render login attempts (entity_type = 2) with this function, because
            -- their `rendered_content` column contains the login data (`device:location`).
            OR "nu->notification".entity_type = 2
            THEN
            public.render_notification_content("nu->notification".entity_type, nu.*)
        ELSE nu.rendered_content
    END AS "rendered_content",
    "nu->notification".entity_type AS "type",
    -- Boolean flags
    CASE WHEN (
                -- 3 = Friend request accept, 4 = Friend request received
                (ns.push_friend_requests IS TRUE AND ("nu->notification".entity_type = 3 OR "nu->notification".entity_type = 4))
            OR
                -- 5 = Follower add
                (ns.push_followers IS TRUE AND "nu->notification".entity_type = 5)
            OR
                -- 6 = Comment add
                (ns.push_comments IS TRUE AND "nu->notification".entity_type = 6)
            OR
                -- 7 = Reply add
                (ns.push_replies IS TRUE AND "nu->notification".entity_type = 7)
            OR
                -- 9 = Story like
                (ns.push_story_likes IS TRUE AND "nu->notification".entity_type = 9)
            OR
                -- 10 = Story add by user
                (ns.push_stories IS TRUE AND "nu->notification".entity_type = 10)
            OR
                -- 11 = Story add by tag
                (ns.push_tags IS TRUE AND "nu->notification".entity_type = 11)
            OR
                -- 12 = Collaboration request accept, 13 = Collaboration request received
                (ns.push_collaboration_requests IS TRUE AND ("nu->notification".entity_type = 12 OR "nu->notification".entity_type = 13))
            OR
                -- 14 = Blog editor invite, 15 = Blog writer invite
                (ns.push_blog_requests IS TRUE AND ("nu->notification".entity_type = 14 OR "nu->notification".entity_type = 15))
            )
        THEN TRUE
        ELSE FALSE
    END AS "is_subscribed",
    -- Actor
    CASE
        WHEN notifier.id IS NOT NULL
        THEN
            JSON_BUILD_OBJECT(
                'id', notifier.id,
                'name', notifier.name,
                'username', notifier.username,
                'avatar_id', notifier.avatar_id,
                'avatar_hex', notifier.avatar_hex,
                'public_flags', notifier.public_flags
            )
    END AS "actor"
FROM
    notification_outs nu
        -- Join notification
        INNER JOIN notifications AS "nu->notification"
           ON nu.notification_id = "nu->notification".id
        -- Join notification user
        LEFT OUTER JOIN users AS notifier
            ON "nu->notification".notifier_id = notifier.id
        -- Join notification settings of the current user
        INNER JOIN notification_settings AS ns
            ON ns.user_id = $1
"#,
    );

    if r#type == "following" {
        query_builder.push(
            r#"
-- Notifications from followed users
INNER JOIN relations r
    ON r.follower_id = $1
    AND r.followed_id = notifier.id
    AND r.deleted_at IS NULL
"#,
        );
    } else if r#type == "friends" {
        query_builder.push(
            r#"
-- Notifications from friends
INNER JOIN friends f
    ON (
      (f.transmitter_id = $1 AND f.receiver_id = notifier.id)
      OR
      (f.transmitter_id = notifier.id AND f.receiver_id = $1)
    )
    AND f.accepted_at IS NOT NULL
    AND f.deleted_at IS NULL
"#,
        );
    }

    query_builder.push(
        r#"
WHERE
    nu.notified_id = $1
"#,
    );

    if r#type == "unread" {
        query_builder.push(" AND nu.read_at IS NULL ");
    }

    query_builder.push(
        r#"
ORDER BY
    nu.created_at DESC
"#,
    );

    query_builder.push(" LIMIT $2 OFFSET $3 ");

    let result = query_builder
        .build_query_as::<Notification>()
        .bind(user_id)
        .bind(10_i16)
        .bind((page * 10) as i16)
        .fetch_all(&data.db_pool)
        .await?;

    Ok(HttpResponse::Ok().json(result))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        init_app_for_test,
        res_to_string,
    };
    use actix_web::test;
    use sqlx::PgPool;

    #[sqlx::test(fixtures("notification"))]
    async fn can_return_notifications(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Receive some notifications.
        let insert_result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id)
VALUES ($1, $2), ($1, $3)
"#,
        )
        .bind(user_id.unwrap())
        .bind(4_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/notifications")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Notification>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("notification"))]
    async fn can_return_is_subscribed_flag_for_notifications(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Receive a notifications.
        let insert_result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/notifications")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true` initially as users are subscribed to all the notifications by default.
        let json = serde_json::from_str::<Vec<Notification>>(&res_to_string(res).await).unwrap();
        assert!(json.iter().all(|notification| notification.is_subscribed));

        // Update notification settings for the current user.
        let result = sqlx::query(
            r#"
UPDATE notification_settings
SET push_followers = FALSE
WHERE user_id = $1
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/notifications")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be false.
        let json = serde_json::from_str::<Vec<Notification>>(&res_to_string(res).await).unwrap();
        assert!(json.iter().all(|notification| !notification.is_subscribed));

        Ok(())
    }

    #[sqlx::test(fixtures("notification"))]
    async fn can_return_system_notifications(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Receive a system notification.
        let insert_result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(6_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/notifications")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Notification>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("notification"))]
    async fn can_return_unread_notifications(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Receive some notifications.
        let insert_result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id)
VALUES ($1, $2), ($1, $3)
"#,
        )
        .bind(user_id.unwrap())
        .bind(4_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the notifications initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/notifications?type=unread")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Notification>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Read one of the notifications.
        let result = sqlx::query(
            r#"
UPDATE notification_outs
SET read_at = NOW()
WHERE notification_id = $1
"#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one unread notification.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/notifications?type=unread")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Notification>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert!(json[0].read_at.is_none());

        Ok(())
    }

    #[sqlx::test(fixtures("notification"))]
    async fn can_return_notifications_from_followed_users(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Receive some notifications.
        let insert_result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id)
VALUES ($1, $2), ($1, $3)
"#,
        )
        .bind(user_id.unwrap())
        .bind(4_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should not return any notifications initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/notifications?type=following")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Notification>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 0);

        // Follow the user.
        let result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one notification from the followed user.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/notifications?type=following")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Notification>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert_eq!(json[0].actor.as_ref().unwrap().id, 2_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("notification"))]
    async fn can_return_notifications_from_friends(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Receive some notifications.
        let insert_result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id)
VALUES ($1, $2), ($1, $3)
"#,
        )
        .bind(user_id.unwrap())
        .bind(4_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should not return any notifications initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/notifications?type=friends")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Notification>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 0);

        // Add a friend.
        let result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one notification from the friend.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/notifications?type=friends")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Notification>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert_eq!(json[0].actor.as_ref().unwrap().id, 2_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("notification"))]
    async fn should_not_return_notifications_from_soft_deleted_followed_users(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Receive some notifications.
        let insert_result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id)
VALUES ($1, $2), ($1, $3)
"#,
        )
        .bind(user_id.unwrap())
        .bind(4_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Follow the user.
        let result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one notification from the followed user initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/notifications?type=following")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Notification>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert_eq!(json[0].actor.as_ref().unwrap().id, 2_i64);

        // Soft-delete the followed relation.
        let result = sqlx::query(
            r#"
UPDATE relations
SET deleted_at = NOW()
WHERE follower_id = $1 AND followed_id = $2
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should not return any notifications.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/notifications?type=following")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Notification>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("notification"))]
    async fn should_not_return_notifications_from_soft_deleted_friends(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Receive some notifications.
        let insert_result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id)
VALUES ($1, $2), ($1, $3)
"#,
        )
        .bind(user_id.unwrap())
        .bind(4_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Add a friend.
        let result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one notification from the friend initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/notifications?type=friends")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Notification>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert_eq!(json[0].actor.as_ref().unwrap().id, 2_i64);

        // Soft-delete the friend relation.
        let result = sqlx::query(
            r#"
UPDATE friends
SET deleted_at = NOW()
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should not return any notifications.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/notifications?type=friends")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Notification>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("notification"))]
    async fn should_not_return_notifications_from_pending_friends(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Receive some notifications.
        let insert_result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id)
VALUES ($1, $2), ($1, $3)
"#,
        )
        .bind(user_id.unwrap())
        .bind(4_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Send a friend request.
        let result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should not return any notifications initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/notifications?type=friends")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Notification>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 0);

        // Accept the friend request.
        let result = sqlx::query(
            r#"
UPDATE friends
SET accepted_at = NOW()
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return the notifications from friend.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/notifications?type=friends")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Notification>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert_eq!(json[0].actor.as_ref().unwrap().id, 2_i64);

        Ok(())
    }
}
