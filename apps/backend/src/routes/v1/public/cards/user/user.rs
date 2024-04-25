use crate::{
    error::AppError,
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_http::StatusCode;
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
    Postgres,
    QueryBuilder,
    Row,
};
use uuid::Uuid;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    identifier: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct Status {
    emoji: Option<String>,
    text: Option<String>,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct User {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    name: String,
    username: String,
    rendered_bio: String,
    avatar_id: Option<Uuid>,
    avatar_hex: Option<String>,
    banner_id: Option<Uuid>,
    banner_hex: Option<String>,
    public_flags: i32,
    // Stats
    story_count: i32,
    follower_count: i32,
    // Joins
    status: Option<Status>,
    // Boolean flags
    is_following: bool,
    is_plus_member: bool,
}

#[get("/v1/public/cards/user/{identifier}")]
#[tracing::instrument(
    name = "GET /v1/public/cards/user/{identifier}",
    skip_all,
    fields(
        current_user_id = tracing::field::Empty,
        identifier = %path.identifier
    ),
    err
)]
async fn get(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    maybe_user: Option<Identity>,
) -> Result<HttpResponse, AppError> {
    let current_user_id = maybe_user.map(|user| user.id()).transpose()?;

    tracing::Span::current().record("current_user_id", current_user_id);

    // Identifier can be username or an ID
    let is_identifier_number = path.identifier.parse::<i64>().is_ok();

    let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
        r#"
SELECT
    u.id,
    u.name,
    u.username,
    u.rendered_bio,
    u.avatar_id,
    u.avatar_hex,
    u.banner_id,
    u.banner_hex,
    u.story_count,
    u.follower_count,
    u.public_flags,
    u.is_plus_member,
    status.emoji AS "status_emoji",
    status.text AS "status_text",
"#,
    );

    query_builder.push(if current_user_id.is_some() {
        r#"
CASE
    WHEN status.user_id IS NOT NULL AND (
        -- Global
        status.visibility = 1
        -- Followers
        OR (status.visibility = 2 AND "u->is_following".follower_id IS NOT NULL)
        -- Friends
        OR (status.visibility = 3 AND "u->is_friend".transmitter_id IS NOT NULL)
        -- Self
        OR u.id = $2
    )
        THEN TRUE
    ELSE FALSE
END AS "has_status",
-- Boolean flags
"u->is_following".follower_id IS NOT NULL AS "is_following"
"#
    } else {
        r#"
CASE
    WHEN status.user_id IS NOT NULL AND (
        -- Global
        status.visibility = 1
    )
        THEN TRUE
    ELSE FALSE
END AS "has_status",
-- Boolean flags
FALSE AS "is_following"
"#
    });

    query_builder.push(
        r#"
FROM
    users u
        -- Join status
        LEFT OUTER JOIN user_statuses AS status
            ON u.id = status.user_id
            AND (
                status.expires_at IS NULL
                OR status.expires_at > NOW()
            )
"#,
    );

    if current_user_id.is_some() {
        query_builder.push(
            r#"
-- Boolean following flag
LEFT OUTER JOIN relations AS "u->is_following"
    ON "u->is_following".followed_id = u.id
        AND "u->is_following".follower_id = $2
        AND "u->is_following".deleted_at IS NULL
-- Boolean friend flag
LEFT OUTER JOIN friends AS "u->is_friend"
    ON (
        ("u->is_friend".transmitter_id = u.id AND "u->is_friend".receiver_id = $2)
        OR
        ("u->is_friend".receiver_id = u.id AND "u->is_friend".transmitter_id = $2)
    )
        AND "u->is_friend".accepted_at IS NOT NULL
        AND "u->is_friend".deleted_at IS NULL
"#,
        );
    }

    query_builder.push(" WHERE ");

    query_builder.push(if is_identifier_number {
        r#"
(u.id = $1::BIGINT OR u.username = $1)
"#
    } else {
        // The identifier is definitely not an ID
        r#"
u.username = $1
"#
    });

    query_builder.push(if current_user_id.is_some() {
        r#"
-- Make sure to handle private users
AND (
    NOT u.is_private OR
    "u->is_friend".transmitter_id IS NOT NULL
)
"#
    } else {
        r#"
-- Ignore private users
AND u.is_private IS FALSE
"#
    });

    query_builder.push(
        r#"
AND u.deactivated_at IS NULL
AND u.deleted_at IS NULL
"#,
    );

    let mut db_query = query_builder.build().bind(&path.identifier);

    if let Some(user_id) = current_user_id {
        db_query = db_query.bind(user_id);
    }

    let user = db_query
        .map(|row: PgRow| User {
            id: row.get("id"),
            name: row.get("name"),
            username: row.get("username"),
            rendered_bio: row.get("rendered_bio"),
            avatar_id: row.get("avatar_id"),
            avatar_hex: row.get("avatar_hex"),
            banner_id: row.get("banner_id"),
            banner_hex: row.get("banner_hex"),
            public_flags: row.get("public_flags"),
            // Stats
            story_count: row.get("story_count"),
            follower_count: row.get("follower_count"),
            // Joins
            status: if row.get::<bool, _>("has_status") {
                Some(Status {
                    emoji: row.get("status_emoji"),
                    text: row.get("status_text"),
                })
            } else {
                None
            },
            // Boolean flags
            is_following: row.get::<bool, _>("is_following"),
            is_plus_member: row.get::<bool, _>("is_plus_member"),
        })
        .fetch_one(&data.db_pool)
        .await
        .map_err(|error| {
            if matches!(error, sqlx::Error::RowNotFound) {
                AppError::ClientError(StatusCode::NOT_FOUND, "Unknown or private user".to_string())
            } else {
                AppError::SqlxError(error)
            }
        })?;

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
    use time::{
        Duration,
        OffsetDateTime,
    };

    #[sqlx::test(fixtures("user"))]
    async fn can_return_user_card_by_id(pool: PgPool) -> sqlx::Result<()> {
        let (app, _, _) = init_app_for_test(get, pool, false, false, None).await;

        let req = test::TestRequest::get()
            .uri(&format!("/v1/public/cards/user/{}", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<User>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert!(!json.unwrap().is_following);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_return_user_card_by_username(pool: PgPool) -> sqlx::Result<()> {
        let (app, _, _) = init_app_for_test(get, pool, false, false, None).await;

        let req = test::TestRequest::get()
            .uri(&format!("/v1/public/cards/user/{}", "test_user"))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<User>(&res_to_string(res).await);

        assert!(json.is_ok());

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_return_user_card_by_numerical_username(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, _) = init_app_for_test(get, pool, false, false, None).await;

        // Change the username.
        let result = sqlx::query(
            r#"
UPDATE users
SET username = $1
WHERE id = $2
"#,
        )
        .bind("12345")
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .uri(&format!("/v1/public/cards/user/{}", "12345"))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<User>(&res_to_string(res).await);

        assert!(json.is_ok());

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_return_user_card_when_logged_in(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, false, None).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/public/cards/user/{}", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<User>(&res_to_string(res).await);

        assert!(json.is_ok());

        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_an_invalid_user(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, false, None).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/public/cards/user/{}", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_eq!(res.status(), StatusCode::NOT_FOUND);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_return_user_card_with_status(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, _) = init_app_for_test(get, pool, false, false, None).await;

        // Insert the status.
        let insert_result = sqlx::query(
            r#"
INSERT INTO user_statuses (user_id, text, emoji, expires_at) 
VALUES ($1, $2, $3, $4)
"#,
        )
        .bind(1_i64)
        .bind("Status text")
        .bind("1f90c")
        .bind(OffsetDateTime::now_utc() + Duration::days(1))
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .uri(&format!("/v1/public/cards/user/{}", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<User>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert!(json.unwrap().status.is_some());

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn should_not_return_an_expired_status(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, _) = init_app_for_test(get, pool, false, false, None).await;

        // Insert an expired status.
        let insert_result = sqlx::query(
            r#"
INSERT INTO user_statuses (user_id, text, emoji, expires_at) 
VALUES ($1, $2, $3, $4)
"#,
        )
        .bind(1_i64)
        .bind("Status text")
        .bind("1f90c")
        .bind(OffsetDateTime::now_utc() - Duration::days(1))
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .uri(&format!("/v1/public/cards/user/{}", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<User>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert!(json.unwrap().status.is_none());

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_handle_a_private_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, _) = init_app_for_test(get, pool, false, false, None).await;

        // Make the user private.
        let result = sqlx::query(
            r#"
UPDATE users
SET is_private = TRUE
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .uri(&format!("/v1/public/cards/user/{}", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_eq!(res.status(), StatusCode::NOT_FOUND);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_handle_a_private_user_when_logged_in(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Make the user private.
        let result = sqlx::query(
            r#"
UPDATE users
SET is_private = TRUE
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/public/cards/user/{}", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_eq!(res.status(), StatusCode::NOT_FOUND);

        // Add the user as friend.
        let result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(1_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/public/cards/user/{}", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<User>(&res_to_string(res).await);

        assert!(json.is_ok());

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_return_is_following_flag_when_logged_in(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/public/cards/user/{}", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Should be `false` initially.
        let json = serde_json::from_str::<User>(&res_to_string(res).await).unwrap();
        assert!(!json.is_following);

        // Follow the user.
        let result = sqlx::query(
            r#"
INSERT INTO relations (followed_id, follower_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/public/cards/user/{}", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Should be `true`.
        let json = serde_json::from_str::<User>(&res_to_string(res).await).unwrap();
        assert!(json.is_following);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn should_not_return_deactivated_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, _) = init_app_for_test(get, pool, false, false, None).await;

        // Deactivate the user.
        let result = sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .uri(&format!("/v1/public/cards/user/{}", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_eq!(res.status(), StatusCode::NOT_FOUND);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn should_not_return_soft_deleted_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, _) = init_app_for_test(get, pool, false, false, None).await;

        // Soft-delete the user.
        let result = sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .uri(&format!("/v1/public/cards/user/{}", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_eq!(res.status(), StatusCode::NOT_FOUND);

        Ok(())
    }
}
