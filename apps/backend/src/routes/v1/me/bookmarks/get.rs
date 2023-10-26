use crate::{error::AppError, middleware::identity::identity::Identity, AppState};
use actix_web::{get, http::header::ContentType, web, HttpResponse};
use actix_web_validator::QsQuery;
use lazy_static::lazy_static;
use regex::Regex;
use serde::{Deserialize, Serialize};
use sqlx::{types::Json, FromRow};
use time::OffsetDateTime;
use validator::Validate;

lazy_static! {
    static ref SORT_REGEX: Regex = Regex::new(r"^(recent|old)$").unwrap();
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
    id: i64,
    name: String,
    username: String,
    avatar_id: Option<String>,
    avatar_hex: Option<String>,
    public_flags: i32,
}

#[derive(sqlx::Type, Debug, Serialize, Deserialize)]
struct Tag {
    id: i64,
    name: String,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct Bookmark {
    id: i64,
    title: String,
    slug: String,
    description: Option<String>,
    splash_id: Option<String>,
    splash_hex: Option<String>,
    category: String,
    age_restriction: i16,
    license: i16,
    user_id: i64,
    // Stats
    word_count: i32,
    read_count: i64,
    like_count: i64,
    comment_count: i32,
    // Timestamps
    #[serde(with = "crate::iso8601::time")]
    published_at: OffsetDateTime,
    #[serde(with = "crate::iso8601::time::option")]
    edited_at: Option<OffsetDateTime>,
    // Joins
    user: Json<User>,
    tags: Vec<Tag>,
    // Boolean flags
    is_liked: bool,
    is_bookmarked: bool,
}

#[get("/v1/me/bookmarks")]
async fn get(
    query: QsQuery<QueryParams>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let page = query.page.clone().unwrap_or_default();
    let sort = query.sort.clone().unwrap_or("recent".to_string());
    let search_query = query.query.clone().unwrap_or_default();
    let has_search_query = !search_query.trim().is_empty();

    match user.id() {
        Ok(user_id) => {
            if has_search_query {
                let result = sqlx::query_file_as!(
                    Bookmark,
                    "queries/bookmarks/with_query.sql",
                    search_query,
                    user_id,
                    10 as i16,
                    (page * 10) as i16
                )
                .fetch_all(&data.db_pool)
                .await?;

                Ok(HttpResponse::Ok()
                    .content_type(ContentType::json())
                    .json(result))
            } else if sort == "old" {
                let result = sqlx::query_file_as!(
                    Bookmark,
                    "queries/bookmarks/default_asc.sql",
                    user_id,
                    10 as i16,
                    (page * 10) as i16
                )
                .fetch_all(&data.db_pool)
                .await?;

                Ok(HttpResponse::Ok()
                    .content_type(ContentType::json())
                    .json(result))
            } else {
                let result = sqlx::query_file_as!(
                    Bookmark,
                    "queries/bookmarks/default_desc.sql",
                    user_id,
                    10 as i16,
                    (page * 10) as i16
                )
                .fetch_all(&data.db_pool)
                .await?;

                Ok(HttpResponse::Ok()
                    .content_type(ContentType::json())
                    .json(result))
            }
        }
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
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
        let avatar_id = decoder.try_decode::<Option<String>>()?;
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
    use crate::test_utils::test_utils::init_app_for_test;
    use actix_http::body::to_bytes;
    use actix_web::test;
    use sqlx::PgPool;
    use std::str;
    use urlencoding::encode;

    #[sqlx::test(fixtures("bookmark"))]
    async fn can_return_bookmarks(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false).await;

        // Insert some bookmarks
        let insert_result = sqlx::query(
            r#"
            INSERT INTO bookmarks(user_id, story_id)
            VALUES ($1, $2), ($1, $3)
            "#,
        )
        .bind(user_id.unwrap())
        .bind(3i64)
        .bind(4i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/bookmarks")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        );

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("bookmark"))]
    async fn can_return_bookmarks_in_desc_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false).await;

        // Insert some bookmarks
        sqlx::query(
            r#"
            INSERT INTO bookmarks(user_id, story_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(user_id.unwrap())
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
            INSERT INTO bookmarks(user_id, story_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(user_id.unwrap())
        .bind(4i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/bookmarks?sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        )
        .unwrap();

        assert_eq!(json[0].id, 4i64);
        assert_eq!(json[1].id, 3i64);

        Ok(())
    }

    #[sqlx::test(fixtures("bookmark"))]
    async fn can_return_bookmarks_in_asc_order(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false).await;

        // Insert some bookmarks
        sqlx::query(
            r#"
            INSERT INTO bookmarks(user_id, story_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(user_id.unwrap())
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
            INSERT INTO bookmarks(user_id, story_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(user_id.unwrap())
        .bind(4i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/bookmarks?sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        )
        .unwrap();

        assert_eq!(json[0].id, 3i64);
        assert_eq!(json[1].id, 4i64);

        Ok(())
    }

    #[sqlx::test(fixtures("bookmark"))]
    async fn can_search_bookmarks(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false).await;

        // Insert some bookmarks
        let insert_result = sqlx::query(
            r#"
            INSERT INTO bookmarks(user_id, story_id)
            VALUES ($1, $2), ($1, $3)
            "#,
        )
        .bind(user_id.unwrap())
        .bind(3i64)
        .bind(4i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/bookmarks?query={}", encode("ancient")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        )
        .unwrap();

        assert!(json[0].title.contains("ancient"));
        assert_eq!(json.len(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("bookmark"))]
    async fn should_not_include_soft_deleted_stories_in_bookmarks(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false).await;

        // Insert some bookmarks
        let insert_result = sqlx::query(
            r#"
            INSERT INTO bookmarks(user_id, story_id)
            VALUES ($1, $2), ($1, $3)
            "#,
        )
        .bind(user_id.unwrap())
        .bind(3i64)
        .bind(4i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the stories initially
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/bookmarks")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        );

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Soft-delete one of the stories
        let result = sqlx::query(
            r#"
            UPDATE stories
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one story
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/bookmarks")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        );

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Recover the soft-deleted story
        let result = sqlx::query(
            r#"
            UPDATE stories
            SET deleted_at = NULL
            WHERE id = $1
            "#,
        )
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the stories again
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/bookmarks")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        );

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("bookmark"))]
    async fn should_not_include_unpublished_stories_in_bookmarks(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false).await;

        // Insert some bookmarks
        let insert_result = sqlx::query(
            r#"
            INSERT INTO bookmarks(user_id, story_id)
            VALUES ($1, $2), ($1, $3)
            "#,
        )
        .bind(user_id.unwrap())
        .bind(3i64)
        .bind(4i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the stories initially
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/bookmarks")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        );

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Unpublish one of the stories
        let result = sqlx::query(
            r#"
            UPDATE stories
            SET published_at = NULL
            WHERE id = $1
            "#,
        )
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one story
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/bookmarks")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        );

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Republish the unpublished story
        let result = sqlx::query(
            r#"
            UPDATE stories
            SET published_at = now()
            WHERE id = $1
            "#,
        )
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the stories again
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/bookmarks")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        );

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("bookmark"))]
    async fn should_not_include_soft_deleted_stories_in_bookmarks_in_asc_order(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false).await;

        // Insert some bookmarks
        let insert_result = sqlx::query(
            r#"
            INSERT INTO bookmarks(user_id, story_id)
            VALUES ($1, $2), ($1, $3)
            "#,
        )
        .bind(user_id.unwrap())
        .bind(3i64)
        .bind(4i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the stories initially
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/bookmarks?sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        );

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Soft-delete one of the stories
        let result = sqlx::query(
            r#"
            UPDATE stories
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one story
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/bookmarks?sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        );

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Recover the soft-deleted story
        let result = sqlx::query(
            r#"
            UPDATE stories
            SET deleted_at = NULL
            WHERE id = $1
            "#,
        )
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the stories again
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/bookmarks?sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        );

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("bookmark"))]
    async fn should_not_include_unpublished_stories_in_bookmarks_in_asc_order(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false).await;

        // Insert some bookmarks
        let insert_result = sqlx::query(
            r#"
            INSERT INTO bookmarks(user_id, story_id)
            VALUES ($1, $2), ($1, $3)
            "#,
        )
        .bind(user_id.unwrap())
        .bind(3i64)
        .bind(4i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the stories initially
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/bookmarks?sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        );

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Unpublish one of the stories
        let result = sqlx::query(
            r#"
            UPDATE stories
            SET published_at = NULL
            WHERE id = $1
            "#,
        )
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one story
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/bookmarks?sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        );

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Republish the unpublished story
        let result = sqlx::query(
            r#"
            UPDATE stories
            SET published_at = now()
            WHERE id = $1
            "#,
        )
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the stories again
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/bookmarks?sort=old")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        );

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("bookmark"))]
    async fn should_not_include_soft_deleted_stories_in_bookmarks_in_desc_order(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false).await;

        // Insert some bookmarks
        let insert_result = sqlx::query(
            r#"
            INSERT INTO bookmarks(user_id, story_id)
            VALUES ($1, $2), ($1, $3)
            "#,
        )
        .bind(user_id.unwrap())
        .bind(3i64)
        .bind(4i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the stories initially
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/bookmarks?sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        );

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Soft-delete one of the stories
        let result = sqlx::query(
            r#"
            UPDATE stories
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one story
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/bookmarks?sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        );

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Recover the soft-deleted story
        let result = sqlx::query(
            r#"
            UPDATE stories
            SET deleted_at = NULL
            WHERE id = $1
            "#,
        )
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the stories again
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/bookmarks?sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        );

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("bookmark"))]
    async fn should_not_include_unpublished_stories_in_bookmarks_in_desc_order(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false).await;

        // Insert some bookmarks
        let insert_result = sqlx::query(
            r#"
            INSERT INTO bookmarks(user_id, story_id)
            VALUES ($1, $2), ($1, $3)
            "#,
        )
        .bind(user_id.unwrap())
        .bind(3i64)
        .bind(4i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the stories initially
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/bookmarks?sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        );

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        // Unpublish one of the stories
        let result = sqlx::query(
            r#"
            UPDATE stories
            SET published_at = NULL
            WHERE id = $1
            "#,
        )
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one story
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/bookmarks?sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        );

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Republish the unpublished story
        let result = sqlx::query(
            r#"
            UPDATE stories
            SET published_at = now()
            WHERE id = $1
            "#,
        )
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the stories again
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/bookmarks?sort=recent")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        );

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("bookmark"))]
    async fn should_not_include_soft_deleted_stories_in_bookmarks_when_searching(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false).await;

        // Insert some bookmarks
        let insert_result = sqlx::query(
            r#"
            INSERT INTO bookmarks(user_id, story_id)
            VALUES ($1, $2), ($1, $3)
            "#,
        )
        .bind(user_id.unwrap())
        .bind(3i64)
        .bind(4i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the stories initially
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/bookmarks?query={}", encode("ancient")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        );

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Soft-delete one of the stories
        let result = sqlx::query(
            r#"
            UPDATE stories
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one story
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/bookmarks?query={}", encode("ancient")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        );

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 0);

        // Recover the soft-deleted story
        let result = sqlx::query(
            r#"
            UPDATE stories
            SET deleted_at = NULL
            WHERE id = $1
            "#,
        )
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the stories again
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/bookmarks?query={}", encode("ancient")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        );

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("bookmark"))]
    async fn should_not_include_unpublished_stories_in_bookmarks_when_searching(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false).await;

        // Insert some bookmarks
        let insert_result = sqlx::query(
            r#"
            INSERT INTO bookmarks(user_id, story_id)
            VALUES ($1, $2), ($1, $3)
            "#,
        )
        .bind(user_id.unwrap())
        .bind(3i64)
        .bind(4i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Should return all the stories initially
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/bookmarks?query={}", encode("ancient")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        );

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        // Unpublish one of the stories
        let result = sqlx::query(
            r#"
            UPDATE stories
            SET published_at = NULL
            WHERE id = $1
            "#,
        )
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one story
        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/bookmarks?query={}", encode("ancient")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        );

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 0);

        // Republish the unpublished story
        let result = sqlx::query(
            r#"
            UPDATE stories
            SET published_at = now()
            WHERE id = $1
            "#,
        )
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the stories again
        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/bookmarks?query={}", encode("ancient")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Bookmark>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        );

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 1);

        Ok(())
    }
}
