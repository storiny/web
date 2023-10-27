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
    static ref SORT_REGEX: Regex =
        Regex::new(r"^(recent|old|replies-(a|d)sc|likes-(a|d)sc)$").unwrap();
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

#[derive(sqlx::Type, Debug, Serialize, Deserialize)]
struct User {
    id: i64,
    username: String,
}

#[derive(sqlx::Type, Debug, Serialize, Deserialize)]
struct Story {
    id: i64,
    slug: String,
    title: String,
    splash_id: Option<String>,
    splash_hex: Option<String>,
    user_id: i64,
    // Joins
    user: Json<User>,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct Comment {
    id: i64,
    hidden: bool,
    content: Option<String>,
    rendered_content: String,
    user_id: i64,
    story_id: i64,
    // Stats
    like_count: i32,
    reply_count: i32,
    // Timestamps
    #[serde(with = "crate::iso8601::time")]
    created_at: OffsetDateTime,
    #[serde(with = "crate::iso8601::time::option")]
    edited_at: Option<OffsetDateTime>,
    // Joins
    story: Json<Story>,
    // Boolean flags
    is_liked: bool,
}

#[get("/v1/me/comments")]
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
            let result = sqlx::query_file_as!(
                Comment,
                "queries/me/comments/default_desc.sql",
                user_id,
                10 as i16,
                (page * 10) as i16
            )
            .fetch_all(&data.db_pool)
            .await?;

            Ok(HttpResponse::Ok()
                .content_type(ContentType::json())
                .json(result))

            // if has_search_query {
            //     let result = sqlx::query_file_as!(
            //         Bookmark,
            //         "queries/me/bookmarks/with_query.sql",
            //         search_query,
            //         user_id,
            //         10 as i16,
            //         (page * 10) as i16
            //     )
            //     .fetch_all(&data.db_pool)
            //     .await?;
            //
            //     Ok(HttpResponse::Ok()
            //         .content_type(ContentType::json())
            //         .json(result))
            // } else if sort == "old" {
            //     let result = sqlx::query_file_as!(
            //         Bookmark,
            //         "queries/me/bookmarks/default_asc.sql",
            //         user_id,
            //         10 as i16,
            //         (page * 10) as i16
            //     )
            //     .fetch_all(&data.db_pool)
            //     .await?;
            //
            //     Ok(HttpResponse::Ok()
            //         .content_type(ContentType::json())
            //         .json(result))
            // } else {
            //     let result = sqlx::query_file_as!(
            //         Bookmark,
            //         "queries/me/bookmarks/default_desc.sql",
            //         user_id,
            //         10 as i16,
            //         (page * 10) as i16
            //     )
            //     .fetch_all(&data.db_pool)
            //     .await?;
            //
            //     Ok(HttpResponse::Ok()
            //         .content_type(ContentType::json())
            //         .json(result))
            // }
        }
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::test_utils::init_app_for_test;
    use actix_http::body::to_bytes;
    use actix_web::test;
    use sqlx::PgPool;
    use std::str;

    #[sqlx::test(fixtures("comment"))]
    async fn can_return_comments(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false).await;

        // Insert some comments
        let insert_result = sqlx::query(
            r#"
            INSERT INTO comments(content, user_id, story_id)
            VALUES ($1, $2, $3), ($1, $2, $3)
            "#,
        )
        .bind("Sample comment")
        .bind(user_id.unwrap())
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/comments")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Comment>>(
            str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        );

        assert!(json.is_ok());
        assert_eq!(json.unwrap().len(), 2);

        Ok(())
    }
}
