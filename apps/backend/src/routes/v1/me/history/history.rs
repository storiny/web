use crate::{error::AppError, middleware::identity::identity::Identity, AppState};
use actix_web::{get, http::header::ContentType, web, HttpResponse};
use actix_web_validator::QsQuery;
use lazy_static::lazy_static;
use regex::Regex;
use serde::{Deserialize, Serialize};
use sqlx::{types::Json, FromRow};
use time::OffsetDateTime;
use validator::Validate;

#[derive(Serialize, Deserialize, Validate)]
struct QueryParams {
    #[validate(range(min = 1, max = 1000))]
    page: Option<u16>,
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
struct Story {
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

#[get("/v1/me/history")]
async fn get(
    query: QsQuery<QueryParams>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let page = query.page.clone().unwrap_or_default();
    let search_query = query.query.clone().unwrap_or_default();
    let has_search_query = !search_query.trim().is_empty();

    match user.unwrap().id() {
        Ok(user_id) => {
            if has_search_query {
                let result = sqlx::query_file_as!(
                    Story,
                    "queries/history/with_query.sql",
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
            } else {
                let result = sqlx::query_file_as!(
                    Story,
                    "queries/history/default.sql",
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
    use sqlx::{PgPool, Row};
    use std::str;

    #[sqlx::test(fixtures("feed"))]
    async fn can_generate_feed_for_logged_out_user(pool: PgPool) -> sqlx::Result<()> {
        let (app, _, _) = init_app_for_test(get, pool, false, false).await;
        let req = test::TestRequest::get().uri("/v1/feed").to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Story>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        );

        assert!(json.is_ok());
        assert!(json.unwrap().len() > 0);

        Ok(())
    }
}
