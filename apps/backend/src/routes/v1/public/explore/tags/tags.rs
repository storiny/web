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
use time::OffsetDateTime;
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
struct Tag {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    name: String,
    follower_count: i32,
    story_count: i32,
    // Timestamps
    #[serde(with = "crate::iso8601::time")]
    created_at: OffsetDateTime,
    // Boolean flags
    is_following: bool,
}

#[get("/v1/public/explore/tags")]
#[tracing::instrument(
    name = "GET /v1/public/explore/tags",
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
WITH explore_tags AS (
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
            r#") AS tsq
)
"#,
        );
    }

    query_builder.push(
        r#"
SELECT
    -- Tag
    t.id AS "id",
    t.name AS "name",
    t.story_count as "story_count",
    t.follower_count as "follower_count",
    t.created_at as "created_at",
"#,
    );

    query_builder.push(if user_id.is_some() {
        r#"
-- Boolean flags
"st->is_following".tag_id IS NOT NULL AS "is_following"
"#
    } else {
        r#"FALSE as "is_following""#
    });

    if has_search_query {
        query_builder.push(",");
        query_builder.push(
            r#"
-- Query score
TS_RANK_CD(t.search_vec, (SELECT tsq FROM search_query)) AS "query_score"
"#,
        );
    }

    query_builder.push(
        r#"
FROM
    tags AS t
        -- Join story_tag
        INNER JOIN story_tags AS st
            ON st.tag_id = t.id
        -- Join story_tag story
        INNER JOIN stories AS "st->story"
            ON st.story_id = "st->story".id
            AND "st->story".visibility = 2
            AND "st->story".published_at IS NOT NULL
            AND "st->story".deleted_at IS NULL
            -- Include all the stories when the category is `others`
            AND CASE WHEN $1 = 'others' THEN TRUE ELSE "st->story".category::TEXT = $1 END
"#,
    );

    if user_id.is_some() {
        query_builder.push(
            r#"
-- Boolean following flag
LEFT OUTER JOIN tag_followers AS "st->is_following"
    ON "st->is_following".tag_id = t.id
    AND "st->is_following".user_id = $4
    AND "st->is_following".deleted_at IS NULL
"#,
        );
    }

    if has_search_query {
        query_builder.push(
            r#"
WHERE
    t.search_vec @@ (SELECT tsq FROM search_query)
"#,
        );
    }

    query_builder.push(
        r#"
GROUP BY
    t.id
"#,
    );

    if user_id.is_some() {
        query_builder.push(",");
        query_builder.push(r#" "st->is_following".tag_id "#);
    }

    query_builder.push(r#" ORDER BY "#);

    if has_search_query {
        query_builder.push("query_score DESC");
        query_builder.push(",");
    }

    query_builder.push(
        r#"
        t.follower_count DESC
    LIMIT $2 OFFSET $3
)
SELECT
    -- Tag
    id,
    name,
    story_count,
    follower_count,
    created_at,
    -- Boolean flags
    is_following
FROM explore_tags
"#,
    );

    let mut db_query = query_builder
        .build_query_as::<Tag>()
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
            .uri("/v1/public/explore/tags?category=invalid")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Invalid story category").await;

        Ok(())
    }

    // Logged-out

    #[sqlx::test(fixtures("tag"))]
    async fn can_return_explore_tags(pool: PgPool) -> sqlx::Result<()> {
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        let req = test::TestRequest::get()
            .uri("/v1/public/explore/tags?category=diy")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Tag>>(&res_to_string(res).await);

        assert!(json.is_ok());

        let tags = json.unwrap();

        assert_eq!(tags.len(), 2);
        assert!(tags.iter().all(|tag| !tag.is_following));

        Ok(())
    }

    #[sqlx::test(fixtures("tag"))]
    async fn can_search_explore_tags(pool: PgPool) -> sqlx::Result<()> {
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        let req = test::TestRequest::get()
            .uri(&format!(
                "/v1/public/explore/tags?category=diy&query={}",
                encode("two")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Tag>>(&res_to_string(res).await).unwrap();

        assert!(json[0].name.contains("two"));
        assert_eq!(json.len(), 1);

        Ok(())
    }

    // Logged-in

    #[sqlx::test(fixtures("tag"))]
    async fn can_return_explore_tags_when_logged_in(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/public/explore/tags?category=diy")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Tag>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("tag"))]
    async fn can_return_is_following_flag_for_explore_tags_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/public/explore/tags?category=diy")
            .to_request();
        let res = test::call_service(&app, req).await;

        let tags = serde_json::from_str::<Vec<Tag>>(&res_to_string(res).await).unwrap();

        // Should be `false` initially.
        assert_eq!(tags.len(), 2);
        assert!(tags.iter().all(|tag| !tag.is_following));

        // Follow the tags.
        let result = sqlx::query(
            r#"
INSERT INTO tag_followers (tag_id, user_id)
VALUES ($2, $1), ($3, $1)
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/public/explore/tags?category=diy")
            .to_request();
        let res = test::call_service(&app, req).await;

        let tags = serde_json::from_str::<Vec<Tag>>(&res_to_string(res).await).unwrap();

        // Should be `true`.
        assert_eq!(tags.len(), 2);
        assert!(tags.iter().all(|tag| tag.is_following));

        Ok(())
    }

    #[sqlx::test(fixtures("tag"))]
    async fn can_search_explore_tags_when_logged_in(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/public/explore/tags?category=diy&query={}",
                encode("two")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Tag>>(&res_to_string(res).await).unwrap();

        assert!(json[0].name.contains("two"));
        assert_eq!(json.len(), 1);

        Ok(())
    }
}
