use crate::{
    constants::story_category::STORY_CATEGORY_VEC,
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
use sqlx::{
    FromRow,
    Postgres,
    QueryBuilder,
};
use uuid::Uuid;
use validator::Validate;

#[derive(Serialize, Deserialize, Validate)]
struct QueryParams {
    #[validate(range(min = 1, max = 1000))]
    page: Option<u16>,
    #[validate(length(min = 0, max = 256, message = "Invalid category"))]
    category: String,
    #[validate(length(min = 0, max = 160, message = "Invalid query length"))]
    query: Option<String>,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct Writer {
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
    is_following: bool,
    is_muted: bool,
}

#[get("/v1/public/explore/writers")]
#[tracing::instrument(
    name = "GET /v1/public/explore/writers",
    skip_all,
    fields(
        user_id = tracing::field::Empty,
        category = %query.category,
        page = query.page,
        query = query.query
    ),
    err
)]
async fn get(
    query: QsQuery<QueryParams>,
    data: web::Data<AppState>,
    maybe_user: Option<Identity>,
) -> Result<HttpResponse, AppError> {
    let user_id = maybe_user.map(|user| user.id()).transpose()?;

    tracing::Span::current().record("user_id", user_id);

    let page = query.page.unwrap_or(1) - 1;
    let category = if query.category == "all" {
        "others".to_string()
    } else {
        query.category.clone()
    };
    let search_query = query.query.clone().unwrap_or_default();
    let has_search_query = !search_query.trim().is_empty();

    // Validate story category.
    if !STORY_CATEGORY_VEC.contains(&category) {
        return Err(AppError::from("Invalid story category"));
    }

    let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
        r#"
WITH explore_writers AS (
"#,
    );

    if has_search_query {
        query_builder.push(
            r#"
WITH search_query AS (
    SELECT PLAINTO_TSQUERY('english', "#,
        );

        query_builder.push(if user_id.is_some() { "$5" } else { "$4" });

        query_builder.push(
            r#"
    ) AS tsq
)
"#,
        );
    }

    query_builder.push(
        r#"
SELECT
    -- User
    u.id,
    u.name,
    u.username,
    u.avatar_id,
    u.avatar_hex,
    u.public_flags,
    u.follower_count,
    u.story_count,
    u.rendered_bio,
"#,
    );

    query_builder.push(if user_id.is_some() {
        r#"
-- Boolean flags
"u->is_following".follower_id IS NOT NULL AS "is_following",
"u->is_muted".muter_id IS NOT NULL AS "is_muted"
"#
    } else {
        r#"
FALSE AS "is_following",
FALSE AS "is_muted"
"#
    });

    if has_search_query {
        query_builder.push(",");
        query_builder.push(
            r#"
-- Query score
TS_RANK_CD(u.search_vec, (SELECT tsq FROM search_query)) AS "query_score"
"#,
        );
    }

    query_builder.push(
        r#"
FROM
    users AS u
        -- Join story
        INNER JOIN stories AS "u->story"
            ON "u->story".user_id = u.id
            AND "u->story".visibility = 2
            AND "u->story".published_at IS NOT NULL
            AND "u->story".deleted_at IS NULL
            -- Include all the stories when the category is `others`
            AND CASE WHEN $1 = 'others' THEN TRUE ELSE "u->story".category::TEXT = $1 END
"#,
    );

    if user_id.is_some() {
        query_builder.push(
            r#"
-- Boolean following flag
LEFT OUTER JOIN relations AS "u->is_following"
    ON "u->is_following".followed_id = u.id
    AND "u->is_following".follower_id = $4
    AND "u->is_following".deleted_at IS NULL
--
-- Boolean muted flag
LEFT OUTER JOIN mutes AS "u->is_muted"
    ON "u->is_muted".muted_id = u.id
    AND "u->is_muted".muter_id = $4
    AND "u->is_muted".deleted_at IS NULL
"#,
        );
    }

    query_builder.push(
        r#"
WHERE
    u.deactivated_at IS NULL
    AND u.deleted_at IS NULL
"#,
    );

    query_builder.push(if user_id.is_some() {
        r#"
-- Make sure to handle private users
AND (
    NOT u.is_private OR
    EXISTS (
        SELECT 1
        FROM friends
        WHERE
            (
                (transmitter_id = u.id AND receiver_id = $4)
            OR
                (transmitter_id = $4 AND receiver_id = u.id)
            )
            AND accepted_at IS NOT NULL
            AND deleted_at IS NULL
    )
)
-- Filter out blocked users
AND NOT EXISTS (
    SELECT 1 FROM blocks b
    WHERE b.blocker_id = $4
        AND b.blocked_id = u.id
)
"#
    } else {
        r#"
-- Ignore private users
AND u.is_private IS FALSE
"#
    });

    if has_search_query {
        query_builder.push(r#"AND u.search_vec @@ (SELECT tsq FROM search_query)"#);
    }

    query_builder.push(
        r#"
GROUP BY
    u.id
"#,
    );

    if user_id.is_some() {
        query_builder.push(",");
        query_builder.push(
            r#"
"u->is_following".follower_id,
"u->is_muted".muter_id
"#,
        );
    }

    query_builder.push(r#" ORDER BY "#);

    if has_search_query {
        query_builder.push("query_score DESC");
        query_builder.push(",");
    }

    query_builder.push(
        r#"
        u.follower_count DESC
    LIMIT $2 OFFSET $3
)
SELECT
    -- User
    id,
    name,
    username,
    avatar_id,
    avatar_hex,
    public_flags,
    follower_count,
    story_count,
    rendered_bio,
    -- Boolean flags
    is_following,
    is_muted
FROM explore_writers
"#,
    );

    let mut db_query = query_builder
        .build_query_as::<Writer>()
        .bind(&category)
        .bind(10_i16)
        .bind((page * 10) as i16);

    if let Some(user_id) = user_id {
        db_query = db_query.bind(user_id);
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
        assert_response_body_text,
        init_app_for_test,
        res_to_string,
    };
    use actix_web::test;
    use sqlx::PgPool;
    use urlencoding::encode;

    #[sqlx::test]
    async fn can_reject_invalid_story_category(pool: PgPool) -> sqlx::Result<()> {
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        let req = test::TestRequest::get()
            .uri("/v1/public/explore/writers?category=invalid")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Invalid story category").await;

        Ok(())
    }

    // Logged-out

    #[sqlx::test(fixtures("writer"))]
    async fn can_return_explore_writers(pool: PgPool) -> sqlx::Result<()> {
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        let req = test::TestRequest::get()
            .uri("/v1/public/explore/writers?category=diy")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await);

        assert!(json.is_ok());

        let writers = json.unwrap();

        assert_eq!(writers.len(), 3);
        assert!(writers.iter().all(|writer| !writer.is_following));

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn can_search_explore_writers(pool: PgPool) -> sqlx::Result<()> {
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        let req = test::TestRequest::get()
            .uri(&format!(
                "/v1/public/explore/writers?category=diy&query={}",
                encode("two")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await).unwrap();

        assert!(json[0].username.contains("two"));
        assert_eq!(json.len(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn should_not_include_soft_deleted_writers_in_explore_writers(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        // Should return all the writers initially.
        let req = test::TestRequest::get()
            .uri("/v1/public/explore/writers?category=diy")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        // Soft-delete one of the writers.
        let result = sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only two writers.
        let req = test::TestRequest::get()
            .uri("/v1/public/explore/writers?category=diy")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Recover the soft-deleted writer.
        let result = sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the writers again.
        let req = test::TestRequest::get()
            .uri("/v1/public/explore/writers?category=diy")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn should_not_include_deactivated_writers_in_explore_writers(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        // Should return all the writers initially.
        let req = test::TestRequest::get()
            .uri("/v1/public/explore/writers?category=diy")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        // Deactivate one of the writers.
        let result = sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only two writers.
        let req = test::TestRequest::get()
            .uri("/v1/public/explore/writers?category=diy")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Reactivate the deactivated writer.
        let result = sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the writers again.
        let req = test::TestRequest::get()
            .uri("/v1/public/explore/writers?category=diy")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        Ok(())
    }

    // Logged-in

    #[sqlx::test(fixtures("writer"))]
    async fn can_return_explore_writers_when_logged_in(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/public/explore/writers?category=diy")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn can_return_is_following_flag_for_explore_writers_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/public/explore/writers?category=diy")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let writers = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await).unwrap();
        assert!(writers.iter().all(|writer| !writer.is_following));

        // Follow the writers.
        let result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2), ($1, $3), ($1, $4)
"#,
        )
        .bind(user_id.unwrap())
        .bind(1_i64)
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 3);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/public/explore/writers?category=diy")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let writers = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await).unwrap();
        assert!(writers.iter().all(|writer| writer.is_following));

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn can_return_is_muted_flag_for_explore_writers_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/public/explore/writers?category=diy")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let writers = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await).unwrap();
        assert!(writers.iter().all(|writer| !writer.is_muted));

        // Mute the writers.
        let result = sqlx::query(
            r#"
INSERT INTO mutes (muter_id, muted_id)
VALUES ($1, $2), ($1, $3), ($1, $4)
"#,
        )
        .bind(user_id.unwrap())
        .bind(1_i64)
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 3);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/public/explore/writers?category=diy")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let writers = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await).unwrap();
        assert!(writers.iter().all(|writer| writer.is_muted));

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn can_search_explore_writers_when_logged_in(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/public/explore/writers?category=diy&query={}",
                encode("two")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await).unwrap();

        assert!(json[0].username.contains("two"));
        assert_eq!(json.len(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn should_not_include_soft_deleted_writers_in_explore_writers_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        // Should return all the writers initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/public/explore/writers?category=diy")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        // Soft-delete one of the writers.
        let result = sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only two writers.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/public/explore/writers?category=diy")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Recover the soft-deleted writer.
        let result = sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the writers again.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/public/explore/writers?category=diy")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        Ok(())
    }

    #[sqlx::test(fixtures("writer"))]
    async fn should_not_include_deactivated_writers_in_explore_writers_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        // Should return all the writers initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/public/explore/writers?category=diy")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        // Deactivate one of the writers.
        let result = sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only two writers.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/public/explore/writers?category=diy")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Reactivate the deactivated writer.
        let result = sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the writers again.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/public/explore/writers?category=diy")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Writer>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        Ok(())
    }
}
