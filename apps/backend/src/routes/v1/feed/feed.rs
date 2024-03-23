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
    static ref TYPE_REGEX: Regex = {
        #[allow(clippy::unwrap_used)]
        Regex::new(r"^(suggested|friends-and-following)$").unwrap()
    };
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
struct Story {
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

#[get("/v1/feed")]
#[tracing::instrument(
    name = "GET /v1/feed",
    skip_all,
    fields(
        user_id = tracing::field::Empty,
        r#type = query.r#type,
        page = query.page
    ),
    err
)]
async fn get(
    query: QsQuery<QueryParams>,
    data: web::Data<AppState>,
    user: Option<Identity>,
) -> Result<HttpResponse, AppError> {
    let user_id = user.map(|user| user.id()).transpose()?;

    tracing::Span::current().record("user_id", user_id);

    let page = query.page.unwrap_or(1) - 1;
    let r#type = query.r#type.clone().unwrap_or("suggested".to_string());

    // Query for logged-in users.

    if let Some(user_id) = user_id {
        if r#type == "suggested" {
            let result = sqlx::query_file_as!(
                Story,
                "queries/home_feed/suggested.sql",
                user_id,
                10 as i16,
                (page * 10) as i16
            )
            .fetch_all(&data.db_pool)
            .await?;

            Ok(HttpResponse::Ok().json(result))
        } else {
            let result = sqlx::query_file_as!(
                Story,
                "queries/home_feed/friends_and_following.sql",
                user_id,
                10 as i16,
                (page * 10) as i16
            )
            .fetch_all(&data.db_pool)
            .await?;

            Ok(HttpResponse::Ok().json(result))
        }
    } else {
        let result = sqlx::query_file_as!(
            Story,
            "queries/home_feed/default.sql",
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
    use sqlx::{
        PgPool,
        Row,
    };

    // Logged-out

    #[sqlx::test(fixtures("feed"))]
    async fn can_generate_feed(pool: PgPool) -> sqlx::Result<()> {
        let (app, _, _) = init_app_for_test(get, pool, false, false, None).await;
        let req = test::TestRequest::get().uri("/v1/feed").to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert!(!json.unwrap().is_empty());

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_include_stories_from_private_users_in_feed(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, _) = init_app_for_test(get, pool, false, false, None).await;

        // Insert the story.
        let story_result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Sample user', 'sample_user', 'sample@example.com')
    RETURNING id
)
INSERT INTO stories (user_id, slug, published_at)
VALUES ((SELECT id FROM inserted_user), 'some-story', NOW())
RETURNING user_id
"#,
        )
        .fetch_one(&mut *conn)
        .await?;

        let req = test::TestRequest::get().uri("/v1/feed").to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should be included in the feed initially.
        assert_eq!(json.unwrap().len(), 1);

        // Make the user private.
        sqlx::query(
            r#"
UPDATE users
SET is_private = TRUE
WHERE id = $1
"#,
        )
        .bind(story_result.get::<i64, _>("user_id"))
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get().uri("/v1/feed").to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should not be included in the feed.
        assert_eq!(json.unwrap().len(), 0);

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_include_soft_deleted_stories_in_feed(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, _) = init_app_for_test(get, pool, false, false, None).await;

        // Insert the story.
        let story_result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Sample user', 'sample_user', 'sample@example.com')
    RETURNING id
)
INSERT INTO stories (user_id, slug, published_at)
VALUES ((SELECT id FROM inserted_user), 'some-story', NOW())
RETURNING id
"#,
        )
        .fetch_one(&mut *conn)
        .await?;

        let req = test::TestRequest::get().uri("/v1/feed").to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should be included in the feed initially.
        assert_eq!(json.unwrap().len(), 1);

        // Soft-delete the story.
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_result.get::<i64, _>("id"))
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get().uri("/v1/feed").to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should not be included in the feed.
        assert_eq!(json.unwrap().len(), 0);

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_include_unpublished_stories_in_feed(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, _) = init_app_for_test(get, pool, false, false, None).await;

        // Insert the story.
        let story_result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Sample user', 'sample_user', 'sample@example.com')
    RETURNING id
)
INSERT INTO stories (user_id, slug, published_at)
VALUES ((SELECT id FROM inserted_user), 'some-story', NOW())
RETURNING id
"#,
        )
        .fetch_one(&mut *conn)
        .await?;

        let req = test::TestRequest::get().uri("/v1/feed").to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should be included in the feed initially.
        assert_eq!(json.unwrap().len(), 1);

        // Unpublish the story.
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_result.get::<i64, _>("id"))
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get().uri("/v1/feed").to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should not be included in the feed.
        assert_eq!(json.unwrap().len(), 0);

        Ok(())
    }

    // Logged-in and type=suggested

    #[sqlx::test(fixtures("feed"))]
    async fn can_generate_feed_for_logged_in_user_and_suggested_type(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/feed?type=suggested")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert!(!json.unwrap().is_empty());

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_is_liked_flag_in_the_feed_for_logged_in_user_and_suggested_type(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert the story.
        let result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Some user 1', 'some_user_1', 'someone.1@example.com')
    RETURNING id
)
INSERT INTO stories (id, user_id, slug, published_at)
VALUES ($1, (SELECT id FROM inserted_user), 'story-1', NOW());
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/feed?type=suggested")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(!story.is_liked);

        // Like the story.
        let result = sqlx::query(
            r#"
INSERT INTO story_likes (story_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/feed?type=suggested")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(story.is_liked);

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_is_bookmarked_flag_in_the_feed_for_logged_in_user_and_suggested_type(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert the story.
        let result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Some user 1', 'some_user_1', 'someone.1@example.com')
    RETURNING id
)
INSERT INTO stories (id, user_id, slug, published_at)
VALUES ($1, (SELECT id FROM inserted_user), 'story-1', NOW());
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/feed?type=suggested")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(!story.is_bookmarked);

        // Bookmark the story.
        let result = sqlx::query(
            r#"
INSERT INTO bookmarks (story_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/feed?type=suggested")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(story.is_bookmarked);

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_include_stories_from_blocked_users_in_the_feed_for_suggested_type(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert the story.
        let story_result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Sample user', 'sample_user', 'sample@example.com')
    RETURNING id
)
INSERT INTO stories (user_id, slug, published_at)
VALUES ((SELECT id FROM inserted_user), 'some-story', NOW())
RETURNING user_id
"#,
        )
        .fetch_one(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/feed?type=suggested")
            .to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should be included in the feed initially.
        assert_eq!(json.unwrap().len(), 1);

        // Block the writer of the story.
        sqlx::query(
            r#"
INSERT INTO blocks (blocker_id, blocked_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(story_result.get::<i64, _>("user_id"))
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/feed?type=suggested")
            .to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should not be included in the feed.
        assert_eq!(json.unwrap().len(), 0);

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_include_stories_from_muted_users_in_the_feed_for_suggested_type(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert the story.
        let story_result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Sample user', 'sample_user', 'sample@example.com')
    RETURNING id
)
INSERT INTO stories (user_id, slug, published_at)
VALUES ((SELECT id FROM inserted_user), 'some-story', NOW())
RETURNING user_id
"#,
        )
        .fetch_one(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/feed?type=suggested")
            .to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should be included in the feed initially.
        assert_eq!(json.unwrap().len(), 1);

        // Mute the writer of the story.
        sqlx::query(
            r#"
INSERT INTO mutes (muter_id, muted_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(story_result.get::<i64, _>("user_id"))
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/feed?type=suggested")
            .to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should not be included in the feed.
        assert_eq!(json.unwrap().len(), 0);

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_include_stories_from_private_users_in_the_feed_who_are_not_in_friend_list_for_suggested_type(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert the story.
        let story_result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Sample user', 'sample_user', 'sample@example.com')
    RETURNING id
)
INSERT INTO stories (user_id, slug, published_at)
VALUES ((SELECT id FROM inserted_user), 'some-story', NOW())
RETURNING user_id
"#,
        )
        .fetch_one(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/feed?type=suggested")
            .to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should be included in the feed initially.
        assert_eq!(json.unwrap().len(), 1);

        // Make the writer of the story private.
        sqlx::query(
            r#"
UPDATE users
SET is_private = TRUE
WHERE id = $1
"#,
        )
        .bind(story_result.get::<i64, _>("user_id"))
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/feed?type=suggested")
            .to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should not be included in the feed.
        assert_eq!(json.unwrap().len(), 0);

        // Add the writer of the story as friend.
        sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(story_result.get::<i64, _>("user_id"))
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/feed?type=suggested")
            .to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should now include the story in the feed.
        assert_eq!(json.unwrap().len(), 1);

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_include_soft_deleted_stories_in_the_feed_for_suggested_type(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, false, None).await;

        // Insert the story.
        let story_result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Sample user', 'sample_user', 'sample@example.com')
    RETURNING id
)
INSERT INTO stories (user_id, slug, published_at)
VALUES ((SELECT id FROM inserted_user), 'some-story', NOW())
RETURNING id
"#,
        )
        .fetch_one(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/feed?type=suggested")
            .to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should be included in the feed initially.
        assert_eq!(json.unwrap().len(), 1);

        // Soft-delete the story.
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_result.get::<i64, _>("id"))
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/feed?type=suggested")
            .to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should not be included in the feed.
        assert_eq!(json.unwrap().len(), 0);

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_include_unpublished_stories_in_the_feed_for_suggested_type(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, false, None).await;

        // Insert the story.
        let story_result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Sample user', 'sample_user', 'sample@example.com')
    RETURNING id
)
INSERT INTO stories (user_id, slug, published_at)
VALUES ((SELECT id FROM inserted_user), 'some-story', NOW())
RETURNING id
"#,
        )
        .fetch_one(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/feed?type=suggested")
            .to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should be included in the feed initially.
        assert_eq!(json.unwrap().len(), 1);

        // Unpublish the story.
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_result.get::<i64, _>("id"))
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/feed?type=suggested")
            .to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should not be included in the feed.
        assert_eq!(json.unwrap().len(), 0);

        Ok(())
    }

    // Logged-in and type=friends-and-following

    #[sqlx::test(fixtures("feed"))]
    async fn can_generate_feed_for_logged_in_user_and_friends_and_following_type(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/feed?type=friends-and-following")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert!(!json.unwrap().is_empty());

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_is_liked_flag_in_the_feed_for_logged_in_user_and_friends_and_following_type(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert the story.
        let result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Sample user', 'sample_user', 'sample@example.com')
    RETURNING id
),
inserted_story AS (
    INSERT INTO stories (id, user_id, slug, published_at)
    VALUES ($2, (SELECT id FROM inserted_user), 'some-story', NOW())
)
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, (SELECT id FROM inserted_user))
RETURNING followed_id
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/feed?type=friends-and-following")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(!story.is_liked);

        // Like the story.
        let result = sqlx::query(
            r#"
INSERT INTO story_likes (story_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/feed?type=friends-and-following")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(story.is_liked);

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_is_bookmarked_flag_in_the_feed_for_logged_in_user_and_friends_and_following_type(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert the story.
        let result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Sample user', 'sample_user', 'sample@example.com')
    RETURNING id
),
inserted_story AS (
    INSERT INTO stories (id, user_id, slug, published_at)
    VALUES ($2, (SELECT id FROM inserted_user), 'some-story', NOW())
)
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, (SELECT id FROM inserted_user))
RETURNING followed_id
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/feed?type=friends-and-following")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(!story.is_bookmarked);

        // Bookmark the story.
        let result = sqlx::query(
            r#"
INSERT INTO bookmarks (story_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/feed?type=friends-and-following")
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(story.is_bookmarked);

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_include_stories_from_blocked_users_in_the_feed_for_friends_and_following_type(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert the story.
        let story_result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Sample user', 'sample_user', 'sample@example.com')
    RETURNING id
),
inserted_story AS (
    INSERT INTO stories (user_id, slug, published_at)
    VALUES ((SELECT id FROM inserted_user), 'some-story', NOW())
)
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, (SELECT id FROM inserted_user))
RETURNING followed_id
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/feed?type=friends-and-following")
            .to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should be included in the feed initially.
        assert_eq!(json.unwrap().len(), 1);

        // Block the writer of the story.
        sqlx::query(
            r#"
INSERT INTO blocks (blocker_id, blocked_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(story_result.get::<i64, _>("followed_id"))
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/feed?type=friends-and-following")
            .to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should not be included in the feed.
        assert_eq!(json.unwrap().len(), 0);

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_include_stories_from_muted_users_in_the_feed_for_friends_and_following_type(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert the story.
        let story_result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Sample user', 'sample_user', 'sample@example.com')
    RETURNING id
),
inserted_story AS (
    INSERT INTO stories (user_id, slug, published_at)
    VALUES ((SELECT id FROM inserted_user), 'some-story', NOW())
)
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, (SELECT id FROM inserted_user))
RETURNING followed_id
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/feed?type=friends-and-following")
            .to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should be included in the feed initially.
        assert_eq!(json.unwrap().len(), 1);

        // Mute the writer of the story.
        sqlx::query(
            r#"
INSERT INTO mutes (muter_id, muted_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(story_result.get::<i64, _>("followed_id"))
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/feed?type=friends-and-following")
            .to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should not be included in the feed.
        assert_eq!(json.unwrap().len(), 0);

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_include_stories_from_private_users_in_the_feed_who_are_not_in_friend_list_for_friends_and_following_type(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert the story.
        let story_result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Sample user', 'sample_user', 'sample@example.com')
    RETURNING id
),
inserted_story AS (
    INSERT INTO stories (user_id, slug, published_at)
    VALUES ((SELECT id FROM inserted_user), 'some-story', NOW())
)
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, (SELECT id FROM inserted_user))
RETURNING followed_id
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/feed?type=friends-and-following")
            .to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should be included in the feed initially.
        assert_eq!(json.unwrap().len(), 1);

        // Make the writer of the story private.
        sqlx::query(
            r#"
UPDATE users
SET is_private = TRUE
WHERE id = $1
"#,
        )
        .bind(story_result.get::<i64, _>("followed_id"))
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/feed?type=friends-and-following")
            .to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should not be included in the feed.
        assert_eq!(json.unwrap().len(), 0);

        // Add the writer of the story as friend.
        sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(user_id.unwrap())
        .bind(story_result.get::<i64, _>("followed_id"))
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/feed?type=friends-and-following")
            .to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should now include the story in the feed.
        assert_eq!(json.unwrap().len(), 1);

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_include_soft_deleted_stories_in_the_feed_for_friends_and_following_type(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert the story.
        let story_result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Sample user', 'sample_user', 'sample@example.com')
    RETURNING id
),
inserted_story AS (
    INSERT INTO stories (user_id, slug, published_at)
    VALUES ((SELECT id FROM inserted_user), 'some-story', NOW())
    RETURNING id
)
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, (SELECT id FROM inserted_user))
RETURNING (SELECT id FROM inserted_story)
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/feed?type=friends-and-following")
            .to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should be included in the feed initially.
        assert_eq!(json.unwrap().len(), 1);

        // Soft-delete the story.
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_result.get::<i64, _>("id"))
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/feed?type=friends-and-following")
            .to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should not be included in the feed.
        assert_eq!(json.unwrap().len(), 0);

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_include_unpublished_stories_in_the_feed_for_friends_and_following_type(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert the story.
        let story_result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Sample user', 'sample_user', 'sample@example.com')
    RETURNING id
),
inserted_story AS (
    INSERT INTO stories (user_id, slug, published_at)
    VALUES ((SELECT id FROM inserted_user), 'some-story', NOW())
    RETURNING id
)
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, (SELECT id FROM inserted_user))
RETURNING (SELECT id FROM inserted_story)
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/feed?type=friends-and-following")
            .to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should be included in the feed initially.
        assert_eq!(json.unwrap().len(), 1);

        // Unpublish the story.
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_result.get::<i64, _>("id"))
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/feed?type=friends-and-following")
            .to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should not be included in the feed.
        assert_eq!(json.unwrap().len(), 0);

        Ok(())
    }
}
