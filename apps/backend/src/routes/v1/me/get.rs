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
use serde::{
    Deserialize,
    Serialize,
};

use sqlx::{
    postgres::PgRow,
    FromRow,
    Row,
};
use time::OffsetDateTime;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
struct Status {
    duration: i16,
    emoji: Option<String>,
    text: Option<String>,
    #[serde(with = "crate::iso8601::time::option")]
    expires_at: Option<OffsetDateTime>,
    visibility: i16,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct User {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    name: String,
    username: String,
    email: String,
    bio: String,
    wpm: i16,
    location: String,
    avatar_id: Option<Uuid>,
    avatar_hex: Option<String>,
    banner_id: Option<Uuid>,
    banner_hex: Option<String>,
    allow_sensitive_content: bool,
    public_flags: i32,
    // Stats
    follower_count: i32,
    following_count: i32,
    friend_count: i32,
    // Joins
    status: Option<Status>,
}

#[get("/v1/me")]
#[tracing::instrument(
    name = "GET /v1/me",
    skip_all,
    fields(user_id = user.id().ok()),
    err
)]
async fn get(data: web::Data<AppState>, user: Identity) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;

    let user = sqlx::query(
        r#"
SELECT
    u.id,
    u.name,
    u.username,
    u.email::TEXT,
    u.bio,
    u.wpm,
    u.location,
    u.avatar_id,
    u.avatar_hex,
    u.banner_id,
    u.banner_hex,
    u.follower_count,
    u.following_count,
    u.friend_count,
    u.public_flags,
    u.allow_sensitive_content,
    -- Use a discrete column to deserialize it into `OffsetDateTime`.
    status.expires_at AS "status_expires_at",
    status.duration AS "status_duration",
    status.emoji AS "status_emoji",
    status.text AS "status_text",
    status.visibility AS "status_visibility",
    status.user_id IS NOT NULL AS "has_status"
FROM
    users u
        LEFT OUTER JOIN user_statuses AS status
            ON u.id = status.user_id
            AND (
                status.expires_at IS NULL
                OR status.expires_at > NOW()
            )
WHERE
      u.id = $1
  AND u.deactivated_at IS NULL
  AND u.deleted_at IS NULL
"#,
    )
    .bind(user_id)
    .map(|row: PgRow| User {
        id: row.get("id"),
        name: row.get("name"),
        username: row.get("username"),
        email: row.get("email"),
        bio: row.get("bio"),
        wpm: row.get("wpm"),
        location: row.get("location"),
        avatar_id: row.get("avatar_id"),
        avatar_hex: row.get("avatar_hex"),
        banner_id: row.get("banner_id"),
        banner_hex: row.get("banner_hex"),
        allow_sensitive_content: row.get("allow_sensitive_content"),
        public_flags: row.get("public_flags"),
        // Stats
        follower_count: row.get("follower_count"),
        following_count: row.get("following_count"),
        friend_count: row.get("friend_count"),
        // Joins
        status: if row.get::<bool, _>("has_status") {
            Some(Status {
                duration: row.get("status_duration"),
                emoji: row.get("status_emoji"),
                text: row.get("status_text"),
                expires_at: row.get("status_expires_at"),
                visibility: row.get("status_visibility"),
            })
        } else {
            None
        },
    })
    .fetch_one(&data.db_pool)
    .await?;

    Ok(HttpResponse::Ok().json(user))
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
    use time::Duration;

    #[sqlx::test]
    async fn can_return_user(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, false, None).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<User>(&res_to_string(res).await);

        assert!(json.is_ok());

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_user_with_status(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert the status.
        let insert_result = sqlx::query(
            r#"
INSERT INTO user_statuses (user_id, text, emoji, expires_at) 
VALUES ($1, $2, $3, $4)
"#,
        )
        .bind(user_id.unwrap())
        .bind("Status text")
        .bind("1f90c")
        .bind(OffsetDateTime::now_utc() + Duration::days(1))
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<User>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert!(json.unwrap().status.is_some());

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_return_an_expired_status(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert an expired status.
        let insert_result = sqlx::query(
            r#"
INSERT INTO user_statuses (user_id, text, emoji, expires_at) 
VALUES ($1, $2, $3, $4)
"#,
        )
        .bind(user_id.unwrap())
        .bind("Status text")
        .bind("1f90c")
        .bind(OffsetDateTime::now_utc() - Duration::days(1))
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<User>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert!(json.unwrap().status.is_none());

        Ok(())
    }
}
