use crate::constants::sql_states::SqlState;
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

#[derive(Debug, Default, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(length(min = 1, max = 96, message = "Invalid title length"))]
    title: String,
    #[validate(length(min = 0, max = 256, message = "Invalid description length"))]
    description: Option<String>,
    #[validate(length(min = 0, max = 128, message = "Invalid splash ID length"))]
    splash_id: Option<String>,
    #[validate(length(min = 0, max = 5, message = "Invalid story tags"))]
    tags: Vec<String>,
    #[validate(range(min = 1, max = 8, message = "Invalid story license"))]
    license: i16,
    #[validate(range(min = 1, max = 2, message = "Invalid story visibility"))]
    visibility: i16,
    #[validate(range(min = 1, max = 2, message = "Invalid story age restriction"))]
    age_restriction: i16,
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

                    // Validate tags
                    if payload.tags.iter().any(|tag| !TAG_REGEX.is_match(tag)) {
                        return Ok(HttpResponse::BadRequest().json(FormErrorResponse::new(vec![
                            vec!["tags".to_string(), "Invalid tags".to_string()],
                        ])));
                    }

                    let mut splash_hex: Option<String> = None;
                    let pg_pool = &data.db_pool;
                    let mut txn = pg_pool.begin().await?;

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
                        .fetch_one(&mut *txn)
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
                        .fetch_one(&mut *txn)
                        .await?;

                        if !result.get::<bool, _>("exists") {
                            return Ok(HttpResponse::BadRequest().json(ToastErrorResponse::new(
                                "Invalid preview image".to_string(),
                            )));
                        }
                    }

                    match sqlx::query(
                        r#"
                        WITH
                            updated_tags AS (
                                SELECT update_draft_or_story_tags($2, $1, $18)
                            )
                        UPDATE stories
                        SET
                            title                           = $3,
                            description                     = $4,
                            splash_id                       = $5,
                            splash_hex                      = $6,
                            license                         = $7,
                            visibility                      = $8,
                            age_restriction                 = $9,
                            category                        = $10::story_category,
                            disable_toc                     = $11,
                            disable_comments                = $12,
                            disable_public_revision_history = $13,
                            seo_title                       = $14,
                            seo_description                 = $15,
                            canonical_url                   = $16,
                            preview_image                   = $17
                        WHERE
                              user_id = $1
                          AND id = $2
                          AND deleted_at IS NULL
                          AND EXISTS (SELECT 1 FROM updated_tags)
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
                    .bind(&payload.tags)
                    .execute(&mut *txn)
                    .await
                    {
                        Ok(result) => match result.rows_affected() {
                            0 => Ok(HttpResponse::BadRequest()
                                .json(ToastErrorResponse::new("Story not found".to_string()))),
                            _ => {
                                txn.commit().await?;
                                Ok(HttpResponse::NoContent().finish())
                            }
                        },
                        Err(err) => {
                            if let Some(db_err) = err.into_database_error() {
                                // Check for error returned from `update_draft_or_story_tags` function.
                                if db_err.code().unwrap_or_default()
                                    == SqlState::EntityUnavailable.to_string()
                                {
                                    Ok(HttpResponse::BadRequest().json(ToastErrorResponse::new(
                                        "Story not found".to_string(),
                                    )))
                                } else {
                                    Ok(HttpResponse::InternalServerError().finish())
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
    cfg.service(patch);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        models::story::StoryCategory,
        story_def::v1::{StoryAgeRestriction, StoryLicense, StoryVisibility},
        test_utils::{assert_form_error_response, assert_toast_error_response, init_app_for_test},
    };
    use actix_web::test;
    use sqlx::{FromRow, PgPool, Row};

    /// Metadata without `tags` and with `splash_hex`.
    #[derive(Debug, FromRow)]
    struct Metadata {
        title: String,
        description: Option<String>,
        splash_id: Option<String>,
        splash_hex: Option<String>,
        license: i16,
        visibility: i16,
        age_restriction: i16,
        // Story category is validated in the request handler
        category: String,
        disable_toc: bool,
        disable_comments: bool,
        disable_public_revision_history: bool,
        // SEO
        seo_title: Option<String>,
        seo_description: Option<String>,
        canonical_url: Option<String>,
        preview_image: Option<String>,
    }

    #[sqlx::test(fixtures("story", "asset"))]
    async fn can_update_story_metadata(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(patch, pool, true, true).await;

        // Assert initial metadata
        let result = sqlx::query_as::<_, Metadata>(
            r#"
            SELECT
                title,
                description,
                splash_id,
                splash_hex,
                license,
                visibility,
                age_restriction,
                category::text,
                disable_toc,
                disable_comments,
                disable_public_revision_history,
                seo_title,
                seo_description,
                canonical_url,
                preview_image
            FROM stories
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.title, "Untitled story".to_string());
        assert!(result.description.is_none());
        assert!(result.splash_id.is_none());
        assert!(result.splash_hex.is_none());

        assert_eq!(result.license, StoryLicense::Reserved as i16);
        assert_eq!(result.visibility, StoryVisibility::Public as i16);
        assert_eq!(result.age_restriction, StoryAgeRestriction::NotRated as i16);
        assert_eq!(result.category, StoryCategory::Others.to_string());

        assert_eq!(result.disable_toc, false);
        assert_eq!(result.disable_comments, false);
        assert_eq!(result.disable_public_revision_history, false);

        assert!(result.seo_title.is_none());
        assert!(result.seo_description.is_none());
        assert!(result.canonical_url.is_none());
        assert!(result.preview_image.is_none());

        // Update the metadata
        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/metadata", 2))
            .set_json(Request {
                title: "New title".to_string(),
                description: Some("New description".to_string()),
                splash_id: Some("sample_key".to_string()),
                tags: vec![],
                license: StoryLicense::CcZero as i16,
                visibility: StoryVisibility::Unlisted as i16,
                age_restriction: StoryAgeRestriction::Rated as i16,
                category: StoryCategory::DIY.to_string(),
                disable_toc: true,
                disable_comments: true,
                disable_public_revision_history: true,
                seo_title: Some("New SEO title".to_string()),
                seo_description: Some("New SEO description".to_string()),
                canonical_url: Some("https://storiny.com".to_string()),
                preview_image: Some("sample_key".to_string()),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Story should get updated in the database
        let result = sqlx::query_as::<_, Metadata>(
            r#"
            SELECT
                title,
                description,
                splash_id,
                splash_hex,
                license,
                visibility,
                age_restriction,
                category::text,
                disable_toc,
                disable_comments,
                disable_public_revision_history,
                seo_title,
                seo_description,
                canonical_url,
                preview_image
            FROM stories
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.title, "New title".to_string());
        assert_eq!(result.description.unwrap(), "New description".to_string());
        assert_eq!(result.splash_id.unwrap(), "sample_key".to_string());
        assert_eq!(result.splash_hex.unwrap(), "000000".to_string());

        assert_eq!(result.license, StoryLicense::CcZero as i16);
        assert_eq!(result.visibility, StoryVisibility::Unlisted as i16);
        assert_eq!(result.age_restriction, StoryAgeRestriction::Rated as i16);
        assert_eq!(result.category, StoryCategory::DIY.to_string());

        assert_eq!(result.disable_toc, true);
        assert_eq!(result.disable_comments, true);
        assert_eq!(result.disable_public_revision_history, true);

        assert_eq!(result.seo_title.unwrap(), "New SEO title".to_string());
        assert_eq!(
            result.seo_description.unwrap(),
            "New SEO description".to_string()
        );
        assert_eq!(
            result.canonical_url.unwrap(),
            "https://storiny.com".to_string()
        );
        assert_eq!(result.preview_image.unwrap(), "sample_key".to_string());

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_update_story_tags(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(patch, pool, true, true).await;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/metadata", 2))
            .set_json(Request {
                title: "Untitled story".to_string(),
                license: StoryLicense::Reserved as i16,
                visibility: StoryVisibility::Public as i16,
                age_restriction: StoryAgeRestriction::NotRated as i16,
                category: StoryCategory::Others.to_string(),
                tags: vec![
                    "tag-1".to_string(),
                    "tag-2".to_string(),
                    "tag-3".to_string(),
                ],
                ..Default::default()
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Tags should get inserted in the database
        let result = sqlx::query(
            r#"
            SELECT name FROM draft_tags
            WHERE story_id = $1
            ORDER BY name
            "#,
        )
        .bind(2_i64)
        .fetch_all(&mut *conn)
        .await?;

        assert_eq!(result.len(), 3);
        assert_eq!(result[0].get::<String, _>("name"), "tag-1".to_string());
        assert_eq!(result[1].get::<String, _>("name"), "tag-2".to_string());
        assert_eq!(result[2].get::<String, _>("name"), "tag-3".to_string());

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_invalid_story_category(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(patch, pool, true, true).await;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/metadata", 2))
            .set_json(Request {
                title: "Untitled story".to_string(),
                license: StoryLicense::Reserved as i16,
                visibility: StoryVisibility::Public as i16,
                age_restriction: StoryAgeRestriction::NotRated as i16,
                category: "invalid".to_string(),
                ..Default::default()
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(
            res,
            vec![vec!["category".to_string(), "Invalid category".to_string()]],
        )
        .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_invalid_story_tags(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(patch, pool, true, true).await;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/metadata", 2))
            .set_json(Request {
                title: "Untitled story".to_string(),
                license: StoryLicense::Reserved as i16,
                visibility: StoryVisibility::Public as i16,
                age_restriction: StoryAgeRestriction::NotRated as i16,
                category: StoryCategory::Others.to_string(),
                tags: vec!["SOME INVALID TAG".to_string()],
                ..Default::default()
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(
            res,
            vec![vec!["tags".to_string(), "Invalid tags".to_string()]],
        )
        .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_invalid_story_splash(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(patch, pool, true, true).await;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/metadata", 2))
            .set_json(Request {
                splash_id: Some("invalid_key".to_string()),
                title: "Untitled story".to_string(),
                license: StoryLicense::Reserved as i16,
                visibility: StoryVisibility::Public as i16,
                age_restriction: StoryAgeRestriction::NotRated as i16,
                category: StoryCategory::Others.to_string(),
                ..Default::default()
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Invalid splash ID").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_invalid_preview_image(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(patch, pool, true, true).await;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/metadata", 2))
            .set_json(Request {
                preview_image: Some("invalid_key".to_string()),
                title: "Untitled story".to_string(),
                license: StoryLicense::Reserved as i16,
                visibility: StoryVisibility::Public as i16,
                age_restriction: StoryAgeRestriction::NotRated as i16,
                category: StoryCategory::Others.to_string(),
                ..Default::default()
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Invalid preview image").await;

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn should_not_update_metadata_for_soft_deleted_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(patch, pool, true, true).await;

        // Soft-delete the story
        let result = sqlx::query(
            r#"
            UPDATE stories
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/metadata", 2))
            .set_json(Request {
                title: "Untitled story".to_string(),
                license: StoryLicense::Reserved as i16,
                visibility: StoryVisibility::Public as i16,
                age_restriction: StoryAgeRestriction::NotRated as i16,
                category: StoryCategory::Others.to_string(),
                ..Default::default()
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story not found").await;

        Ok(())
    }
}
