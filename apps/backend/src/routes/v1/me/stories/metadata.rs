use crate::{
    error::{AppError, FormErrorResponse, ToastErrorResponse},
    middleware::identity::identity::Identity,
    models::story::STORY_CATEGORY_VEC,
    AppState,
};
use actix_web::{patch, web, HttpResponse};
use actix_web_validator::Json;
use lazy_static::lazy_static;
use regex::Regex;
use serde::{Deserialize, Serialize};
use sqlx::Row;
use validator::Validate;

lazy_static! {
    static ref TAG_REGEX: Regex = Regex::new(r"^[a-z0-9-]{1,32}$").unwrap();
}

#[derive(Deserialize, Validate)]
struct Fragments {
    story_id: String,
}

#[derive(Debug, Validate, Serialize, Deserialize)]
struct Tag {
    #[validate(regex = "TAG_REGEX")]
    #[validate(length(min = 1, max = 32, message = "Invalid tag name length"))]
    name: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(length(min = 1, max = 96, message = "Invalid title length"))]
    title: String,
    #[validate(length(min = 0, max = 256, message = "Invalid description length"))]
    description: Option<String>,
    #[validate(length(min = 0, max = 128, message = "Invalid splash ID length"))]
    splash_id: Option<String>,
    #[validate]
    #[validate(required)]
    #[validate(length(min = 0, max = 5, message = "Invalid story tags"))]
    tags: Option<Vec<Tag>>,
    #[validate(range(min = 1, max = 8, message = "Invalid story license"))]
    license: i32,
    #[validate(range(min = 1, max = 2, message = "Invalid story visibility"))]
    visibility: i32,
    #[validate(range(min = 1, max = 2, message = "Invalid story age restriction"))]
    age_restriction: i32,
    // Story category is validated in the request handler
    #[validate(length(min = 0, max = 128, message = "Invalid story category"))]
    category: String,
    disable_toc: bool,
    disable_comments: bool,
    disable_public_revision_history: bool,
    // SEO
    #[validate(length(min = 0, max = 54, message = "Invalid SEO title length"))]
    seo_title: Option<String>,
    #[validate(length(min = 0, max = 160, message = "Invalid SEO description length"))]
    seo_description: Option<String>,
    #[validate(url(message = "Invalid canonical URL"))]
    #[validate(length(min = 0, max = 1024, message = "Invalid canonical URL length"))]
    canonical_url: Option<String>,
    #[validate(length(min = 0, max = 128, message = "Invalid preview image source length"))]
    preview_image: Option<String>,
}

#[patch("/v1/me/stories/{story_id}/metadata")]
async fn patch(
    payload: Json<Request>,
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => {
            match path.story_id.parse::<i64>() {
                Ok(story_id) => {
                    // Validate story category
                    if !STORY_CATEGORY_VEC.contains(&payload.category) {
                        return Ok(HttpResponse::BadRequest().json(FormErrorResponse::new(vec![
                            vec!["category".to_string(), "Invalid category".to_string()],
                        ])));
                    }

                    let mut splash_hex: Option<String> = None;

                    // Check if the splash is valid
                    if payload.splash_id.is_some() {
                        match sqlx::query(
                            r#"
                            SELECT hex FROM assets
                            WHERE
                                user_id = $1
                                AND key = $2
                            "#,
                        )
                        .bind(user_id)
                        .bind(&payload.splash_id)
                        .fetch_one(&data.db_pool)
                        .await
                        {
                            Ok(asset) => {
                                splash_hex = Some(asset.get::<String, _>("hex"));
                            }
                            Err(kind) => {
                                return match kind {
                                    sqlx::Error::RowNotFound => Ok(HttpResponse::BadRequest()
                                        .json(ToastErrorResponse::new(
                                            "Invalid splash ID".to_string(),
                                        ))),
                                    _ => Ok(HttpResponse::InternalServerError().finish()),
                                }
                            }
                        };
                    }

                    // Check if the preview image is valid
                    if payload.preview_image.is_some() {
                        let result = sqlx::query(
                            r#"
                            SELECT EXISTS(
                                SELECT 1 FROM assets
                                WHERE
                                    user_id = $1
                                    AND key = $2
                            )
                            "#,
                        )
                        .bind(user_id)
                        .bind(&payload.preview_image)
                        .fetch_one(&data.db_pool)
                        .await?;

                        if !result.get::<bool, _>("exists") {
                            return Ok(HttpResponse::BadRequest().json(ToastErrorResponse::new(
                                "Invalid preview image".to_string(),
                            )));
                        }
                    }

                    // TODO: UPDATE TAGS

                    match sqlx::query(
                        r#"
                        UPDATE stories
                        SET
                            title = $3,
                            description = $4,
                            splash_id = $5,
                            splash_hex = $6,
                            license = $7,
                            visibility = $8,
                            age_restriction = $9,
                            category = $10::story_category,
                            disable_toc = $11,
                            disable_comments = $12,
                            disable_public_revision_history = $13,
                            seo_title = $14,
                            seo_description = $15,
                            canonical_url = $16,
                            preview_image = $17
                        WHERE
                            user_id = $1
                            AND id = $2
                            AND deleted_at IS NULL
                        "#,
                    )
                    .bind(user_id)
                    .bind(story_id)
                    .bind(&payload.title)
                    .bind(&payload.description)
                    .bind(&payload.splash_id)
                    .bind(splash_hex)
                    .bind(&payload.license)
                    .bind(&payload.visibility)
                    .bind(&payload.age_restriction)
                    .bind(&payload.category)
                    .bind(&payload.disable_toc)
                    .bind(&payload.disable_comments)
                    .bind(&payload.disable_public_revision_history)
                    .bind(&payload.seo_title)
                    .bind(&payload.seo_description)
                    .bind(&payload.canonical_url)
                    .bind(&payload.preview_image)
                    .execute(&data.db_pool)
                    .await?
                    .rows_affected()
                    {
                        0 => Ok(HttpResponse::BadRequest()
                            .json(ToastErrorResponse::new("Story not found".to_string()))),
                        _ => Ok(HttpResponse::NoContent().finish()),
                    }
                }
                Err(_) => Ok(HttpResponse::BadRequest().body("Invalid story ID")),
            }
        }
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(patch);
}

// #[cfg(test)]
// mod tests {
//     use super::*;
//     use crate::test_utils::{assert_response_body_text, init_app_for_test};
//     use actix_web::test;
//     use sqlx::{PgPool, Row};
//
//     #[sqlx::test(fixtures("user"))]
//     async fn can_block_a_user(pool: PgPool) -> sqlx::Result<()> {
//         let mut conn = pool.acquire().await?;
//         let (app, cookie, user_id) = init_app_for_test(post, pool, true, false).await;
//
//         let req = test::TestRequest::post()
//             .cookie(cookie.unwrap())
//             .uri(&format!("/v1/me/blocked-users/{}", 2))
//             .to_request();
//         let res = test::call_service(&app, req).await;
//
//         assert!(res.status().is_success());
//
//         // Block should be present in the database
//         let result = sqlx::query(
//             r#"
//             SELECT EXISTS(
//                 SELECT 1 FROM blocks
//                 WHERE blocker_id = $1 AND blocked_id = $2
//             )
//             "#,
//         )
//         .bind(user_id)
//         .bind(2_i64)
//         .fetch_one(&mut *conn)
//         .await?;
//
//         assert!(result.get::<bool, _>("exists"));
//
//         Ok(())
//     }
//
//     #[sqlx::test(fixtures("user"))]
//     async fn should_not_throw_when_blocking_an_already_blocked_user(
//         pool: PgPool,
//     ) -> sqlx::Result<()> {
//         let (app, cookie, _) = init_app_for_test(post, pool, true, false).await;
//
//         // Block the user for the first time
//         let req = test::TestRequest::post()
//             .cookie(cookie.clone().unwrap())
//             .uri(&format!("/v1/me/blocked-users/{}", 2))
//             .to_request();
//         let res = test::call_service(&app, req).await;
//
//         assert!(res.status().is_success());
//
//         // Try blocking the user again
//         let req = test::TestRequest::post()
//             .cookie(cookie.unwrap())
//             .uri(&format!("/v1/me/blocked-users/{}", 2))
//             .to_request();
//         let res = test::call_service(&app, req).await;
//
//         // Should not throw
//         assert!(res.status().is_success());
//
//         Ok(())
//     }
//
//     #[sqlx::test(fixtures("user"))]
//     async fn should_not_block_a_soft_deleted_user(pool: PgPool) -> sqlx::Result<()> {
//         let mut conn = pool.acquire().await?;
//         let (app, cookie, _) = init_app_for_test(post, pool, true, false).await;
//
//         // Soft-delete the target user
//         let result = sqlx::query(
//             r#"
//             UPDATE users
//             SET deleted_at = now()
//             WHERE id = $1
//             "#,
//         )
//         .bind(2_i64)
//         .execute(&mut *conn)
//         .await?;
//
//         assert_eq!(result.rows_affected(), 1);
//
//         // Try blocking the user
//         let req = test::TestRequest::post()
//             .cookie(cookie.clone().unwrap())
//             .uri(&format!("/v1/me/blocked-users/{}", 2))
//             .to_request();
//         let res = test::call_service(&app, req).await;
//
//         assert!(res.status().is_client_error());
//         assert_response_body_text(res, "User being blocked is either deleted or deactivated").await;
//
//         Ok(())
//     }
//
//     #[sqlx::test(fixtures("user"))]
//     async fn should_not_block_a_deactivated_user(pool: PgPool) -> sqlx::Result<()> {
//         let mut conn = pool.acquire().await?;
//         let (app, cookie, _) = init_app_for_test(post, pool, true, false).await;
//
//         // Deactivate the target user
//         let result = sqlx::query(
//             r#"
//             UPDATE users
//             SET deactivated_at = now()
//             WHERE id = $1
//             "#,
//         )
//         .bind(2_i64)
//         .execute(&mut *conn)
//         .await?;
//
//         assert_eq!(result.rows_affected(), 1);
//
//         // Try blocking the user
//         let req = test::TestRequest::post()
//             .cookie(cookie.clone().unwrap())
//             .uri(&format!("/v1/me/blocked-users/{}", 2))
//             .to_request();
//         let res = test::call_service(&app, req).await;
//
//         assert!(res.status().is_client_error());
//         assert_response_body_text(res, "User being blocked is either deleted or deactivated").await;
//
//         Ok(())
//     }
// }
