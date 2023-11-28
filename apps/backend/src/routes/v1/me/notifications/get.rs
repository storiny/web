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
use serde_with::{
    serde_as,
    DisplayFromStr,
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
    static ref TYPE_REGEX: Regex = Regex::new(r"^(unread|following|friends|all)$").unwrap();
}

#[derive(Serialize, Deserialize, Validate)]
struct QueryParams {
    #[validate(range(min = 1, max = 1000))]
    page: Option<u16>,
    #[validate(regex = "TYPE_REGEX")]
    r#type: Option<String>,
}

#[serde_as]
#[derive(Debug, Serialize, Deserialize)]
struct Actor {
    #[serde_as(as = "DisplayFromStr")]
    id: i64,
    name: String,
    username: String,
    avatar_id: Option<Uuid>,
    avatar_hex: Option<String>,
    public_flags: i32,
}

#[serde_as]
#[derive(Debug, FromRow, Serialize, Deserialize)]
struct Notification {
    #[serde_as(as = "DisplayFromStr")]
    id: i64,
    rendered_content: String,
    r#type: i16,
    // Timestamps
    #[serde(with = "crate::iso8601::time")]
    created_at: OffsetDateTime,
    #[serde(with = "crate::iso8601::time::option")]
    read_at: Option<OffsetDateTime>,
    // Joins
    actor: Option<Json<Actor>>,
}

#[get("/v1/me/notifications")]
async fn get(
    query: QsQuery<QueryParams>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let page = query.page.clone().unwrap_or(1) - 1;
    let r#type = query.r#type.clone().unwrap_or("unread".to_string());

    match user.id() {
        Ok(user_id) => {
            let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
                r#"
                SELECT 
                    nu.notification_id AS "id",
                    nu.read_at,
                    nu.created_at,
                    -- Render notification content
                    CASE
                        WHEN nu.rendered_content IS NULL
                            THEN
                            public.render_notification_content("nu->notification".entity_type, nu.*)
                        ELSE nu.rendered_content
                    END AS "rendered_content",
                    "nu->notification".entity_type AS "type",
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
                "#,
            );

            if r#type == "following" {
                query_builder.push(
                    r#"
                    -- Notifications from followed users
                    INNER JOIN relations r
                        ON r.follower_id = $1 AND r.followed_id = notifier.id AND r.deleted_at IS NULL
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
                      ) AND
                        f.accepted_at IS NOT NULL
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
                query_builder.push(" AND nu.read_at IS NULL");
            }

            query_builder.push(
                r#"
                ORDER BY
                    nu.created_at DESC
                "#,
            );

            query_builder.push(" LIMIT $2 OFFSET $3");

            let result = query_builder
                .build_query_as::<Notification>()
                .bind(user_id)
                .bind(10_i16)
                .bind((page * 10) as i16)
                .fetch_all(&data.db_pool)
                .await?;

            Ok(HttpResponse::Ok().json(result))
        }
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
    }
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

        // Receive some notifications
        let insert_result = sqlx::query(
            r#"
            INSERT INTO notification_outs(notified_id, notification_id)
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
    async fn can_return_system_notifications(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Receive a system notification
        let insert_result = sqlx::query(
            r#"
            INSERT INTO notification_outs(notified_id, notification_id)
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

        // Receive some notifications
        let insert_result = sqlx::query(
            r#"
            INSERT INTO notification_outs(notified_id, notification_id)
            VALUES ($1, $2), ($1, $3)
            "#,
        )
        .bind(user_id.unwrap())
        .bind(4_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the notifications initially
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/notifications?type=unread")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Notification>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Read one of the notifications
        let result = sqlx::query(
            r#"
            UPDATE notification_outs
            SET read_at = now()
            WHERE notification_id = $1
            "#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one unread notification
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

        // Receive some notifications
        let insert_result = sqlx::query(
            r#"
            INSERT INTO notification_outs(notified_id, notification_id)
            VALUES ($1, $2), ($1, $3)
            "#,
        )
        .bind(user_id.unwrap())
        .bind(4_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should not return any notifications initially
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/notifications?type=following")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Notification>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 0);

        // Follow the user
        let result = sqlx::query(
            r#"
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one notification from the followed user
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

        // Receive some notifications
        let insert_result = sqlx::query(
            r#"
            INSERT INTO notification_outs(notified_id, notification_id)
            VALUES ($1, $2), ($1, $3)
            "#,
        )
        .bind(user_id.unwrap())
        .bind(4_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should not return any notifications initially
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/notifications?type=friends")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Notification>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 0);

        // Add a friend
        let result = sqlx::query(
            r#"
            INSERT INTO friends(transmitter_id, receiver_id, accepted_at)
            VALUES ($1, $2, now())
            "#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one notification from the friend
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

        // Receive some notifications
        let insert_result = sqlx::query(
            r#"
            INSERT INTO notification_outs(notified_id, notification_id)
            VALUES ($1, $2), ($1, $3)
            "#,
        )
        .bind(user_id.unwrap())
        .bind(4_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Follow the user
        let result = sqlx::query(
            r#"
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one notification from the followed user initially
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/notifications?type=following")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Notification>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert_eq!(json[0].actor.as_ref().unwrap().id, 2_i64);

        // Soft-delete the followed relation
        let result = sqlx::query(
            r#"
            UPDATE relations
            SET deleted_at = now()
            WHERE follower_id = $1 AND followed_id = $2
            "#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should not return any notifications
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

        // Receive some notifications
        let insert_result = sqlx::query(
            r#"
            INSERT INTO notification_outs(notified_id, notification_id)
            VALUES ($1, $2), ($1, $3)
            "#,
        )
        .bind(user_id.unwrap())
        .bind(4_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Add a friend
        let result = sqlx::query(
            r#"
            INSERT INTO friends(transmitter_id, receiver_id, accepted_at)
            VALUES ($1, $2, now())
            "#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one notification from the friend initially
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/notifications?type=friends")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Notification>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert_eq!(json[0].actor.as_ref().unwrap().id, 2_i64);

        // Soft-delete the friend relation
        let result = sqlx::query(
            r#"
            UPDATE friends
            SET deleted_at = now()
            WHERE transmitter_id = $1 AND receiver_id = $2
            "#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should not return any notifications
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

        // Receive some notifications
        let insert_result = sqlx::query(
            r#"
            INSERT INTO notification_outs(notified_id, notification_id)
            VALUES ($1, $2), ($1, $3)
            "#,
        )
        .bind(user_id.unwrap())
        .bind(4_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Send a friend request
        let result = sqlx::query(
            r#"
            INSERT INTO friends(transmitter_id, receiver_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should not return any notifications initially
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/notifications?type=friends")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Notification>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 0);

        // Accept the friend request
        let result = sqlx::query(
            r#"
            UPDATE friends
            SET accepted_at = now()
            WHERE transmitter_id = $1 AND receiver_id = $2
            "#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return the notifications from friend
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
