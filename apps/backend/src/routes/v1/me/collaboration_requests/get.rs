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
};
use time::OffsetDateTime;
use uuid::Uuid;
use validator::Validate;

lazy_static! {
    static ref TYPE_REGEX: Regex = Regex::new(r"^(received|sent)$").unwrap();
}

#[derive(Serialize, Deserialize, Validate)]
struct QueryParams {
    #[validate(range(min = 1, max = 1000))]
    page: Option<u16>,
    #[validate(regex = "TYPE_REGEX")]
    r#type: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct User {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    name: String,
    username: String,
    avatar_id: Option<Uuid>,
    avatar_hex: Option<String>,
    public_flags: i32,
}

#[derive(Debug, Serialize, Deserialize)]
struct Story {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    title: String,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct CollaborationRequest {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    #[serde(with = "crate::iso8601::time")]
    created_at: OffsetDateTime,
    // Joins
    user: Option<Json<User>>, // Can be null if deleted or deactivated
    story: Json<Story>,
}

#[get("/v1/me/collaboration-requests")]
#[tracing::instrument(
    name = "GET /v1/me/collaboration-requests",
    skip_all,
    fields(
        user_id = user.id().ok(),
        page = query.page,
        r#type = query.r#type,
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
    let r#type = query.r#type.clone().unwrap_or("received".to_string());

    let result = sqlx::query_as::<_, CollaborationRequest>(if r#type == "received" {
        r#"
WITH received_collaboration_requests AS (
    SELECT
        sc.id AS "id",
        sc.created_at,
        -- User
        CASE WHEN
            (
                "sc->story->user".deleted_at IS NULL
                    AND
                "sc->story->user".deactivated_at IS NULL
            )
        THEN
            JSON_BUILD_OBJECT(
                'id', "sc->story->user".id,
                'name', "sc->story->user".name,
                'username', "sc->story->user".username,
                'avatar_id', "sc->story->user".avatar_id,
                'avatar_hex', "sc->story->user".avatar_hex,
                'public_flags', "sc->story->user".public_flags
            )
        END AS "_user" -- Underscore is intentional
        -- Story
        JSON_BUILD_OBJECT(
            'id', "sc->story".id,
            'title', "sc->story".title
        )
    FROM
        story_contributors AS sc
            INNER JOIN stories AS "sc->story"
                ON sc.story_id = "sc->story".id
            INNER JOIN users AS "sc->story->user"
                ON "sc->story".user_id = "sc->story->user".id
    WHERE
        sc.user_id = $1
        AND sc.accepted_at IS NULL
        AND sc.deleted_at IS NULL
    ORDER BY
        sc.created_at DESC
    LIMIT $2 OFFSET $3
)
SELECT
    id,
    created_at,
    -- This underscore prevents selecting the actual `user` from Postgres
    _user as "user",
    story
FROM received_collaboration_requests
"#
    } else {
        r#"
WITH sent_collaboration_requests AS (
    SELECT
        sc.id AS "id",
        sc.created_at,
        -- User
        CASE WHEN
            (
                "sc->user".deleted_at IS NULL
                    AND
                "sc->user".deactivated_at IS NULL
            )
        THEN
            JSON_BUILD_OBJECT(
                'id', "sc->user".id,
                'name', "sc->user".name,
                'username', "sc->user".username,
                'avatar_id', "sc->user".avatar_id,
                'avatar_hex', "sc->user".avatar_hex,
                'public_flags', "sc->user".public_flags
            )
        END AS "_user" -- Underscore is intentional
        -- Story
        JSON_BUILD_OBJECT(
            'id', "sc->story".id,
            'title', "sc->story".title
        )
    FROM
        story_contributors AS sc
            INNER JOIN stories AS "sc->story"
                ON sc.story_id = "sc->story".id
            INNER JOIN users AS "sc->user"
                ON sc.user_id = "sc->user".id
    WHERE
        "sc->story".user_id = $1
        AND sc.accepted_at IS NULL
        AND sc.deleted_at IS NULL
    ORDER BY
        sc.created_at DESC
    LIMIT $2 OFFSET $3
)
SELECT
    id,
    created_at,
    -- This underscore prevents selecting the actual `user` from Postgres
    _user as "user",
    story
FROM sent_collaboration_requests
"#
    })
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
    use urlencoding::encode;

    #[sqlx::test(fixtures("collaboration_request"))]
    async fn can_return_friend_requests(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Receive some friend requests.
        let insert_result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($2, $1), ($3, $1)
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/friend-requests")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<FriendRequest>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("collaboration_request"))]
    async fn can_return_friend_requests_in_popular_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Receive some friend requests.
        sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/friend-requests?sort=popular")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<FriendRequest>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 2_i64);
        assert_eq!(json[1].id, 3_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("collaboration_request"))]
    async fn should_not_include_soft_deleted_friend_requests(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Receive some friend requests.
        let insert_result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($2, $1), ($3, $1)
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the friend requests initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/friend-requests")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<FriendRequest>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Soft-delete one of the friend request.
        let result = sqlx::query(
            r#"
UPDATE friends
SET deleted_at = NOW()
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one friend request.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/friend-requests")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<FriendRequest>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Recover the friend request.
        let result = sqlx::query(
            r#"
UPDATE friends
SET deleted_at = NULL
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the friend requests again.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/friend-requests")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<FriendRequest>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("collaboration_request"))]
    async fn should_not_include_accepted_friend_requests(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Receive some friend requests.
        let insert_result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($2, $1), ($3, $1)
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the friend requests initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/friend-requests")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<FriendRequest>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Accept one of the friend request.
        let result = sqlx::query(
            r#"
UPDATE friends
SET accepted_at = NOW()
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one friend request.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/friend-requests")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<FriendRequest>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        Ok(())
    }
}
