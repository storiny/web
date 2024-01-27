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
    static ref SORT_REGEX: Regex = {
        #[allow(clippy::unwrap_used)]
        Regex::new(r"^(recent|old|popular)$").unwrap()
    };
}

#[derive(Serialize, Deserialize, Validate)]
struct QueryParams {
    #[validate(range(min = 1, max = 1000))]
    page: Option<u16>,
    #[validate(regex = "SORT_REGEX")]
    sort: Option<String>,
    #[validate(length(min = 0, max = 160, message = "Invalid query length"))]
    query: Option<String>,
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

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct FriendRequest {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    #[serde(with = "crate::iso8601::time")]
    created_at: OffsetDateTime,
    // Joins
    user: Json<User>,
}

#[get("/v1/me/friend-requests")]
#[tracing::instrument(
    name = "GET /v1/me/friend-requests",
    skip_all,
    fields(
        receiver_id = user.id().ok(),
        page = query.page,
        sort = query.sort,
        query = query.query
    ),
    err
)]
async fn get(
    query: QsQuery<QueryParams>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let receiver_id = user.id()?;

    let page = query.page.unwrap_or(1) - 1;
    let sort = query.sort.clone().unwrap_or("popular".to_string());
    let search_query = query.query.clone().unwrap_or_default();
    let has_search_query = !search_query.trim().is_empty();

    let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
        r#"
WITH friend_requests AS (
"#,
    );

    if has_search_query {
        query_builder.push(
            r#"
WITH search_query AS (
    SELECT PLAINTO_TSQUERY('english', $4) AS tsq
)
"#,
        );
    }

    query_builder.push(
        r#"
SELECT
    -- Friend request
    ft.id AS "id",
    f.created_at,
    -- User
    JSON_BUILD_OBJECT(
        'id', ft.id,
        'name', ft.name,
        'username', ft.username,
        'avatar_id', ft.avatar_id,
        'avatar_hex', ft.avatar_hex,
        'public_flags', ft.public_flags
    ) AS "_user" -- Underscore is intentional
"#,
    );

    if has_search_query {
        query_builder.push(",");
        query_builder.push(
            r#"
-- Query score
TS_RANK_CD(ft.search_vec, (SELECT tsq FROM search_query)) AS "query_score"
"#,
        );
    }

    query_builder.push(
        r#"
FROM
    friends f
        INNER JOIN users AS ft
            ON f.transmitter_id = ft.id
WHERE
      f.receiver_id = $1
"#,
    );

    if has_search_query {
        query_builder.push(r#"AND ft.search_vec @@ (SELECT tsq FROM search_query)"#);
    }

    query_builder.push(
        r#"
    AND f.accepted_at IS NULL
    AND f.deleted_at IS NULL
ORDER BY
"#,
    );

    if has_search_query {
        query_builder.push("query_score DESC");
        query_builder.push(",");
    }

    query_builder.push(match sort.as_str() {
        "old" => "f.created_at",
        "popular" => "ft.follower_count DESC",
        _ => "f.created_at DESC",
    });

    query_builder.push(
        r#"
    LIMIT $2 OFFSET $3
)
SELECT
    id,
    created_at,
    -- This underscore prevents selecting the actual `user` from Postgres
    _user as "user"
FROM friend_requests
"#,
    );

    let mut db_query = query_builder
        .build_query_as::<FriendRequest>()
        .bind(receiver_id)
        .bind(10_i16)
        .bind((page * 10) as i16);

    if has_search_query {
        db_query = db_query.bind(search_query);
    }

    let result = db_query.fetch_all(&data.db_pool).await?;

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

    #[sqlx::test(fixtures("friend_request"))]
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

    #[sqlx::test(fixtures("friend_request"))]
    async fn can_return_friend_requests_in_asc_order(pool: PgPool) -> sqlx::Result<()> {
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
            .uri("/v1/me/friend-requests?sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<FriendRequest>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 2_i64);
        assert_eq!(json[1].id, 3_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("friend_request"))]
    async fn can_return_friend_requests_in_desc_order(pool: PgPool) -> sqlx::Result<()> {
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
            .uri("/v1/me/friend-requests?sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<FriendRequest>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 3_i64);
        assert_eq!(json[1].id, 2_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("friend_request"))]
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

    #[sqlx::test(fixtures("friend_request"))]
    async fn can_search_friend_requests(pool: PgPool) -> sqlx::Result<()> {
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
            .uri(&format!("/v1/me/friend-requests?query={}", encode("two")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<FriendRequest>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert_eq!(json[0].user.username, "two".to_string());

        Ok(())
    }

    #[sqlx::test(fixtures("friend_request"))]
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

    #[sqlx::test(fixtures("friend_request"))]
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
