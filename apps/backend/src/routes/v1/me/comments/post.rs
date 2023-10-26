use crate::utils::md_to_html::{md_to_html, MarkdownSource};
use crate::{
    constants::sql_states::SqlState, error::AppError, middleware::identity::identity::Identity,
    AppState,
};
use actix_web::{post, web, HttpResponse};
use actix_web_validator::Json;
use pulldown_cmark::{html, Options, Parser};
use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(length(min = 1, max = 2048, message = "Invalid content length"))]
    content: String,
    story_id: String,
}

#[post("/v1/me/comments")]
async fn post(
    payload: Json<Request>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => {
            match payload.story_id.parse::<i64>() {
                Ok(story_id) => {
                    let content = payload.content.trim();
                    let rendered_content = if content.is_empty() {
                        "".to_string()
                    } else {
                        md_to_html(MarkdownSource::Response(content))
                    };

                    match sqlx::query(
                        r#"
                        INSERT INTO comments(content, rendered_content, user_id, story_id)
                        VALUES ($1, $2, $3, $4)
                        "#,
                    )
                    .bind(content)
                    .bind(rendered_content)
                    .bind(user_id)
                    .bind(story_id)
                    .execute(&data.db_pool)
                    .await
                    {
                        Ok(_) => Ok(HttpResponse::Created().finish()),
                        Err(err) => {
                            if let Some(db_err) = err.into_database_error() {
                                match db_err.kind() {
                                    // Do not throw if already bookmarked
                                    sqlx::error::ErrorKind::UniqueViolation => {
                                        Ok(HttpResponse::NoContent().finish())
                                    }
                                    _ => {
                                        // Check if the story is soft-deleted or unpublished
                                        if db_err.code().unwrap_or_default()
                                            == SqlState::EntityUnavailable.to_string()
                                        {
                                            Ok(HttpResponse::BadRequest().body("Story being bookmarked is either deleted or unpublished"))
                                        } else {
                                            Ok(HttpResponse::InternalServerError().finish())
                                        }
                                    }
                                }
                            } else {
                                Ok(HttpResponse::InternalServerError().finish())
                            }
                        }
                    }
                }
                Err(_) => Ok(HttpResponse::BadRequest().body("Invalid story ID")),
            }
        }
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::test_utils::init_app_for_test;
    use actix_http::body::to_bytes;
    use actix_web::test;
    use sqlx::{PgPool, Row};
    //
    // #[sqlx::test(fixtures("bookmark"))]
    // async fn can_bookmark_a_story(pool: PgPool) -> sqlx::Result<()> {
    //     let mut conn = pool.acquire().await?;
    //     let (app, cookie, user_id) = init_app_for_test(post, pool, true, false).await;
    //
    //     let req = test::TestRequest::post()
    //         .cookie(cookie.unwrap())
    //         .uri(&format!("/v1/me/bookmarks/{}", 3))
    //         .to_request();
    //     let res = test::call_service(&app, req).await;
    //
    //     assert!(res.status().is_success());
    //
    //     // Bookmark should be present in the database
    //     let result = sqlx::query(
    //         r#"
    //         SELECT EXISTS(
    //             SELECT 1 FROM bookmarks
    //             WHERE user_id = $1 AND story_id = $2
    //         )
    //         "#,
    //     )
    //     .bind(user_id)
    //     .bind(3i64)
    //     .fetch_one(&mut *conn)
    //     .await?;
    //
    //     assert!(result.get::<bool, _>("exists"));
    //
    //     Ok(())
    // }
}
