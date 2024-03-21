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

#[get("/v1/users/{user_id}/stories")]
#[tracing::instrument(
    name = "GET /v1/users/{user_id}/stories",
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

    if let Some(current_user_id) = current_user_id {
        if has_search_query {
            let result = sqlx::query_file_as!(
                Story,
                "queries/users/stories/logged_in_with_query.sql",
                search_query,
                user_id,
                10 as i16,
                (page * 10) as i16,
                current_user_id
            )
            .fetch_all(&data.db_pool)
            .await?;

            Ok(HttpResponse::Ok().json(result))
        } else if sort == "recent" {
            let result = sqlx::query_file_as!(
                Story,
                "queries/users/stories/logged_in_recent.sql",
                user_id,
                10 as i16,
                (page * 10) as i16,
                current_user_id
            )
            .fetch_all(&data.db_pool)
            .await?;

            Ok(HttpResponse::Ok().json(result))
        } else if sort == "old" {
            let result = sqlx::query_file_as!(
                Story,
                "queries/users/stories/logged_in_old.sql",
                user_id,
                10 as i16,
                (page * 10) as i16,
                current_user_id
            )
            .fetch_all(&data.db_pool)
            .await?;

            Ok(HttpResponse::Ok().json(result))
        } else {
            let result = sqlx::query_file_as!(
                Story,
                "queries/users/stories/logged_in_popular.sql",
                user_id,
                10 as i16,
                (page * 10) as i16,
                current_user_id
            )
            .fetch_all(&data.db_pool)
            .await?;

            Ok(HttpResponse::Ok().json(result))
        }
    } else if has_search_query {
        let result = sqlx::query_file_as!(
            Story,
            "queries/users/stories/with_query.sql",
            search_query,
            user_id,
            10 as i16,
            (page * 10) as i16,
        )
        .fetch_all(&data.db_pool)
        .await?;

        Ok(HttpResponse::Ok().json(result))
    } else if sort == "recent" {
        let result = sqlx::query_file_as!(
            Story,
            "queries/users/stories/recent.sql",
            user_id,
            10 as i16,
            (page * 10) as i16,
        )
        .fetch_all(&data.db_pool)
        .await?;

        Ok(HttpResponse::Ok().json(result))
    } else if sort == "old" {
        let result = sqlx::query_file_as!(
            Story,
            "queries/users/stories/old.sql",
            user_id,
            10 as i16,
            (page * 10) as i16,
        )
        .fetch_all(&data.db_pool)
        .await?;

        Ok(HttpResponse::Ok().json(result))
    } else {
        let result = sqlx::query_file_as!(
            Story,
            "queries/users/stories/popular.sql",
            user_id,
            10 as i16,
            (page * 10) as i16,
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

    // Logged-out

    #[sqlx::test(fixtures("story"))]
    async fn can_return_user_stories(pool: PgPool) -> sqlx::Result<()> {
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        let req = test::TestRequest::get()
            .uri(&format!("/v1/users/{}/stories", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        assert!(json.is_ok());

        let stories = json.unwrap();

        assert_eq!(stories.len(), 3);
        assert!(
            stories
                .iter()
                .all(|story| !story.is_liked && !story.is_bookmarked)
        );

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_return_user_stories_in_recent_order(pool: PgPool) -> sqlx::Result<()> {
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        let req = test::TestRequest::get()
            .uri(&format!("/v1/users/{}/stories?sort=recent", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 3);
        assert!(
            json.iter()
                .all(|story| !story.is_liked && !story.is_bookmarked)
        );
        assert!(json[0].published_at > json[1].published_at);

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_return_user_stories_in_old_order(pool: PgPool) -> sqlx::Result<()> {
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        let req = test::TestRequest::get()
            .uri(&format!("/v1/users/{}/stories?sort=old", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 3);
        assert!(
            json.iter()
                .all(|story| !story.is_liked && !story.is_bookmarked)
        );
        assert!(json[0].published_at < json[1].published_at);

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_return_user_stories_in_popular_order(pool: PgPool) -> sqlx::Result<()> {
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        let req = test::TestRequest::get()
            .uri(&format!("/v1/users/{}/stories?sort=popular", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 3);
        assert!(
            json.iter()
                .all(|story| !story.is_liked && !story.is_bookmarked)
        );
        assert_eq!(json[0].read_count, 3);

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_search_user_stories(pool: PgPool) -> sqlx::Result<()> {
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        let req = test::TestRequest::get()
            .uri(&format!("/v1/users/{}/stories?query={}", 1, encode("two")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();

        assert!(json[0].title.contains("two"));
        assert!(
            json.iter()
                .all(|story| !story.is_liked && !story.is_bookmarked)
        );
        assert_eq!(json.len(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn should_not_include_soft_deleted_stories_in_user_stories(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        // Should return all the stories initially.
        let req = test::TestRequest::get()
            .uri(&format!("/v1/users/{}/stories", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        // Soft-delete one of the stories.
        let result = sqlx::query(
            r#"
UPDATE stories
SET
    deleted_at = NOW(),
    published_at = NULL
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only two stories.
        let req = test::TestRequest::get()
            .uri(&format!("/v1/users/{}/stories", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Recover the soft-deleted story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET
    deleted_at = NULL,
    published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the stories again.
        let req = test::TestRequest::get()
            .uri(&format!("/v1/users/{}/stories", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn should_not_include_unpublished_stories_in_user_stories(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        // Should return all the stories initially.
        let req = test::TestRequest::get()
            .uri(&format!("/v1/users/{}/stories", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        // Unpublish one of the stories.
        let result = sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only two stories.
        let req = test::TestRequest::get()
            .uri(&format!("/v1/users/{}/stories", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Republish the unpublished story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the stories again.
        let req = test::TestRequest::get()
            .uri(&format!("/v1/users/{}/stories", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        Ok(())
    }

    // Logged-in

    #[sqlx::test(fixtures("story"))]
    async fn can_return_user_stories_when_logged_in(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/users/{}/stories", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_return_user_stories_in_recent_order_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/users/{}/stories?sort=recent", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 3);
        assert!(json[0].published_at > json[1].published_at);

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_return_user_stories_in_old_order_when_logged_in(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/users/{}/stories?sort=old", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 3);
        assert!(json[0].published_at < json[1].published_at);

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_return_user_stories_in_popular_order_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/users/{}/stories?sort=popular", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 3);
        assert_eq!(json[0].read_count, 3);

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_search_user_stories_when_logged_in(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/users/{}/stories?query={}", 1, encode("two")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();

        assert!(json[0].title.contains("two"));
        assert_eq!(json.len(), 1);

        Ok(())
    }

    //

    #[sqlx::test(fixtures("story"))]
    async fn can_return_is_liked_flag_for_user_stories_in_recent_order_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/users/{}/stories?sort=recent", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let stories = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        assert!(stories.iter().all(|story| !story.is_liked));

        // Like the stories.
        let result = sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2), ($1, $3), ($1, $4)
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 3);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/users/{}/stories?sort=recent", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let stories = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        assert!(stories.iter().all(|story| story.is_liked));

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_return_is_bookmarked_flag_for_user_stories_in_recent_order_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/users/{}/stories?sort=recent", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let stories = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        assert!(stories.iter().all(|story| !story.is_bookmarked));

        // Bookmark the stories.
        let result = sqlx::query(
            r#"
INSERT INTO bookmarks (user_id, story_id)
VALUES ($1, $2), ($1, $3), ($1, $4)
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 3);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/users/{}/stories?sort=recent", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let stories = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        assert!(stories.iter().all(|story| story.is_bookmarked));

        Ok(())
    }

    //

    #[sqlx::test(fixtures("story"))]
    async fn can_return_is_liked_flag_for_user_stories_in_old_order_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/users/{}/stories?sort=old", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let stories = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        assert!(stories.iter().all(|story| !story.is_liked));

        // Like the stories.
        let result = sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2), ($1, $3), ($1, $4)
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 3);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/users/{}/stories?sort=old", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let stories = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        assert!(stories.iter().all(|story| story.is_liked));

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_return_is_bookmarked_flag_for_user_stories_in_old_order_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/users/{}/stories?sort=old", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let stories = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        assert!(stories.iter().all(|story| !story.is_bookmarked));

        // Bookmark the stories.
        let result = sqlx::query(
            r#"
INSERT INTO bookmarks (user_id, story_id)
VALUES ($1, $2), ($1, $3), ($1, $4)
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 3);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/users/{}/stories?sort=old", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let stories = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        assert!(stories.iter().all(|story| story.is_bookmarked));

        Ok(())
    }

    //

    #[sqlx::test(fixtures("story"))]
    async fn can_return_is_liked_flag_for_user_stories_in_popular_order_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/users/{}/stories?sort=popular", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let stories = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        assert!(stories.iter().all(|story| !story.is_liked));

        // Like the stories.
        let result = sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2), ($1, $3), ($1, $4)
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 3);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/users/{}/stories?sort=popular", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let stories = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        assert!(stories.iter().all(|story| story.is_liked));

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_return_is_bookmarked_flag_for_user_stories_in_popular_order_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/users/{}/stories?sort=popular", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let stories = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        assert!(stories.iter().all(|story| !story.is_bookmarked));

        // Bookmark the stories.
        let result = sqlx::query(
            r#"
INSERT INTO bookmarks (user_id, story_id)
VALUES ($1, $2), ($1, $3), ($1, $4)
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 3);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/users/{}/stories?sort=popular", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let stories = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        assert!(stories.iter().all(|story| story.is_bookmarked));

        Ok(())
    }

    //

    #[sqlx::test(fixtures("story"))]
    async fn can_return_is_liked_flag_for_user_stories_when_logged_in_and_searching(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/users/{}/stories?query={}", 1, encode("two")))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let stories = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        assert!(stories.iter().all(|story| !story.is_liked));

        // Like the stories.
        let result = sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2), ($1, $3), ($1, $4)
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 3);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/users/{}/stories?query={}", 1, encode("two")))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let stories = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        assert!(stories.iter().all(|story| story.is_liked));

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_return_is_bookmarked_flag_for_user_stories_when_logged_in_and_searching(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/users/{}/stories?query={}", 1, encode("two")))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `false` initially.
        let stories = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        assert!(stories.iter().all(|story| !story.is_bookmarked));

        // Bookmark the stories.
        let result = sqlx::query(
            r#"
INSERT INTO bookmarks (user_id, story_id)
VALUES ($1, $2), ($1, $3), ($1, $4)
"#,
        )
        .bind(user_id.unwrap())
        .bind(2_i64)
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 3);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/users/{}/stories?query={}", 1, encode("two")))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let stories = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        assert!(stories.iter().all(|story| story.is_bookmarked));

        Ok(())
    }

    //

    #[sqlx::test(fixtures("story"))]
    async fn should_not_include_soft_deleted_stories_in_user_stories_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        // Should return all the stories initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/users/{}/stories", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        // Soft-delete one of the stories.
        let result = sqlx::query(
            r#"
UPDATE stories
SET
    deleted_at = NOW(),
    published_at = NULL
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only two stories.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/users/{}/stories", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Recover the soft-deleted story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET
    deleted_at = NULL,
    published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the stories again.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/users/{}/stories", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn should_not_include_unpublished_stories_in_user_stories_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        // Should return all the stories initially.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/users/{}/stories", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        // Unpublish one of the stories.
        let result = sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only two stories.
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/users/{}/stories", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Republish the unpublished story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the stories again.
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/users/{}/stories", 1))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        Ok(())
    }
}
