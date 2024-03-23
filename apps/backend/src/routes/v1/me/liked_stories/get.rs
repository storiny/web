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
    static ref SORT_REGEX: Regex = {
        #[allow(clippy::unwrap_used)]
        Regex::new(r"^(recent|old)$").unwrap()
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

#[derive(Debug, Serialize, Deserialize)]
struct Blog {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    name: String,
    slug: String,
    domain: Option<String>,
    logo_id: Option<Uuid>,
    logo_hex: Option<String>,
}

#[derive(sqlx::Type, Debug, Serialize, Deserialize)]
struct Tag {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    name: String,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct LikedStory {
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
    user: Json<User>,
    blog: Option<Json<Blog>>,
    tags: Vec<Tag>,
    // Boolean flags
    is_liked: bool,
    is_bookmarked: bool,
}

#[get("/v1/me/liked-stories")]
#[tracing::instrument(
    name = "GET /v1/me/liked-stories",
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
    let sort = query.sort.clone().unwrap_or("recent".to_string());
    let search_query = query.query.clone().unwrap_or_default();
    let has_search_query = !search_query.trim().is_empty();

    if has_search_query {
        let result = sqlx::query_file_as!(
            LikedStory,
            "queries/me/liked_stories/with_query.sql",
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
            LikedStory,
            "queries/me/liked_stories/default_asc.sql",
            user_id,
            10 as i16,
            (page * 10) as i16
        )
        .fetch_all(&data.db_pool)
        .await?;

        Ok(HttpResponse::Ok().json(result))
    } else {
        let result = sqlx::query_file_as!(
            LikedStory,
            "queries/me/liked_stories/default_desc.sql",
            user_id,
            10 as i16,
            (page * 10) as i16
        )
        .fetch_all(&data.db_pool)
        .await?;

        Ok(HttpResponse::Ok().json(result))
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}

// TODO: Clean after https://github.com/launchbadge/sqlx/issues/1031
impl ::sqlx::decode::Decode<'static, ::sqlx::Postgres> for User
where
    i64: ::sqlx::decode::Decode<'static, ::sqlx::Postgres>,
    i64: ::sqlx::types::Type<::sqlx::Postgres>,
    String: ::sqlx::decode::Decode<'static, ::sqlx::Postgres>,
    String: ::sqlx::types::Type<::sqlx::Postgres>,
    Option<String>: ::sqlx::decode::Decode<'static, ::sqlx::Postgres>,
    Option<String>: ::sqlx::types::Type<::sqlx::Postgres>,
    Option<Uuid>: ::sqlx::decode::Decode<'static, ::sqlx::Postgres>,
    Option<Uuid>: ::sqlx::types::Type<::sqlx::Postgres>,
    i32: ::sqlx::decode::Decode<'static, ::sqlx::Postgres>,
    i32: ::sqlx::types::Type<::sqlx::Postgres>,
{
    fn decode(
        value: ::sqlx::postgres::PgValueRef<'static>,
    ) -> Result<Self, Box<dyn ::std::error::Error + 'static + Send + Sync>> {
        let mut decoder = ::sqlx::postgres::types::PgRecordDecoder::new(value)?;
        let id = decoder.try_decode::<i64>()?;
        let name = decoder.try_decode::<String>()?;
        let username = decoder.try_decode::<String>()?;
        let avatar_id = decoder.try_decode::<Option<Uuid>>()?;
        let avatar_hex = decoder.try_decode::<Option<String>>()?;
        let public_flags = decoder.try_decode::<i32>()?;

        Ok(User {
            id,
            name,
            username,
            avatar_id,
            avatar_hex,
            public_flags,
        })
    }
}

impl ::sqlx::Type<::sqlx::Postgres> for User {
    fn type_info() -> ::sqlx::postgres::PgTypeInfo {
        ::sqlx::postgres::PgTypeInfo::with_name("User")
    }
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

    #[sqlx::test(fixtures("liked_story"))]
    async fn can_return_liked_stories(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Like some stories.
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2), ($1, $3)
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/liked-stories")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await);

        assert!(json.is_ok());

        let liked_stories = json.unwrap();

        assert_eq!(liked_stories.len(), 2);
        assert!(liked_stories.iter().all(|story| story.is_liked));

        Ok(())
    }

    #[sqlx::test(fixtures("liked_story"))]
    async fn can_return_liked_stories_in_desc_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Like some stories.
        sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/liked-stories?sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 4_i64);
        assert_eq!(json[1].id, 3_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("liked_story"))]
    async fn can_return_liked_stories_in_asc_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Like some stories.
        sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/liked-stories?sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await).unwrap();

        assert_eq!(json[0].id, 3_i64);
        assert_eq!(json[1].id, 4_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("liked_story"))]
    async fn can_search_liked_stories(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Like some stories.
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2), ($1, $3)
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/liked-stories?query={}", encode("ancient")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await).unwrap();

        assert!(json[0].title.contains("ancient"));
        assert_eq!(json.len(), 1);

        Ok(())
    }

    //

    #[sqlx::test(fixtures("liked_story"))]
    async fn can_return_is_bookmarked_flag_for_liked_stories(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Like a story.
        sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/liked-stories")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await).unwrap();
        let liked_story = &json[0];
        assert!(!liked_story.is_bookmarked);

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
            .uri("/v1/me/liked-stories")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await).unwrap();
        let liked_story = &json[0];
        assert!(liked_story.is_bookmarked);

        Ok(())
    }

    #[sqlx::test(fixtures("liked_story"))]
    async fn can_return_is_bookmarked_flag_for_liked_stories_in_asc_order(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Like a story.
        sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/liked-stories?sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await).unwrap();
        let liked_story = &json[0];
        assert!(!liked_story.is_bookmarked);

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
            .uri("/v1/me/liked-stories?sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await).unwrap();
        let liked_story = &json[0];
        assert!(liked_story.is_bookmarked);

        Ok(())
    }

    #[sqlx::test(fixtures("liked_story"))]
    async fn can_return_is_bookmarked_flag_for_liked_stories_in_desc_order(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Like a story.
        sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/liked-stories?sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await).unwrap();
        let liked_story = &json[0];
        assert!(!liked_story.is_bookmarked);

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
            .uri("/v1/me/liked-stories?sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await).unwrap();
        let liked_story = &json[0];
        assert!(liked_story.is_bookmarked);

        Ok(())
    }

    #[sqlx::test(fixtures("liked_story"))]
    async fn can_return_is_bookmarked_flag_for_liked_stories_when_searching(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Like a story.
        sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/liked-stories?query={}", encode("ancient")))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await).unwrap();
        let liked_story = &json[0];
        assert!(!liked_story.is_bookmarked);

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
            .uri(&format!("/v1/me/liked-stories?query={}", encode("ancient")))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await).unwrap();
        let liked_story = &json[0];
        assert!(liked_story.is_bookmarked);

        Ok(())
    }

    //

    #[sqlx::test(fixtures("liked_story"))]
    async fn should_not_include_soft_deleted_stories_in_liked_stories(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Like some stories.
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2), ($1, $3)
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the stories initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/liked-stories")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await);

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
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one story.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/liked-stories")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Recover the soft-deleted story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the stories again.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/liked-stories")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("liked_story"))]
    async fn should_not_include_unpublished_stories_in_liked_stories(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Like some stories.
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2), ($1, $3)
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the stories initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/liked-stories")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Unpublish one of the stories.
        let result = sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one story.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/liked-stories")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Republish the unpublished story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the stories again.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/liked-stories")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    //

    #[sqlx::test(fixtures("liked_story"))]
    async fn should_not_include_soft_deleted_stories_in_liked_stories_in_asc_order(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Like some stories.
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2), ($1, $3)
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the stories initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/liked-stories?sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await);

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
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one story.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/liked-stories?sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Recover the soft-deleted story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the stories again.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/liked-stories?sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("liked_story"))]
    async fn should_not_include_unpublished_stories_in_liked_stories_in_asc_order(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Like some stories.
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2), ($1, $3)
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the stories initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/liked-stories?sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Unpublish one of the stories.
        let result = sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one story.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/liked-stories?sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Republish the unpublished story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the stories again.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/liked-stories?sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    //

    #[sqlx::test(fixtures("liked_story"))]
    async fn should_not_include_soft_deleted_stories_in_liked_stories_in_desc_order(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Like some stories.
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2), ($1, $3)
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the stories initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/liked-stories?sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await);

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
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one story.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/liked-stories?sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Recover the soft-deleted story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the stories again.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/liked-stories?sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("liked_story"))]
    async fn should_not_include_unpublished_stories_in_liked_stories_in_desc_order(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Like some stories.
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2), ($1, $3)
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the stories initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/liked-stories?sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Unpublish one of the stories.
        let result = sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one story.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/liked-stories?sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Republish the unpublished story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the stories again.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/liked-stories?sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    //

    #[sqlx::test(fixtures("liked_story"))]
    async fn should_not_include_soft_deleted_stories_in_liked_stories_when_searching(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Like some stories.
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2), ($1, $3)
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the stories initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/liked-stories?query={}", encode("ancient")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Soft-delete one of the stories.
        let result = sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one story.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/liked-stories?query={}", encode("ancient")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 0);

        // Recover the soft-deleted story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the stories again.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/liked-stories?query={}", encode("ancient")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("liked_story"))]
    async fn should_not_include_unpublished_stories_in_liked_stories_when_searching(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Like some stories.
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2), ($1, $3)
"#,
        )
        .bind(user_id.unwrap())
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the stories initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/liked-stories?query={}", encode("ancient")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Unpublish one of the stories.
        let result = sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one story.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/liked-stories?query={}", encode("ancient")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 0);

        // Republish the unpublished story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the stories again.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/liked-stories?query={}", encode("ancient")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<LikedStory>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        Ok(())
    }
}
