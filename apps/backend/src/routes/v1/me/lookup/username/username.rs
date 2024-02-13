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
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

#[derive(Serialize, Deserialize, Validate)]
struct QueryParams {
    #[validate(length(min = 3, max = 24, message = "Invalid username query length"))]
    query: String,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct User {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    name: String,
    username: String,
    avatar_id: Option<Uuid>,
    avatar_hex: Option<String>,
    public_flags: i32,
}

#[get("/v1/me/lookup/username")]
#[tracing::instrument(
    name = "GET /v1/me/lookup/username",
    skip_all,
    fields(
        user_id = user.id().ok(),
        query = query.query
    ),
    err
)]
async fn get(
    query: QsQuery<QueryParams>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let search_query = query.query.clone();

    let result = sqlx::query_as::<_, User>(
        r#"
WITH search_query AS (
    SELECT PLAINTO_TSQUERY('english', $1) AS tsq
)
SELECT
    -- User
    u.id,
    u.name,
    u.username,
    u.avatar_id,
    u.avatar_hex,
    u.public_flags,
    -- Query score
    TS_RANK_CD(u.search_vec, (SELECT tsq FROM search_query)) AS "query_score"
FROM
    users u
WHERE
    u.deleted_at IS NULL
    AND u.deactivated_at IS NULL
    AND (
        u.search_vec @@ (SELECT tsq FROM search_query)
        OR LOWER(u.username) LIKE $3
    )
    -- Make sure to handle private users
    AND (
        NOT u.is_private OR
        u.id = $2 OR
        EXISTS (
            SELECT 1
            FROM friends
            WHERE
                (
                    (transmitter_id = u.id AND receiver_id = $2)
                OR
                    (transmitter_id = $2 AND receiver_id = u.id)
                )
                AND accepted_at IS NOT NULL
                AND deleted_at IS NULL
        )
    )
    -- Filter out blocked users
    AND NOT EXISTS (
        SELECT 1 FROM blocks b
        WHERE b.blocker_id = $2
            AND b.blocked_id = u.id
    )
ORDER BY
    query_score DESC,
    u.follower_count DESC
-- Limit to 5 results
LIMIT 5
"#,
    )
    .bind(&search_query)
    .bind(user_id)
    .bind(format!("{search_query}%"))
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
    use urlencoding::encode;

    #[sqlx::test(fixtures("username"))]
    async fn can_lookup_users_by_username(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, false, None).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/lookup/username?query={}", encode("user")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<User>>(&res_to_string(res).await);

        assert!(json.is_ok());

        Ok(())
    }

    #[sqlx::test(fixtures("username"))]
    async fn can_handle_private_users(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Should return all the users initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/lookup/username?query={}", encode("user")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<User>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 5);

        // Make the users private.
        let result = sqlx::query(
            r#"
UPDATE users
SET is_private = TRUE
WHERE id <> $1
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 4);

        // Should only return the current user.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/lookup/username?query={}", encode("user")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<User>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Add the users as friends.
        let result = sqlx::query(
            r#"
INSERT INTO friends(transmitter_id, receiver_id, accepted_at)
VALUES
    ($1, $2, NOW()),
    ($1, $3, NOW()),
    ($1, $4, NOW()),
    ($1, $5, NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .bind(3_i64)
        .bind(4_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 4);

        // Should return all the users again.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/lookup/username?query={}", encode("user")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<User>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 5);

        Ok(())
    }

    #[sqlx::test(fixtures("username"))]
    async fn should_not_include_soft_users(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Should return all the users initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/lookup/username?query={}", encode("user")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<User>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 5);

        // Soft-delete the users.
        let result = sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id <> $1
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 4);

        // Should only return the current user.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/lookup/username?query={}", encode("user")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<User>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("username"))]
    async fn should_not_include_deactivated_users(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Should return all the users initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/lookup/username?query={}", encode("user")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<User>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 5);

        // Deactivate the users.
        let result = sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id <> $1
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 4);

        // Should only return the current user.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/lookup/username?query={}", encode("user")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<User>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("username"))]
    async fn should_not_include_blocked_users(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Should return all the users initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/lookup/username?query={}", encode("user")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<User>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 5);

        // Block the users.
        let result = sqlx::query(
            r#"
INSERT INTO blocks(blocker_id, blocked_id)
VALUES ($1, $2), ($1, $3), ($1, $4), ($1, $5)
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .bind(3_i64)
        .bind(4_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 4);

        // Should only return the current user.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/lookup/username?query={}", encode("user")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<User>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        Ok(())
    }
}
