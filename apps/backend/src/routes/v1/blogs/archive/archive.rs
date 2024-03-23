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

#[derive(Deserialize, Validate)]
struct Fragments {
    blog_id: String,
}

#[derive(Serialize, Deserialize, Validate)]
struct QueryParams {
    #[validate(range(min = 1, max = 1000))]
    page: Option<u16>,
    #[validate(range(min = 2000, max = 5000))]
    year: Option<i16>,
    #[validate(range(min = 1, max = 12))]
    month: Option<i16>,
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
    tags: Vec<Tag>,
    // Boolean flags
    is_liked: bool,
    is_bookmarked: bool,
}

#[get("/v1/blogs/{blog_id}/archive")]
#[tracing::instrument(
    name = "GET /v1/blogs/{blog_id}/archive",
    skip_all,
    fields(
        user_id = tracing::field::Empty,
        page = query.page,
        year = query.year,
        month = query.month
    ),
    err
)]
async fn get(
    query: QsQuery<QueryParams>,
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Option<Identity>,
) -> Result<HttpResponse, AppError> {
    let user_id = user.map(|user| user.id()).transpose()?;
    let blog_id = path
        .blog_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid blog ID"))?;

    tracing::Span::current().record("user_id", user_id);

    let page = query.page.unwrap_or(1) - 1;
    let year = query.year.to_owned();
    let month = query.month.to_owned();

    // Query for logged-in users.

    if let Some(user_id) = user_id {
        let result = sqlx::query_file_as!(
            Story,
            "queries/blogs/archive/logged_in.sql",
            blog_id,
            10 as i16,
            (page * 10) as i16,
            user_id,
            year,
            month
        )
        .fetch_all(&data.db_pool)
        .await?;

        Ok(HttpResponse::Ok().json(result))
    } else {
        let result = sqlx::query_file_as!(
            Story,
            "queries/blogs/archive/default.sql",
            blog_id,
            10 as i16,
            (page * 10) as i16,
            year,
            month
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

    // Logged-out

    #[sqlx::test(fixtures("archive"))]
    async fn can_return_blog_archive(pool: PgPool) -> sqlx::Result<()> {
        let (app, _, _) = init_app_for_test(get, pool, false, false, None).await;
        let req = test::TestRequest::get()
            .uri(&format!("/v1/blogs/{}/archive", 5))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        Ok(())
    }

    #[sqlx::test(fixtures("archive"))]
    async fn can_return_blog_archive_for_a_year(pool: PgPool) -> sqlx::Result<()> {
        let (app, _, _) = init_app_for_test(get, pool, false, false, None).await;
        let req = test::TestRequest::get()
            .uri(&format!("/v1/blogs/{}/archive?year={}", 5, 2022))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        let story = &json[0];

        assert_eq!(json.len(), 1);
        assert_eq!(story.id, 6_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("archive"))]
    async fn can_return_blog_archive_for_a_month(pool: PgPool) -> sqlx::Result<()> {
        let (app, _, _) = init_app_for_test(get, pool, false, false, None).await;
        let req = test::TestRequest::get()
            .uri(&format!(
                "/v1/blogs/{}/archive?year={}&month={}",
                5, 2023, 11
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        let story = &json[0];

        assert_eq!(json.len(), 1);
        assert_eq!(story.id, 9_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("archive"))]
    async fn should_not_include_soft_deleted_stories_in_archive(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, _) = init_app_for_test(get, pool, false, false, None).await;

        let req = test::TestRequest::get()
            .uri(&format!(
                "/v1/blogs/{}/archive?year={}&month={}",
                5, 2023, 11
            ))
            .to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should be included in the response initially.
        assert_eq!(json.unwrap().len(), 1);

        // Soft-delete the story.
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(9_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .uri(&format!(
                "/v1/blogs/{}/archive?year={}&month={}",
                5, 2023, 11
            ))
            .to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should not be included in the response.
        assert_eq!(json.unwrap().len(), 0);

        Ok(())
    }

    // Logged-in

    #[sqlx::test(fixtures("archive"))]
    async fn can_return_blog_archive_when_logged_in(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/blogs/{}/archive", 5))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 3);

        Ok(())
    }

    #[sqlx::test(fixtures("archive"))]
    async fn can_return_blog_archive_for_a_year_when_logged_in(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/blogs/{}/archive?year={}", 5, 2022))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        let story = &json[0];

        assert_eq!(json.len(), 1);
        assert_eq!(story.id, 6_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("archive"))]
    async fn can_return_blog_archive_for_a_month_when_logged_in(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/blogs/{}/archive?year={}&month={}",
                5, 2023, 11
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        let story = &json[0];

        assert_eq!(json.len(), 1);
        assert_eq!(story.id, 9_i64);

        Ok(())
    }

    #[sqlx::test(fixtures("archive"))]
    async fn can_return_is_liked_flag_in_the_archive_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/blogs/{}/archive?year={}&month={}",
                5, 2023, 11
            ))
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
        .bind(9_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/blogs/{}/archive?year={}&month={}",
                5, 2023, 11
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(story.is_liked);

        Ok(())
    }

    #[sqlx::test(fixtures("archive"))]
    async fn can_return_is_bookmarked_flag_in_the_archive_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/blogs/{}/archive?year={}&month={}",
                5, 2023, 11
            ))
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
        .bind(9_i64)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/blogs/{}/archive?year={}&month={}",
                5, 2023, 11
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should be `true`.
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await).unwrap();
        let story = &json[0];
        assert!(story.is_bookmarked);

        Ok(())
    }

    #[sqlx::test(fixtures("archive"))]
    async fn should_not_include_soft_deleted_stories_in_archive_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(get, pool, true, false, None).await;

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri(&format!(
                "/v1/blogs/{}/archive?year={}&month={}",
                5, 2023, 11
            ))
            .to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should be included in the response initially.
        assert_eq!(json.unwrap().len(), 1);

        // Soft-delete the story.
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(9_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/blogs/{}/archive?year={}&month={}",
                5, 2023, 11
            ))
            .to_request();
        let res = test::call_service(&app, req).await;
        let json = serde_json::from_str::<Vec<Story>>(&res_to_string(res).await);

        // Should not be included in the response.
        assert_eq!(json.unwrap().len(), 0);

        Ok(())
    }
}
