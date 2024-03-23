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
        Regex::new(r"^(recent|old|(least|most)-(popular|liked))$").unwrap()
    };
    static ref TYPE_REGEX: Regex = {
        #[allow(clippy::unwrap_used)]
        Regex::new(r"^(published|deleted)$").unwrap()
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

#[derive(sqlx::Type, Debug, Serialize, Deserialize)]
struct Tag {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    name: String,
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
struct PublishedStory {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    title: String,
    slug: String,
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
    read_count: i32,
    like_count: i32,
    comment_count: i32,
    // Timestamps
    #[serde(with = "crate::iso8601::time")]
    published_at: OffsetDateTime,
    #[serde(with = "crate::iso8601::time::option")]
    edited_at: Option<OffsetDateTime>,
    // Joins
    tags: Vec<Tag>,
    // Boolean flags
    is_liked: bool,
    is_bookmarked: bool,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct DeletedStory {
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

#[get("/v1/me/stories")]
#[tracing::instrument(
    name = "GET /v1/me/stories",
    skip_all,
    fields(
        user_id = user.id().ok(),
        page = query.page,
        r#type = query.r#type,
        query = query.query,
        sort = query.sort
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
    let r#type = query.r#type.clone().unwrap_or("published".to_string());
    let search_query = query.query.clone().unwrap_or_default();
    let has_search_query = !search_query.trim().is_empty();

    // Published stories
    if r#type == "published" {
        if has_search_query {
            let result = sqlx::query_file_as!(
                PublishedStory,
                "queries/me/stories/with_query.sql",
                search_query,
                user_id,
                10 as i16,
                (page * 10) as i16
            )
            .fetch_all(&data.db_pool)
            .await?;

            Ok(HttpResponse::Ok().json(result))
        } else if sort == "old" {
            let result = sqlx::query_file_as!(
                PublishedStory,
                "queries/me/stories/default_asc.sql",
                user_id,
                10 as i16,
                (page * 10) as i16
            )
            .fetch_all(&data.db_pool)
            .await?;

            Ok(HttpResponse::Ok().json(result))
        } else if sort == "least-popular" {
            let result = sqlx::query_file_as!(
                PublishedStory,
                "queries/me/stories/least_popular.sql",
                user_id,
                10 as i16,
                (page * 10) as i16
            )
            .fetch_all(&data.db_pool)
            .await?;

            Ok(HttpResponse::Ok().json(result))
        } else if sort == "most-popular" {
            let result = sqlx::query_file_as!(
                PublishedStory,
                "queries/me/stories/most_popular.sql",
                user_id,
                10 as i16,
                (page * 10) as i16
            )
            .fetch_all(&data.db_pool)
            .await?;

            Ok(HttpResponse::Ok().json(result))
        } else if sort == "least-liked" {
            let result = sqlx::query_file_as!(
                PublishedStory,
                "queries/me/stories/least_liked.sql",
                user_id,
                10 as i16,
                (page * 10) as i16
            )
            .fetch_all(&data.db_pool)
            .await?;

            Ok(HttpResponse::Ok().json(result))
        } else if sort == "most-liked" {
            let result = sqlx::query_file_as!(
                PublishedStory,
                "queries/me/stories/most_liked.sql",
                user_id,
                10 as i16,
                (page * 10) as i16
            )
            .fetch_all(&data.db_pool)
            .await?;

            Ok(HttpResponse::Ok().json(result))
        } else {
            let result = sqlx::query_file_as!(
                PublishedStory,
                "queries/me/stories/default_desc.sql",
                user_id,
                10 as i16,
                (page * 10) as i16
            )
            .fetch_all(&data.db_pool)
            .await?;

            Ok(HttpResponse::Ok().json(result))
        }
    } else {
        // Deleted stories.
        let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
            r#"
WITH deleted_stories AS (
    SELECT
        -- Story
        s.id,
        s.title,
        s.description,
        s.splash_id,
        s.splash_hex,
        s.category::TEXT,
        s.age_restriction,
        s.license,
        s.user_id,
        -- Stats
        s.word_count,
        -- Timestamps
        s.created_at,
        s.edited_at,
        s.deleted_at
    FROM
        stories s
    WHERE
        s.user_id = $1
        AND s.deleted_at IS NOT NULL
        -- Use `first_published_at` instead of `published_at` to ensure
        -- that soft-deleted drafts are excluded from the results
        AND s.first_published_at IS NOT NULL
    ORDER BY
"#,
        );

        query_builder.push(match sort.as_str() {
            "old" => "s.deleted_at",
            _ => "s.deleted_at DESC",
        });

        query_builder.push(
            r#"
    LIMIT $2 OFFSET $3
)
SELECT
    -- Story
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
FROM deleted_stories
"#,
        );

        let result = query_builder
            .build_query_as::<DeletedStory>()
            .bind(user_id)
            .bind(10_i16)
            .bind((page * 10) as i16)
            .fetch_all(&data.db_pool)
            .await?;

        Ok(HttpResponse::Ok().json(result))
    }
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

    // Published

    #[sqlx::test]
    async fn can_return_published_stories(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some published stories.
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (user_id, slug, published_at)
VALUES ($1, 'sample-story-1', NOW()), ($1, 'sample-story-2', NOW())
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stories?type=published")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 2);

        Ok(())
    }

    //

    #[sqlx::test]
    async fn can_return_is_liked_flag_for_published_stories(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert a published story.
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id, slug, published_at)
VALUES ($2, $1, 'sample-story-1', NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/stories")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(!story.is_liked);

        // Like the story.
        let result = sqlx::query(
            r#"
INSERT INTO story_likes (story_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stories")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(story.is_liked);

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_is_bookmarked_flag_for_published_stories(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert a published story.
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id, slug, published_at)
VALUES ($2, $1, 'sample-story-1', NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/stories")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(!story.is_bookmarked);

        // Bookmark the story.
        let result = sqlx::query(
            r#"
INSERT INTO bookmarks (story_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stories")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(story.is_bookmarked);

        Ok(())
    }

    //

    #[sqlx::test]
    async fn can_return_is_liked_flag_for_published_stories_in_asc_order(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert a published story.
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id, slug, published_at)
VALUES ($2, $1, 'sample-story-1', NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/stories?sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(!story.is_liked);

        // Like the story.
        let result = sqlx::query(
            r#"
INSERT INTO story_likes (story_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stories?sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(story.is_liked);

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_is_bookmarked_flag_for_published_stories_in_asc_order(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert a published story.
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id, slug, published_at)
VALUES ($2, $1, 'sample-story-1', NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/stories?sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(!story.is_bookmarked);

        // Bookmark the story.
        let result = sqlx::query(
            r#"
INSERT INTO bookmarks (story_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stories?sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(story.is_bookmarked);

        Ok(())
    }

    //

    #[sqlx::test]
    async fn can_return_is_liked_flag_for_published_stories_in_desc_order(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert a published story.
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id, slug, published_at)
VALUES ($2, $1, 'sample-story-1', NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/stories?sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(!story.is_liked);

        // Like the story.
        let result = sqlx::query(
            r#"
INSERT INTO story_likes (story_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stories?sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(story.is_liked);

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_is_bookmarked_flag_for_published_stories_in_desc_order(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert a published story.
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id, slug, published_at)
VALUES ($2, $1, 'sample-story-1', NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/stories?sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(!story.is_bookmarked);

        // Bookmark the story.
        let result = sqlx::query(
            r#"
INSERT INTO bookmarks (story_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stories?sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(story.is_bookmarked);

        Ok(())
    }

    //

    #[sqlx::test]
    async fn can_return_is_liked_flag_for_published_stories_in_least_popular_order(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert a published story.
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id, slug, published_at)
VALUES ($2, $1, 'sample-story-1', NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/stories?sort=least-popular")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(!story.is_liked);

        // Like the story.
        let result = sqlx::query(
            r#"
INSERT INTO story_likes (story_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stories?sort=least-popular")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(story.is_liked);

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_is_bookmarked_flag_for_published_stories_in_least_popular_order(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert a published story.
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id, slug, published_at)
VALUES ($2, $1, 'sample-story-1', NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/stories?sort=least-popular")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(!story.is_bookmarked);

        // Bookmark the story.
        let result = sqlx::query(
            r#"
INSERT INTO bookmarks (story_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stories?sort=least-popular")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(story.is_bookmarked);

        Ok(())
    }

    //

    #[sqlx::test]
    async fn can_return_is_liked_flag_for_published_stories_in_most_popular_order(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert a published story.
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id, slug, published_at)
VALUES ($2, $1, 'sample-story-1', NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/stories?sort=most-popular")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(!story.is_liked);

        // Like the story.
        let result = sqlx::query(
            r#"
INSERT INTO story_likes (story_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stories?sort=most-popular")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(story.is_liked);

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_is_bookmarked_flag_for_published_stories_in_most_popular_order(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert a published story.
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id, slug, published_at)
VALUES ($2, $1, 'sample-story-1', NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/stories?sort=most-popular")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(!story.is_bookmarked);

        // Bookmark the story.
        let result = sqlx::query(
            r#"
INSERT INTO bookmarks (story_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stories?sort=most-popular")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(story.is_bookmarked);

        Ok(())
    }

    //

    #[sqlx::test]
    async fn can_return_is_liked_flag_for_published_stories_in_least_liked_order(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert a published story.
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id, slug, published_at)
VALUES ($2, $1, 'sample-story-1', NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/stories?sort=least-liked")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(!story.is_liked);

        // Like the story.
        let result = sqlx::query(
            r#"
INSERT INTO story_likes (story_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stories?sort=least-liked")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(story.is_liked);

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_is_bookmarked_flag_for_published_stories_in_least_liked_order(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert a published story.
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id, slug, published_at)
VALUES ($2, $1, 'sample-story-1', NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/stories?sort=least-liked")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(!story.is_bookmarked);

        // Bookmark the story.
        let result = sqlx::query(
            r#"
INSERT INTO bookmarks (story_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stories?sort=least-liked")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(story.is_bookmarked);

        Ok(())
    }

    //

    #[sqlx::test]
    async fn can_return_is_liked_flag_for_published_stories_in_most_liked_order(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert a published story.
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id, slug, published_at)
VALUES ($2, $1, 'sample-story-1', NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/stories?sort=most-liked")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(!story.is_liked);

        // Like the story.
        let result = sqlx::query(
            r#"
INSERT INTO story_likes (story_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stories?sort=most-liked")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(story.is_liked);

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_is_bookmarked_flag_for_published_stories_in_most_liked_order(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert a published story.
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id, slug, published_at)
VALUES ($2, $1, 'sample-story-1', NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/stories?sort=most-liked")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(!story.is_bookmarked);

        // Bookmark the story.
        let result = sqlx::query(
            r#"
INSERT INTO bookmarks (story_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stories?sort=most-liked")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(story.is_bookmarked);

        Ok(())
    }

    //

    #[sqlx::test]
    async fn can_return_is_liked_flag_for_published_stories_when_searching(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert a published story.
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id, title, slug, published_at)
VALUES ($2, $1, 'one', 'sample-story-1', NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/stories?type=published&query={}",
                encode("one")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(!story.is_liked);

        // Like the story.
        let result = sqlx::query(
            r#"
INSERT INTO story_likes (story_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/stories?type=published&query={}",
                encode("one")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(story.is_liked);

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_is_bookmarked_flag_for_published_stories_when_searching(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert a published story.
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id, title, slug, published_at)
VALUES ($2, $1, 'one', 'sample-story-1', NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/me/stories?type=published&query={}",
                encode("one")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(!story.is_bookmarked);

        // Bookmark the story.
        let result = sqlx::query(
            r#"
INSERT INTO bookmarks (story_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/stories?type=published&query={}",
                encode("one")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(story.is_bookmarked);

        Ok(())
    }

    //

    #[sqlx::test]
    async fn can_return_published_stories_in_asc_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some published stories.
        sqlx::query(
            r#"
INSERT INTO stories (id, user_id, slug, published_at)
VALUES ($1, $2, 'sample-story-1', NOW())
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO stories (id, user_id, slug, published_at)
VALUES ($1, $2, 'sample-story-2', NOW())
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stories?type=published&sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 2_i64);
        assert_eq!(json[1].id, 3_i64);

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_published_stories_in_desc_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some published stories.
        sqlx::query(
            r#"
INSERT INTO stories (id, user_id, slug, published_at)
VALUES ($1, $2, 'sample-story-1', NOW())
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO stories (id, user_id, slug, published_at)
VALUES ($1, $2, 'sample-story-2', NOW())
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stories?type=published&sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 3_i64);
        assert_eq!(json[1].id, 2_i64);

        Ok(())
    }

    //

    #[sqlx::test]
    async fn can_return_published_stories_in_least_popular_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some published stories.
        sqlx::query(
            r#"
INSERT INTO stories (id, user_id, slug, published_at)
VALUES ($1, $2, 'sample-story-1', NOW())
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO stories (id, user_id, slug, published_at, read_count)
VALUES ($1, $2, 'sample-story-2', NOW(), 1)
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stories?type=published&sort=least-popular")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 2_i64);
        assert_eq!(json[1].id, 3_i64);

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_published_stories_in_most_popular_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some published stories.
        sqlx::query(
            r#"
INSERT INTO stories (id, user_id, slug, published_at, read_count)
VALUES ($1, $2, 'sample-story-1', NOW(), 1)
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO stories (id, user_id, slug, published_at)
VALUES ($1, $2, 'sample-story-2', NOW())
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stories?type=published&sort=most-popular")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 2_i64);
        assert_eq!(json[1].id, 3_i64);

        Ok(())
    }

    //

    #[sqlx::test]
    async fn can_return_published_stories_in_least_liked_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some published stories.
        sqlx::query(
            r#"
INSERT INTO stories (id, user_id, slug, published_at)
VALUES ($1, $2, 'sample-story-1', NOW())
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO stories (id, user_id, slug, published_at, like_count)
VALUES ($1, $2, 'sample-story-2', NOW(), 1)
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stories?type=published&sort=least-liked")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 2_i64);
        assert_eq!(json[1].id, 3_i64);

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_published_stories_in_most_liked_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some published stories.
        sqlx::query(
            r#"
INSERT INTO stories (id, user_id, slug, published_at, like_count)
VALUES ($1, $2, 'sample-story-1', NOW(), 1)
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO stories (id, user_id, slug, published_at)
VALUES ($1, $2, 'sample-story-2', NOW())
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stories?type=published&sort=most-liked")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 2_i64);
        assert_eq!(json[1].id, 3_i64);

        Ok(())
    }

    //

    #[sqlx::test]
    async fn can_search_published_stories(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some published stories.
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (title, user_id, slug, published_at)
VALUES ($1, $3, 'sample-story-1', NOW()), ($2, $3, 'sample-story-2', NOW())
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
                "/v1/me/stories?type=published&query={}",
                encode("two")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert_eq!(json[0].title, "two".to_string());

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_include_deleted_stories_in_published_stories(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some published stories.
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id, slug, published_at)
VALUES ($1, $3, 'sample-story-1', NOW()), ($2, $3, 'sample-story-2', NOW())
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the published stories initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/stories?type=published")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Soft-delete one of the stories.
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

        // Should return only one story.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/stories?type=published")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<PublishedStory>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        Ok(())
    }

    // Deleted

    #[sqlx::test]
    async fn can_return_deleted_stories(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some deleted stories.
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (user_id, first_published_at, deleted_at)
VALUES ($1, NOW(), NOW()), ($1, NOW(), NOW())
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stories?type=deleted")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<DeletedStory>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_deleted_stories_in_asc_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some deleted stories.
        sqlx::query(
            r#"
INSERT INTO stories (id, user_id, first_published_at, deleted_at)
VALUES ($1, $2, NOW(), NOW())
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO stories (id, user_id, first_published_at, deleted_at)
VALUES ($1, $2, NOW(), NOW())
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stories?type=deleted&sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<DeletedStory>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 2_i64);
        assert_eq!(json[1].id, 3_i64);

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_deleted_stories_in_desc_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some deleted stories.
        sqlx::query(
            r#"
INSERT INTO stories (id, user_id, first_published_at, deleted_at)
VALUES ($1, $2, NOW(), NOW())
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO stories (id, user_id, first_published_at, deleted_at)
VALUES ($1, $2, NOW(), NOW())
"#,
        )
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stories?type=deleted&sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<DeletedStory>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 3_i64);
        assert_eq!(json[1].id, 2_i64);

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_include_published_stories_in_deleted_stories(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some deleted stories.
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (id, user_id, first_published_at, deleted_at)
VALUES ($1, $3, NOW(), NOW()), ($2, $3, NOW(), NOW())
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the deleted stories initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/stories?type=deleted")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<DeletedStory>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Recover one of the stories.
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

        // Should return only one story.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/stories?type=deleted")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<DeletedStory>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Soft-delete the story.
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

        // Should return all the deleted stories again.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stories?type=deleted")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<DeletedStory>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }
}
