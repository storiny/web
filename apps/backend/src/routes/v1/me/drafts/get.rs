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
use time::OffsetDateTime;
use uuid::Uuid;
use validator::Validate;

lazy_static! {
    static ref SORT_REGEX: Regex = {
        #[allow(clippy::unwrap_used)]
        Regex::new(r"^(recent|old)$").unwrap()
    };
    static ref TYPE_REGEX: Regex = {
        #[allow(clippy::unwrap_used)]
        Regex::new(r"^(pending|deleted)$").unwrap()
    };
}

#[derive(Serialize, Deserialize, Validate)]
struct QueryParams {
    #[validate(range(min = 1, max = 1000))]
    page: Option<u16>,
    #[validate(regex = "SORT_REGEX")]
    sort: Option<String>,
    #[validate(regex = "TYPE_REGEX")]
    r#type: Option<String>,
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
struct Draft {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    title: String,
    description: Option<String>,
    splash_id: Option<Uuid>,
    splash_hex: Option<String>,
    category: String,
    age_restriction: i16,
    license: i16,
    #[serde(with = "crate::snowflake_id")]
    user_id: i64,
    // Stats
    word_count: i32,
    // Timestamps
    #[serde(with = "crate::iso8601::time")]
    created_at: OffsetDateTime,
    #[serde(with = "crate::iso8601::time::option")]
    edited_at: Option<OffsetDateTime>,
    #[serde(with = "crate::iso8601::time::option")]
    deleted_at: Option<OffsetDateTime>,
}

#[get("/v1/me/drafts")]
#[tracing::instrument(
    name = "GET /v1/me/drafts",
    skip_all,
    fields(
        user_id = user.id().ok(),
        page = query.page,
        sort = query.sort,
        r#type = query.r#type,
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
    let sort = query.sort.clone().unwrap_or("recent".to_string());
    let r#type = query.r#type.clone().unwrap_or("pending".to_string());
    let search_query = query.query.clone().unwrap_or_default();
    let has_search_query = !search_query.trim().is_empty();

    let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
        r#"
WITH drafts AS (
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
    -- Draft
    d.id,
    d.title,
    d.description,
    d.splash_id,
    d.splash_hex,
    d.category::TEXT,
    d.age_restriction,
    d.license,
    d.user_id,
    -- Stats
    d.word_count,
    -- Timestamps
    d.created_at,
    d.edited_at,
    d.deleted_at
"#,
    );

    if has_search_query {
        query_builder.push(",");
        query_builder.push(
            r#"
-- Query score
TS_RANK_CD(d.search_vec, (SELECT tsq FROM search_query)) AS "query_score"
"#,
        );
    }

    query_builder.push(
        r#"
FROM
    stories d
WHERE
    d.user_id = $1
    -- Use `first_published_at` instead of `published_at` to ensure
    -- that soft-deleted published stories are excluded from results
    AND d.first_published_at IS NULL
"#,
    );

    if has_search_query {
        query_builder.push(r#"AND d.search_vec @@ (SELECT tsq FROM search_query)"#);
    }

    query_builder.push(match r#type.as_str() {
        "deleted" => "AND d.deleted_at IS NOT NULL",
        _ => "AND d.deleted_at IS NULL",
    });

    query_builder.push(" ORDER BY ");

    if has_search_query {
        query_builder.push("query_score DESC");
        query_builder.push(",");
    }

    if r#type == "deleted" {
        // Deleted
        query_builder.push(match sort.as_str() {
            "old" => "d.deleted_at",
            _ => "d.deleted_at DESC",
        });
    } else {
        // Pending
        query_builder.push(match sort.as_str() {
            "old" => "d.created_at",
            _ => {
                r#"
d.edited_at DESC NULLS LAST,
d.created_at DESC
"#
            }
        });
    }

    query_builder.push(
        r#"
    LIMIT $2 OFFSET $3
)
SELECT
    -- Draft
    id,
    title,
    description,
    splash_id,
    splash_hex,
    category,
    age_restriction,
    license,
    user_id,
    -- Stats
    word_count,
    -- Timestamps
    created_at,
    edited_at,
    deleted_at
FROM drafts
"#,
    );

    let mut db_query = query_builder
        .build_query_as::<Draft>()
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

    // Pending

    #[sqlx::test]
    async fn can_return_pending_drafts(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some pending drafts.
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (user_id)
VALUES ($1), ($1)
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/drafts?type=pending")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Draft>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 2);

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_pending_drafts_in_asc_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some pending drafts.
        sqlx::query(
            r#"
INSERT INTO stories(id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO stories(id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/drafts?type=pending&sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Draft>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 2_i64);
        assert_eq!(json[1].id, 3_i64);

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_pending_drafts_in_desc_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some pending drafts.
        sqlx::query(
            r#"
INSERT INTO stories(id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO stories(id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/drafts?type=pending&sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Draft>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 3_i64);
        assert_eq!(json[1].id, 2_i64);

        Ok(())
    }

    #[sqlx::test]
    async fn can_search_pending_drafts(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some pending drafts
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (title, user_id)
VALUES ($1, $3), ($2, $3)
"#,
        )
        .bind("one")
        .bind("two")
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/drafts?type=pending&query={}",
                encode("two")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Draft>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert_eq!(json[0].title, "two".to_string());

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_include_deleted_drafts_in_pending_drafts(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some pending drafts.
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id)
VALUES ($1, $3), ($2, $3)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the pending drafts initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/drafts?type=pending")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Draft>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Soft-delete one of the drafts.
        let result = sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one draft.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/drafts?type=pending")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Draft>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Recover the draft.
        let result = sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the pending drafts again.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/drafts?type=pending")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Draft>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    // Deleted

    #[sqlx::test]
    async fn can_return_deleted_drafts(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some deleted drafts.
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (user_id, deleted_at)
VALUES ($1, NOW()), ($1, NOW())
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/drafts?type=deleted")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Draft>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 2);

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_deleted_drafts_in_asc_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some deleted drafts.
        sqlx::query(
            r#"
INSERT INTO stories(id, user_id, deleted_at)
VALUES ($1, $2, now())
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO stories(id, user_id, deleted_at)
VALUES ($1, $2, now())
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/drafts?type=deleted&sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Draft>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 2_i64);
        assert_eq!(json[1].id, 3_i64);

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_deleted_drafts_in_desc_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some deleted drafts.
        sqlx::query(
            r#"
INSERT INTO stories(id, user_id, deleted_at)
VALUES ($1, $2, now())
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO stories(id, user_id, deleted_at)
VALUES ($1, $2, now())
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/drafts?type=deleted&sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Draft>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 3_i64);
        assert_eq!(json[1].id, 2_i64);

        Ok(())
    }

    #[sqlx::test]
    async fn can_search_deleted_drafts(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some deleted drafts.
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (title, user_id, deleted_at)
VALUES ($1, $3, NOW()), ($2, $3, NOW())
"#,
        )
        .bind("one")
        .bind("two")
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/drafts?type=deleted&query={}",
                encode("two")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Draft>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert_eq!(json[0].title, "two".to_string());

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_include_pending_drafts_in_deleted_drafts(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some deleted drafts.
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id, deleted_at)
VALUES ($1, $3, NOW()), ($2, $3, NOW())
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the deleted drafts initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/drafts?type=deleted")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Draft>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Recover one of the drafts.
        let result = sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one draft.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/drafts?type=deleted")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Draft>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Soft-delete the draft.
        let result = sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the deleted drafts again.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/drafts?type=deleted")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Draft>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }
}
