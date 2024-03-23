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
struct Friend {
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
    // Boolean flags
    is_follower: bool,
    is_following: bool,
    is_friend: bool,
    is_muted: bool,
}

#[get("/v1/me/friends")]
#[tracing::instrument(
    name = "GET /v1/me/friends",
    skip_all,
    fields(
        user_id = user.id().ok(),
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
    let user_id = user.id()?;

    let page = query.page.unwrap_or(1) - 1;
    let sort = query.sort.clone().unwrap_or("popular".to_string());
    let search_query = query.query.clone().unwrap_or_default();
    let has_search_query = !search_query.trim().is_empty();

    let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
        r#"
WITH friends_result AS (
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
    -- Friend
    fu.id,
    fu.name,
    fu.username,
    fu.avatar_id,
    fu.avatar_hex,
    fu.public_flags,
    fu.story_count,
    fu.follower_count,
    fu.rendered_bio,
    -- Boolean flags
    "fu->is_follower".follower_id IS NOT NULL AS "is_follower",
    "fu->is_following".follower_id IS NOT NULL AS "is_following",
    "fu->is_muted".muter_id IS NOT NULL AS "is_muted"
"#,
    );

    if has_search_query {
        query_builder.push(",");
        query_builder.push(
            r#"
-- Query score
TS_RANK_CD(fu.search_vec, (SELECT tsq FROM search_query)) AS "query_score"
"#,
        );
    }

    query_builder.push(
        r#"
FROM
    friends f
        -- Join friend user
        INNER JOIN users AS fu
            ON (
              (f.transmitter_id = fu.id AND f.receiver_id = $1)
                OR
              (f.receiver_id = fu.id AND f.transmitter_id = $1)          
            )
        --
        -- Boolean follower flag
        LEFT OUTER JOIN relations AS "fu->is_follower"
            ON "fu->is_follower".follower_id = fu.id
            AND "fu->is_follower".followed_id = $1
            AND "fu->is_follower".deleted_at IS NULL
        --
        -- Boolean following flag
        LEFT OUTER JOIN relations AS "fu->is_following"
            ON "fu->is_following".followed_id = fu.id
            AND "fu->is_following".follower_id = $1
            AND "fu->is_following".deleted_at IS NULL
        --
        -- Boolean muted flag
        LEFT OUTER JOIN mutes AS "fu->is_muted"
            ON "fu->is_muted".muted_id = fu.id
            AND "fu->is_muted".muter_id = $1
            AND "fu->is_muted".deleted_at IS NULL
WHERE
    f.accepted_at IS NOT NULL
    AND f.deleted_at IS NULL
"#,
    );

    if has_search_query {
        query_builder.push(r#"AND fu.search_vec @@ (SELECT tsq FROM search_query)"#);
    }

    query_builder.push(
        r#"
GROUP BY
    fu.id,
    "fu->is_follower".follower_id,
    "fu->is_following".follower_id,
    "fu->is_muted".muter_id,
    f.created_at
ORDER BY 
"#,
    );

    if has_search_query {
        query_builder.push("query_score DESC");
        query_builder.push(",");
    }

    query_builder.push(match sort.as_str() {
        "old" => "f.created_at",
        "popular" => "fu.follower_count DESC",
        _ => "f.created_at DESC",
    });

    query_builder.push(
        r#"
    LIMIT $2 OFFSET $3
)
SELECT
    -- Friend
    id,
    name,
    username,
    avatar_id,
    avatar_hex,
    public_flags,
    story_count,
    follower_count,
    rendered_bio,
    -- Boolean flags
    is_follower,
    is_following,
    TRUE AS "is_friend",
    is_muted
FROM friends_result
"#,
    );

    let mut db_query = query_builder
        .build_query_as::<Friend>()
        .bind(user_id)
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

    #[sqlx::test(fixtures("friend"))]
    async fn can_return_friends(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Add some friends.
        let insert_result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id, accepted_at)
VALUES ($2, $1, NOW()), ($3, $1, NOW())
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
            .uri("/v1/me/friends")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Friend>>(&res_to_string(res).await);

        assert!(json.is_ok());

        let friends = json.unwrap();

        assert_eq!(friends.len(), 2);
        assert!(friends.iter().all(|friend| friend.is_friend));

        Ok(())
    }

    #[sqlx::test(fixtures("friend"))]
    async fn can_return_is_follower_flag_for_friends(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Add a friend.
        let insert_result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/friends")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<Friend>>(&res_to_string(res).await).unwrap();
        let friend = &json[0];
        assert!(!friend.is_follower);

        // Add the user as follower.
        let insert_result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($2, $1)
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/friends")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<Friend>>(&res_to_string(res).await).unwrap();
        let friend = &json[0];
        assert!(friend.is_follower);

        Ok(())
    }

    #[sqlx::test(fixtures("friend"))]
    async fn can_return_is_following_flag_for_friends(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Add a friend.
        let insert_result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/friends")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<Friend>>(&res_to_string(res).await).unwrap();
        let friend = &json[0];
        assert!(!friend.is_following);

        // Follow the user.
        let insert_result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/friends")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<Friend>>(&res_to_string(res).await).unwrap();
        let friend = &json[0];
        assert!(friend.is_following);

        Ok(())
    }

    #[sqlx::test(fixtures("friend"))]
    async fn can_return_is_muted_flag_for_friends(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Add a friend.
        let insert_result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/friends")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<Friend>>(&res_to_string(res).await).unwrap();
        let friend = &json[0];
        assert!(!friend.is_muted);

        // Mute the user.
        let insert_result = sqlx::query(
            r#"
INSERT INTO mutes (muter_id, muted_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/friends")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<Friend>>(&res_to_string(res).await).unwrap();
        let friend = &json[0];
        assert!(friend.is_muted);

        Ok(())
    }

    #[sqlx::test(fixtures("friend"))]
    async fn can_return_friends_in_asc_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Add some friends.
        sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/friends?sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Friend>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 2_i64);
        assert_eq!(json[1].id, 3_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("friend"))]
    async fn can_return_friends_in_desc_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Add some friends.
        sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/friends?sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Friend>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 3_i64);
        assert_eq!(json[1].id, 2_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("friend"))]
    async fn can_return_friends_in_popular_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Add some friends.
        sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/friends?sort=popular")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Friend>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 2_i64);
        assert_eq!(json[1].id, 3_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("friend"))]
    async fn can_search_friends(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Add some friends.
        let insert_result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id, accepted_at)
VALUES ($2, $1, NOW()), ($3, $1, NOW())
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
            .uri(&format!("/v1/me/friends?query={}", encode("two")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Friend>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert_eq!(json[0].username, "two".to_string());

        Ok(())
    }

    #[sqlx::test(fixtures("friend"))]
    async fn should_not_include_soft_deleted_friends(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Add some friends.
        let insert_result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id, accepted_at)
VALUES ($2, $1, NOW()), ($3, $1, NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the friends initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/friends")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Friend>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Soft-delete one of the friends.
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

        // Should return only one friend.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/friends")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Friend>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Recover the friend.
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

        // Should return all the friends again.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/friends")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Friend>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("friend"))]
    async fn should_not_include_pending_friends(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Add some friends.
        let insert_result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id, accepted_at)
VALUES ($2, $1, NOW()), ($3, $1, NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the friends initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/friends")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Friend>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Update one of the friends as pending.
        let result = sqlx::query(
            r#"
UPDATE friends
SET accepted_at = NULL
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one friend.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/friends")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Friend>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        Ok(())
    }
}
