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
    #[validate(range(min = 1, max = 1000))]
    page: Option<u16>,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct BlockedUser {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    name: String,
    username: String,
    avatar_id: Option<Uuid>,
    avatar_hex: Option<String>,
    public_flags: i32,
    follower_count: i32,
    story_count: i32,
    rendered_bio: String,
    is_blocked: bool,
}

#[get("/v1/me/blocked-users")]
#[tracing::instrument(
    name = "GET /v1/me/blocked-users",
    skip_all,
    fields(
        blocker_id = user.id().ok(),
        page = query.page
    ),
    err
)]
async fn get(
    query: QsQuery<QueryParams>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let blocker_id = user.id()?;
    let page = query.page.unwrap_or(1) - 1;

    let result = sqlx::query_as::<_, BlockedUser>(
        r#"
SELECT
    u.id,
    u.name,
    u.username,
    u.avatar_id,
    u.avatar_hex,
    u.public_flags,
    u.follower_count,
    u.story_count,
    u.rendered_bio,
    TRUE AS "is_blocked"
FROM
    blocks b
        INNER JOIN users u ON b.blocked_id = u.id
WHERE
    b.blocker_id = $1
        AND b.deleted_at IS NULL
ORDER BY
    b.created_at DESC
LIMIT $2 OFFSET $3
"#,
    )
    .bind(blocker_id)
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

    #[sqlx::test(fixtures("user"))]
    async fn can_return_blocked_users(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Should return an empty array initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/blocked-users")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<BlockedUser>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 0);

        // Block a user.
        let result = sqlx::query(
            r#"
INSERT INTO blocks (blocker_id, blocked_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should include the blocked user.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/blocked-users")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<BlockedUser>>(&res_to_string(res).await);

        assert!(json.is_ok());

        let json_data = json.unwrap();

        assert_eq!(json_data.len(), 1);
        assert_eq!(json_data[0].id, 2_i64);
        assert!(json_data[0].is_blocked);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn should_not_return_soft_deleted_blocks(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Should return an empty array initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/blocked-users")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<BlockedUser>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 0);

        // Block a user.
        let result = sqlx::query(
            r#"
INSERT INTO blocks (blocker_id, blocked_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should include the blocked user.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/blocked-users")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<BlockedUser>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Deactivate the blocked user, this should soft-delete the block.
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Should not return the soft-deleted block.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/blocked-users")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<BlockedUser>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 0);

        Ok(())
    }
}
