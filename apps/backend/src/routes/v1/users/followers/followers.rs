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
    FromRow,
    Postgres,
    QueryBuilder,
};
use uuid::Uuid;
use validator::Validate;

lazy_static! {
    static ref SORT_REGEX: Regex = {
        #[allow(clippy::unwrap_used)]
        Regex::new(r"^(recent|old|popular)$").unwrap()
    };
}

#[derive(Deserialize, Validate)]
struct Fragments {
    user_id: String,
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

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct Follower {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    name: String,
    username: String,
    avatar_id: Option<Uuid>,
    avatar_hex: Option<String>,
    public_flags: i32,
    rendered_bio: String,
    // Stats
    story_count: i32,
    follower_count: i32,
    // Boolean flags
    is_follower: bool,
    is_following: bool,
    is_friend: bool,
    is_muted: bool,
    is_blocked: bool,
}

#[get("/v1/users/{user_id}/followers")]
#[tracing::instrument(
    name = "GET /v1/users/{user_id}/followers",
    skip_all,
    fields(
        current_user_id = tracing::field::Empty,
        user_id = %path.user_id,
        page = query.page,
        sort = query.sort,
        query = query.query
    ),
    err
)]
async fn get(
    query: QsQuery<QueryParams>,
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    maybe_user: Option<Identity>,
) -> Result<HttpResponse, AppError> {
    let current_user_id = maybe_user.map(|user| user.id()).transpose()?;

    tracing::Span::current().record("current_user_id", current_user_id);

    let user_id = path
        .user_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid user ID"))?;

    let page = query.page.unwrap_or(1) - 1;
    let sort = query.sort.clone().unwrap_or("popular".to_string());
    let search_query = query.query.clone().unwrap_or_default();
    let has_search_query = !search_query.trim().is_empty();

    let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
        r#"
WITH user_followers AS (
"#,
    );

    if has_search_query {
        query_builder.push(
            r#"
WITH search_query AS (
    SELECT PLAINTO_TSQUERY('english', "#,
        );

        query_builder.push(if current_user_id.is_some() {
            "$5"
        } else {
            "$4"
        });

        query_builder.push(
            r#") AS tsq
)
"#,
        );
    }

    query_builder.push(
        r#"
SELECT
    -- Follower user
    ru.id,
    ru.name,
    ru.username,
    ru.avatar_id,
    ru.avatar_hex,
    ru.public_flags,
    ru.rendered_bio,
    -- Stats
    ru.story_count,
    ru.follower_count,
"#,
    );

    query_builder.push(if current_user_id.is_some() {
        r#"
-- Boolean flags
"ru->is_follower".follower_id IS NOT NULL AS "is_follower",
"ru->is_following".follower_id IS NOT NULL AS "is_following",
"ru->is_friend".transmitter_id IS NOT NULL AS "is_friend",
"ru->is_muted".muter_id IS NOT NULL AS "is_muted",
"ru->is_blocked".blocker_id IS NOT NULL AS "is_blocked"
"#
    } else {
        r#"
-- Boolean flags
FALSE AS "is_follower",
FALSE AS "is_following",
FALSE AS "is_friend",
FALSE AS "is_muted",
FALSE AS "is_blocked"
"#
    });

    if has_search_query {
        query_builder.push(",");
        query_builder.push(
            r#"
-- Query score
TS_RANK_CD(ru.search_vec, (SELECT tsq FROM search_query)) AS "query_score"
"#,
        );
    }

    query_builder.push(
        r#"
FROM
    relations r
        -- Join follower user
        INNER JOIN users AS ru
            ON r.follower_id = ru.id
"#,
    );

    if current_user_id.is_some() {
        query_builder.push(
            r#"
-- Boolean following flag
LEFT OUTER JOIN relations AS "ru->is_following"
    ON "ru->is_following".followed_id = ru.id
    AND "ru->is_following".follower_id = $4
    AND "ru->is_following".deleted_at IS NULL
--
-- Boolean follower flag
LEFT OUTER JOIN relations AS "ru->is_follower"
    ON "ru->is_follower".follower_id = ru.id
    AND "ru->is_follower".followed_id = $4
    AND "ru->is_follower".deleted_at IS NULL 
--
-- Boolean friend flag
LEFT OUTER JOIN friends AS "ru->is_friend"
    ON (
      ("ru->is_friend".transmitter_id = ru.id AND "ru->is_friend".receiver_id = $4)
        OR
      ("ru->is_friend".receiver_id = ru.id AND "ru->is_friend".transmitter_id = $4)
    )
    AND "ru->is_friend".accepted_at IS NOT NULL
    AND "ru->is_friend".deleted_at IS NULL
--
-- Boolean blocked flag
LEFT OUTER JOIN blocks AS "ru->is_blocked"
    ON "ru->is_blocked".blocked_id = ru.id
    AND "ru->is_blocked".blocker_id = $4
    AND "ru->is_blocked".deleted_at IS NULL
--
-- Boolean muted flag
LEFT OUTER JOIN mutes AS "ru->is_muted"
    ON "ru->is_muted".muted_id = ru.id
    AND "ru->is_muted".muter_id = $4
    AND "ru->is_muted".deleted_at IS NULL
"#,
        );
    }

    query_builder.push(
        r#"
WHERE
    r.followed_id = $1
    AND r.deleted_at IS NULL
"#,
    );

    query_builder.push(if current_user_id.is_some() {
        r#"
-- Make sure to handle private follower
AND (
    NOT ru.is_private
    -- Self
    OR ru.id = $4
    OR EXISTS (
        SELECT 1
        FROM friends
        WHERE
            (
                    (transmitter_id = ru.id AND receiver_id = $4)
                OR 
                    (transmitter_id = $4 AND receiver_id = ru.id)
            )
            AND accepted_at IS NOT NULL
            AND deleted_at IS NULL
    )
)
"#
    } else {
        r#"
AND ru.is_private IS FALSE
"#
    });

    if has_search_query {
        query_builder.push(r#"AND ru.search_vec @@ (SELECT tsq FROM search_query)"#);
    }

    query_builder.push(
        r#"
GROUP BY
    ru.id,
    r.created_at
"#,
    );

    if current_user_id.is_some() {
        query_builder.push(",");
        query_builder.push(
            r#"
"ru->is_follower".follower_id,
"ru->is_following".follower_id,
"ru->is_friend".transmitter_id,
"ru->is_muted".muter_id,
"ru->is_blocked".blocker_id
"#,
        );
    }

    query_builder.push(r#" ORDER BY "#);

    if has_search_query {
        query_builder.push("query_score DESC");
        query_builder.push(",");
    }

    query_builder.push(match sort.as_str() {
        "old" => "r.created_at",
        "popular" => "ru.follower_count DESC",
        _ => "r.created_at DESC",
    });

    query_builder.push(
        r#"
    LIMIT $2 OFFSET $3
)
SELECT
    -- Follower user
    id,
    name,
    username,
    avatar_id,
    avatar_hex,
    public_flags,
    rendered_bio,
    -- Stats
    story_count,
    follower_count,
    -- Boolean flags
    is_follower,
    is_following,
    is_friend,
    is_muted,
    is_blocked
FROM user_followers
"#,
    );

    let mut db_query = query_builder
        .build_query_as::<Follower>()
        .bind(user_id)
        .bind(10_i16)
        .bind((page * 10) as i16);

    if let Some(current_user_id) = current_user_id {
        db_query = db_query.bind(current_user_id);
    }

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

    // Logged-out

    #[sqlx::test(fixtures("follower"))]
    async fn can_return_user_followers(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        // Add some followers.
        let insert_result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($2, $1), ($3, $1)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .uri(&format!("/v1/users/{}/followers", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await);

        assert!(json.is_ok());

        let followers = json.unwrap();

        assert_eq!(followers.len(), 2);
        assert!(followers.iter().all(|follower| !follower.is_follower
            && !follower.is_following
            && !follower.is_friend));

        Ok(())
    }

    #[sqlx::test(fixtures("follower"))]
    async fn can_return_user_followers_in_old_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        // Add some followers.
        sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .uri(&format!("/v1/users/{}/followers?sort=old", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 2_i64);
        assert_eq!(json[1].id, 3_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("follower"))]
    async fn can_return_user_followers_in_recent_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        // Add some followers.
        sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .uri(&format!("/v1/users/{}/followers?sort=recent", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 3_i64);
        assert_eq!(json[1].id, 2_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("follower"))]
    async fn can_return_user_followers_in_popular_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        // Add some followers.
        sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .uri(&format!("/v1/users/{}/followers?sort=popular", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 2_i64);
        assert_eq!(json[1].id, 3_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("follower"))]
    async fn can_search_user_followers(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        // Add some followers.
        let insert_result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($2, $1), ($3, $1)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .uri(&format!(
                "/v1/users/{}/followers?query={}",
                1,
                encode("two")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert_eq!(json[0].username, "two".to_string());

        Ok(())
    }

    #[sqlx::test(fixtures("follower"))]
    async fn should_not_include_soft_deleted_followers(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        // Add some followers.
        let insert_result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($2, $1), ($3, $1)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the followers initially.
        let req = test::TestRequest::get()
            .uri(&format!("/v1/users/{}/followers", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Soft-delete one of the follower relation.
        let result = sqlx::query(
            r#"
UPDATE relations
SET deleted_at = NOW()
WHERE follower_id = $1 AND followed_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one follower.
        let req = test::TestRequest::get()
            .uri(&format!("/v1/users/{}/followers", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Recover the follower relation.
        let result = sqlx::query(
            r#"
UPDATE relations
SET deleted_at = NULL
WHERE follower_id = $1 AND followed_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the followers again.
        let req = test::TestRequest::get()
            .uri(&format!("/v1/users/{}/followers", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("follower"))]
    async fn should_not_include_private_followers(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        // Add some followers.
        let insert_result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($2, $1), ($3, $1)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the followers initially.
        let req = test::TestRequest::get()
            .uri(&format!("/v1/users/{}/followers", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Make one of the followers private.
        let result = sqlx::query(
            r#"
UPDATE users
SET is_private = TRUE
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one follower.
        let req = test::TestRequest::get()
            .uri(&format!("/v1/users/{}/followers", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let followers = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await).unwrap();

        assert_eq!(followers.len(), 1);
        assert_ne!(followers[0].id, 2_i64);

        Ok(())
    }

    // Logged-in

    #[sqlx::test(fixtures("follower"))]
    async fn can_return_user_followers_when_logged_in(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        // Add some followers.
        let insert_result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($2, $1), ($3, $1)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/users/{}/followers", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("follower"))]
    async fn can_return_is_following_flag_for_user_followers_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Add a follower.
        let insert_result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/users/{}/followers", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let followers = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await).unwrap();
        assert!(followers.iter().all(|follower| !follower.is_following));

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

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/users/{}/followers", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let followers = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await).unwrap();
        assert!(followers.iter().all(|follower| follower.is_following));

        Ok(())
    }

    #[sqlx::test(fixtures("follower"))]
    async fn can_return_is_follower_flag_for_user_followers_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Add a follower.
        let insert_result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/users/{}/followers", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let followers = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await).unwrap();
        assert!(followers.iter().all(|follower| !follower.is_follower));

        // Add the user as follower.
        let result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($2, $1)
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/users/{}/followers", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let followers = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await).unwrap();
        assert!(followers.iter().all(|follower| follower.is_follower));

        Ok(())
    }

    #[sqlx::test(fixtures("follower"))]
    async fn can_return_is_friend_flag_for_user_followers_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Add a follower.
        let insert_result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/users/{}/followers", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let followers = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await).unwrap();
        assert!(followers.iter().all(|follower| !follower.is_friend));

        // Send a friend request to the user.
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

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/users/{}/followers", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should still be false as the friend request has not been accepted yet.
        let followers = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await).unwrap();
        assert!(followers.iter().all(|follower| !follower.is_friend));

        // Accept the friend request.
        let result = sqlx::query(
            r#"
UPDATE friends
SET accepted_at = NOW()
WHERE
    transmitter_id = $1
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/users/{}/followers", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let followers = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await).unwrap();
        assert!(followers.iter().all(|follower| follower.is_friend));

        Ok(())
    }

    #[sqlx::test(fixtures("follower"))]
    async fn can_return_is_muted_flag_for_user_followers_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Add a follower.
        let insert_result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/users/{}/followers", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let followers = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await).unwrap();
        assert!(followers.iter().all(|follower| !follower.is_muted));

        // Mute the user.
        let result = sqlx::query(
            r#"
INSERT INTO mutes (muter_id, muted_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/users/{}/followers", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let followers = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await).unwrap();
        assert!(followers.iter().all(|follower| follower.is_muted));

        Ok(())
    }

    #[sqlx::test(fixtures("follower"))]
    async fn can_return_is_blocked_flag_for_user_followers_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Add a follower.
        let insert_result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/users/{}/followers", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let followers = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await).unwrap();
        assert!(followers.iter().all(|follower| !follower.is_blocked));

        // Block the user.
        let result = sqlx::query(
            r#"
INSERT INTO blocks (blocker_id, blocked_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/users/{}/followers", 3))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let followers = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await).unwrap();
        assert!(followers.iter().all(|follower| follower.is_blocked));

        Ok(())
    }

    #[sqlx::test(fixtures("follower"))]
    async fn can_return_user_followers_in_old_order_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        // Add some followers.
        sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/users/{}/followers?sort=old", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 2_i64);
        assert_eq!(json[1].id, 3_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("follower"))]
    async fn can_return_user_followers_in_recent_order_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        // Add some followers.
        sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/users/{}/followers?sort=recent", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 3_i64);
        assert_eq!(json[1].id, 2_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("follower"))]
    async fn can_return_user_followers_in_popular_order_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        // Add some followers.
        sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/users/{}/followers?sort=popular", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 2_i64);
        assert_eq!(json[1].id, 3_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("follower"))]
    async fn can_search_user_followers_when_logged_in(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        // Add some followers.
        let insert_result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($2, $1), ($3, $1)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/users/{}/followers?query={}",
                1,
                encode("two")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert_eq!(json[0].username, "two".to_string());

        Ok(())
    }

    #[sqlx::test(fixtures("follower"))]
    async fn can_handle_private_followers_when_logged_in(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        // Add some followers.
        let insert_result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Should return followers initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/users/{}/followers", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await).unwrap();
        assert_eq!(json.len(), 1);

        // Make the followed user private.
        let result = sqlx::query(
            r#"
UPDATE users
SET is_private = TRUE
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should not return the private follower.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/users/{}/followers", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await).unwrap();
        assert_eq!(json.len(), 0);

        // Add the private follower as friend.
        let result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return the private follower.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/users/{}/followers", 2))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await).unwrap();
        assert_eq!(json.len(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("follower"))]
    async fn should_not_include_soft_deleted_followers_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        // Add some followers.
        let insert_result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($2, $1), ($3, $1)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the followers initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/users/{}/followers", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Soft-delete one of the follower relation.
        let result = sqlx::query(
            r#"
UPDATE relations
SET deleted_at = NOW()
WHERE follower_id = $1 AND followed_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one follower.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/users/{}/followers", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Recover the follower relation.
        let result = sqlx::query(
            r#"
UPDATE relations
SET deleted_at = NULL
WHERE follower_id = $1 AND followed_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the followers again.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/users/{}/followers", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Follower>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }
}
