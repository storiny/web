use crate::{
    constants::{
        sql_states::SqlState,
        story_category::STORY_CATEGORY_VEC,
        tag_regex::TAG_REGEX,
    },
    error::{
        AppError,
        FormErrorResponse,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_http::StatusCode;
use actix_web::{
    patch,
    web,
    HttpResponse,
};
use actix_web_validator::Json;
use serde::{
    Deserialize,
    Deserializer,
    Serialize,
};
use sqlx::Row;
use uuid::Uuid;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    story_id: String,
}

// This endpoint allows partial patch updates.
#[derive(Debug, Default, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(length(min = 1, max = 96, message = "Invalid title length"))]
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        deserialize_with = "deserialize_some"
    )]
    title: Option<String>,
    #[validate(length(min = 0, max = 256, message = "Invalid description length"))]
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        deserialize_with = "deserialize_some"
    )]
    description: Option<Option<String>>,
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        deserialize_with = "deserialize_some"
    )]
    splash_id: Option<Option<Uuid>>,
    #[validate(length(min = 0, max = 5, message = "Invalid story tags"))]
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        deserialize_with = "deserialize_some"
    )]
    tags: Option<Vec<String>>,
    #[validate(range(min = 1, max = 8, message = "Invalid story license"))]
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        deserialize_with = "deserialize_some"
    )]
    license: Option<i16>,
    #[validate(range(min = 1, max = 2, message = "Invalid story visibility"))]
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        deserialize_with = "deserialize_some"
    )]
    visibility: Option<i16>,
    #[validate(range(min = 1, max = 2, message = "Invalid story age restriction"))]
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        deserialize_with = "deserialize_some"
    )]
    age_restriction: Option<i16>,
    // Story category is validated in the request handler
    #[validate(length(min = 0, max = 128, message = "Invalid story category"))]
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        deserialize_with = "deserialize_some"
    )]
    category: Option<String>,
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        deserialize_with = "deserialize_some"
    )]
    disable_toc: Option<bool>,
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        deserialize_with = "deserialize_some"
    )]
    disable_comments: Option<bool>,
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        deserialize_with = "deserialize_some"
    )]
    disable_public_revision_history: Option<bool>,
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        deserialize_with = "deserialize_some"
    )]
    blog_id: Option<Option<String>>,
    // SEO
    #[validate(length(min = 0, max = 54, message = "Invalid SEO title length"))]
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        deserialize_with = "deserialize_some"
    )]
    seo_title: Option<Option<String>>,
    #[validate(length(min = 0, max = 160, message = "Invalid SEO description length"))]
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        deserialize_with = "deserialize_some"
    )]
    seo_description: Option<Option<String>>,
    #[validate(url(message = "Invalid canonical URL"))]
    #[validate(length(min = 0, max = 1024, message = "Invalid canonical URL length"))]
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        deserialize_with = "deserialize_some"
    )]
    canonical_url: Option<Option<String>>,
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        deserialize_with = "deserialize_some"
    )]
    preview_image: Option<Option<Uuid>>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Response {
    has_blog_modified: bool,
}

// Deserializes double option fields to distinguish between a `null` and a missing field. Any value
// that is present is considered `Some` value, including `null`.
fn deserialize_some<'de, T, D>(deserializer: D) -> Result<Option<T>, D::Error>
where
    T: Deserialize<'de>,
    D: Deserializer<'de>,
{
    Deserialize::deserialize(deserializer).map(Some)
}

#[patch("/v1/me/stories/{story_id}/metadata")]
#[tracing::instrument(
    name = "PATCH /v1/me/stories/{story_id}/metadata",
    skip_all,
    fields(
        user_id = user.id().ok(),
        story_id = %path.story_id,
        payload
    ),
    err
)]
async fn patch(
    payload: Json<Request>,
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let story_id = path
        .story_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid story ID"))?;

    // Validate category.
    if let Some(category) = &payload.category {
        if !STORY_CATEGORY_VEC.contains(category) {
            return Err(
                FormErrorResponse::new(None, vec![("category", "Invalid category")]).into(),
            );
        }
    }

    // Validate tags.
    if let Some(tags) = &payload.tags {
        if tags.iter().any(|tag| !TAG_REGEX.is_match(tag)) {
            return Err(FormErrorResponse::new(None, vec![("tags", "Invalid tags")]).into());
        }
    }

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    let mut splash_hex: Option<String> = None;
    let mut has_blog_modified = false;

    // Check if story exists for the user.
    {
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT FROM stories
    WHERE
          user_id = $1
      AND id = $2
      AND deleted_at IS NULL
)
"#,
        )
        .bind(user_id)
        .bind(story_id)
        .fetch_one(&mut *txn)
        .await?;

        if !result.get::<bool, _>("exists") {
            return Err(ToastErrorResponse::new(None, "Story not found").into());
        }
    }

    // Validate splash image.
    if let Some(splash_id) = &payload.splash_id {
        if splash_id.is_some() {
            splash_hex = Some(
                sqlx::query(
                    r#"
SELECT hex FROM assets
WHERE
    user_id = $1
    AND key = $2
"#,
                )
                .bind(user_id)
                .bind(splash_id)
                .fetch_one(&mut *txn)
                .await
                .map_err(|error| {
                    if matches!(error, sqlx::Error::RowNotFound) {
                        AppError::ToastError(ToastErrorResponse::new(None, "Invalid splash ID"))
                    } else {
                        AppError::SqlxError(error)
                    }
                })?
                .get::<String, _>("hex"),
            );
        }
    }

    // Validate preview image.
    if let Some(preview_image) = &payload.preview_image {
        if preview_image.is_some() {
            sqlx::query(
                r#"
SELECT 1 FROM assets
WHERE
    user_id = $1
    AND key = $2
"#,
            )
            .bind(user_id)
            .bind(preview_image)
            .fetch_one(&mut *txn)
            .await
            .map_err(|error| {
                if matches!(error, sqlx::Error::RowNotFound) {
                    AppError::ToastError(ToastErrorResponse::new(None, "Invalid preview image"))
                } else {
                    AppError::SqlxError(error)
                }
            })?;
        }
    }

    // Update blog.
    if let Some(blog_id) = &payload.blog_id {
        if let Some(blog_id) = blog_id {
            // Add the story to the blog.
            let blog_id = blog_id
                .parse::<i64>()
                .map_err(|_| AppError::from("Invalid blog ID"))?;

            // Delete previous blog.
            sqlx::query(
                r#"
DELETE FROM blog_stories
WHERE
    story_id = $1
    AND blog_id <> $2
"#,
            )
            .bind(story_id)
            .bind(blog_id)
            .execute(&mut *txn)
            .await?;

            sqlx::query(
                    r#"
INSERT INTO blog_stories (story_id, blog_id)
VALUES ($1, $2)
"#,
                )
                    .bind(story_id)
                    .bind(blog_id)
                    .execute(&mut *txn)
                    .await
                    .map_err(|error| {
                        if let Some(db_err) = error.as_database_error() {
                            let error_kind = db_err.kind();

                            // Check if the story is already present on the blog.
                            if matches!(error_kind, sqlx::error::ErrorKind::UniqueViolation) {
                                return AppError::ToastError(ToastErrorResponse::new(
                                    None,
                                    "You have already submitted your story to this blog"
                                ));
                            }

                            // Target blog is not present in the table.
                            if matches!(error_kind, sqlx::error::ErrorKind::ForeignKeyViolation) {
                                return AppError::ToastError(ToastErrorResponse::new(
                                    None,
                                    "Blog does not exist"
                                ));
                            }

                            let error_code = db_err.code().unwrap_or_default();

                            // Check if the blog is soft-deleted.
                            if error_code == SqlState::EntityUnavailable.to_string() {
                                return AppError::ToastError(ToastErrorResponse::new(
                                    None,
                                    "This blog is not available"
                                ));
                            }

                            // Check for review permission.
                            if error_code == SqlState::IllegalBlogStory.to_string() {
                                return AppError::ToastError(ToastErrorResponse::new(
                                    Some(StatusCode::FORBIDDEN),
                                    "You do not have sufficient permission to submit your story to this blog"
                                ));
                            }

                            // Check for locked blog.
                            if error_code == SqlState::BlogLocked.to_string() {
                                return AppError::ToastError(ToastErrorResponse::new(
                                        None,
                                        "You cannot publish your story on a locked blog"
                                    )) ;
                            }
                        }

                        AppError::SqlxError(error)
                    })?;
        } else {
            // Remove story from the blog.
            if sqlx::query(
                r#"
DELETE FROM blog_stories
WHERE story_id = $1
"#,
            )
            .bind(story_id)
            .execute(&mut *txn)
            .await?
            .rows_affected()
                == 0
            {
                return Err(ToastErrorResponse::new(
                    None,
                    "This story has not been published on the blog",
                )
                .into());
            }
        }

        has_blog_modified = true;
    }

    // Update tags.
    if let Some(tags) = &payload.tags {
        sqlx::query(
            r#"
SELECT update_draft_or_story_tags($1, $2, $3)
"#,
        )
        .bind(story_id)
        .bind(user_id)
        .bind(tags)
        .execute(&mut *txn)
        .await
        .map_err(|error| {
            if let Some(db_err) = error.as_database_error() {
                let error_code = db_err.code().unwrap_or_default();

                // Check for error returned from the `update_draft_or_story_tags` function.
                if error_code == SqlState::EntityUnavailable.to_string() {
                    return AppError::ToastError(ToastErrorResponse::new(None, "Story not found"));
                }
            }

            AppError::SqlxError(error)
        })?;
    }

    // Update title.
    if let Some(title) = &payload.title {
        sqlx::query(
            r#"
UPDATE stories
SET title = $1
WHERE id = $2
"#,
        )
        .bind(title)
        .bind(story_id)
        .execute(&mut *txn)
        .await?;
    }

    // Update description.
    if let Some(description) = &payload.description {
        sqlx::query(
            r#"
UPDATE stories
SET description = $1
WHERE id = $2
"#,
        )
        .bind(description)
        .bind(story_id)
        .execute(&mut *txn)
        .await?;
    }

    // Update splash.
    if let Some(splash_id) = &payload.splash_id {
        sqlx::query(
            r#"
UPDATE stories
SET
    splash_id = $1,
    splash_hex = $2
WHERE id = $3
"#,
        )
        .bind(splash_id)
        .bind(splash_hex)
        .bind(story_id)
        .execute(&mut *txn)
        .await?;
    }

    // Update license.
    if let Some(license) = &payload.license {
        sqlx::query(
            r#"
UPDATE stories
SET license = $1
WHERE id = $2
"#,
        )
        .bind(license)
        .bind(story_id)
        .execute(&mut *txn)
        .await?;
    }

    // Update visibility.
    if let Some(visibility) = &payload.visibility {
        sqlx::query(
            r#"
UPDATE stories
SET visibility = $1
WHERE id = $2
"#,
        )
        .bind(visibility)
        .bind(story_id)
        .execute(&mut *txn)
        .await?;
    }

    // Update age restriction.
    if let Some(age_restriction) = &payload.age_restriction {
        sqlx::query(
            r#"
UPDATE stories
SET age_restriction = $1
WHERE id = $2
"#,
        )
        .bind(age_restriction)
        .bind(story_id)
        .execute(&mut *txn)
        .await?;
    }

    // Update story category.
    if let Some(category) = &payload.category {
        sqlx::query(
            r#"
UPDATE stories
SET category = $1::story_category
WHERE id = $2
"#,
        )
        .bind(category)
        .bind(story_id)
        .execute(&mut *txn)
        .await?;
    }

    // Update TOC flag.
    if let Some(disable_toc) = &payload.disable_toc {
        sqlx::query(
            r#"
UPDATE stories
SET disable_toc = $1
WHERE id = $2
"#,
        )
        .bind(disable_toc)
        .bind(story_id)
        .execute(&mut *txn)
        .await?;
    }

    // Update comments flag.
    if let Some(disable_comments) = &payload.disable_comments {
        sqlx::query(
            r#"
UPDATE stories
SET disable_comments = $1
WHERE id = $2
"#,
        )
        .bind(disable_comments)
        .bind(story_id)
        .execute(&mut *txn)
        .await?;
    }

    // Update revision history flag.
    if let Some(disable_public_revision_history) = &payload.disable_public_revision_history {
        sqlx::query(
            r#"
UPDATE stories
SET disable_public_revision_history = $1
WHERE id = $2
"#,
        )
        .bind(disable_public_revision_history)
        .bind(story_id)
        .execute(&mut *txn)
        .await?;
    }

    // Update SEO title.
    if let Some(seo_title) = &payload.seo_title {
        sqlx::query(
            r#"
UPDATE stories
SET seo_title = $1
WHERE id = $2
"#,
        )
        .bind(seo_title)
        .bind(story_id)
        .execute(&mut *txn)
        .await?;
    }

    // Update SEO description.
    if let Some(seo_description) = &payload.seo_description {
        sqlx::query(
            r#"
UPDATE stories
SET seo_description = $1
WHERE id = $2
"#,
        )
        .bind(seo_description)
        .bind(story_id)
        .execute(&mut *txn)
        .await?;
    }

    // Update canonical URL.
    if let Some(canonical_url) = &payload.canonical_url {
        sqlx::query(
            r#"
UPDATE stories
SET canonical_url = $1
WHERE id = $2
"#,
        )
        .bind(canonical_url)
        .bind(story_id)
        .execute(&mut *txn)
        .await?;
    }

    // Update preview image.
    if let Some(preview_image) = &payload.preview_image {
        sqlx::query(
            r#"
UPDATE stories
SET preview_image = $1
WHERE id = $2
"#,
        )
        .bind(preview_image)
        .bind(story_id)
        .execute(&mut *txn)
        .await?;
    }

    txn.commit().await?;

    Ok(HttpResponse::Ok().json(Response { has_blog_modified }))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(patch);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        constants::story_category::StoryCategory,
        grpc::defs::story_def::v1::{
            StoryAgeRestriction,
            StoryLicense,
            StoryVisibility,
        },
        test_utils::{
            assert_form_error_response,
            assert_toast_error_response,
            init_app_for_test,
            res_to_string,
        },
    };
    use actix_web::test;
    use sqlx::{
        FromRow,
        PgPool,
        Row,
    };
    use time::OffsetDateTime;

    /// Metadata without `tags` and with `splash_hex`.
    #[derive(Debug, FromRow)]
    struct Metadata {
        title: String,
        description: Option<String>,
        splash_id: Option<Uuid>,
        splash_hex: Option<String>,
        license: i16,
        visibility: i16,
        age_restriction: i16,
        // Story category is validated in the request handler.
        category: String,
        disable_toc: bool,
        disable_comments: bool,
        disable_public_revision_history: bool,
        // SEO
        seo_title: Option<String>,
        seo_description: Option<String>,
        canonical_url: Option<String>,
        preview_image: Option<Uuid>,
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_update_story_metadata(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, true, Some(1_i64)).await;

        // Assert initial metadata.
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

        assert!(!result.disable_toc);
        assert!(!result.disable_comments);
        assert!(!result.disable_public_revision_history);

        assert!(result.seo_title.is_none());
        assert!(result.seo_description.is_none());
        assert!(result.canonical_url.is_none());
        assert!(result.preview_image.is_none());

        // Insert an asset for splash and preview image.
        let asset_key = Uuid::new_v4();
        let result = sqlx::query(
            r#"
INSERT INTO assets (key, hex, height, width, user_id)
VALUES ($1, $2, $3, $4, $5)
"#,
        )
        .bind(asset_key)
        .bind("000000")
        .bind(0)
        .bind(0)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/metadata", 2))
            .set_json(Request {
                title: Some("New title".to_string()),
                description: Some(Some("New description".to_string())),
                splash_id: Some(Some(asset_key)),
                tags: Some(Vec::new()),
                license: Some(StoryLicense::CcZero as i16),
                visibility: Some(StoryVisibility::Unlisted as i16),
                age_restriction: Some(StoryAgeRestriction::Rated as i16),
                category: Some(StoryCategory::DIY.to_string()),
                disable_toc: Some(true),
                disable_comments: Some(true),
                disable_public_revision_history: Some(true),
                seo_title: Some(Some("New SEO title".to_string())),
                seo_description: Some(Some("New SEO description".to_string())),
                canonical_url: Some(Some("https://storiny.com".to_string())),
                preview_image: Some(Some(asset_key)),
                blog_id: None,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Response>(&res_to_string(res).await).unwrap();

        assert!(!json.has_blog_modified);

        // Story should get updated in the database.
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
        assert_eq!(result.splash_id.unwrap(), asset_key);
        assert_eq!(result.splash_hex.unwrap(), "000000".to_string());

        assert_eq!(result.license, StoryLicense::CcZero as i16);
        assert_eq!(result.visibility, StoryVisibility::Unlisted as i16);
        assert_eq!(result.age_restriction, StoryAgeRestriction::Rated as i16);
        assert_eq!(result.category, StoryCategory::DIY.to_string());

        assert!(result.disable_toc);
        assert!(result.disable_comments);
        assert!(result.disable_public_revision_history);

        assert_eq!(result.seo_title.unwrap(), "New SEO title".to_string());
        assert_eq!(
            result.seo_description.unwrap(),
            "New SEO description".to_string()
        );
        assert_eq!(
            result.canonical_url.unwrap(),
            "https://storiny.com".to_string()
        );
        assert_eq!(result.preview_image.unwrap(), asset_key);

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_update_story_tags(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(patch, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/metadata", 2))
            .set_json(Request {
                tags: Some(vec![
                    "tag-1".to_string(),
                    "tag-2".to_string(),
                    "tag-3".to_string(),
                ]),
                ..Default::default()
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Tags should get inserted in the database.
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

    #[sqlx::test(fixtures("story"))]
    async fn can_add_story_to_a_blog(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, true, Some(1_i64)).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ('Sample blog', 'sample-blog', $1)
RETURNING id
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/metadata", 2))
            .set_json(Request {
                blog_id: Some(Some(blog_id.to_string())),
                ..Default::default()
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Response>(&res_to_string(res).await).unwrap();

        assert!(json.has_blog_modified);

        // Story should be added to the blog.
        let result = sqlx::query(
            r#"
SELECT accepted_at FROM blog_stories
WHERE story_id = $1
"#,
        )
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("accepted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_remove_story_from_a_blog(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, true, Some(1_i64)).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ('Sample blog', 'sample-blog', $1)
RETURNING id
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        // Add the story to the blog.
        let result = sqlx::query(
            r#"
INSERT INTO blog_stories (story_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/metadata", 2))
            .set_json(Request {
                blog_id: Some(None),
                ..Default::default()
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Response>(&res_to_string(res).await).unwrap();

        assert!(json.has_blog_modified);

        // Story should get removed from the blog.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT FROM blog_stories
    WHERE story_id = $1
)
"#,
        )
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn should_not_add_story_to_a_blog_with_missing_permission(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(patch, pool, true, true, Some(1_i64)).await;

        // Insert a locked blog.
        let result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Blog owner', 'blog_owner', 'blog_owner@storiny.com')
    RETURNING id
)
INSERT INTO blogs (name, slug, user_id)
VALUES ('Sample blog', 'sample-blog', (SELECT id FROM inserted_user))
RETURNING id
"#,
        )
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/metadata", 2))
            .set_json(Request {
                blog_id: Some(Some(blog_id.to_string())),
                ..Default::default()
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(
            res,
            "You do not have sufficient permission to submit your story to this blog",
        )
        .await;

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn should_not_add_story_to_a_locked_blog(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, true, Some(1_i64)).await;

        // Insert a locked blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id, is_active)
VALUES ('Sample blog', 'sample-blog', $1, FALSE)
RETURNING id
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/metadata", 2))
            .set_json(Request {
                blog_id: Some(Some(blog_id.to_string())),
                ..Default::default()
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "You cannot publish your story on a locked blog").await;

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn should_not_add_story_to_a_deleted_blog(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, true, Some(1_i64)).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ('Sample blog', 'sample-blog', $1)
RETURNING id
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        // Soft-delete the blog.
        let result = sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/metadata", 2))
            .set_json(Request {
                blog_id: Some(Some(blog_id.to_string())),
                ..Default::default()
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "This blog is not available").await;

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_reject_duplicate_blog_request(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, true, Some(1_i64)).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ('Sample blog', 'sample-blog', $1)
RETURNING id
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        let req = test::TestRequest::patch()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/stories/{}/metadata", 2))
            .set_json(Request {
                blog_id: Some(Some(blog_id.to_string())),
                ..Default::default()
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Try adding the story again.
        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/metadata", 2))
            .set_json(Request {
                blog_id: Some(Some(blog_id.to_string())),
                ..Default::default()
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "You have already submitted your story to this blog")
            .await;

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_reject_an_invalid_blog_id(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(patch, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::patch()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/stories/{}/metadata", 2))
            .set_json(Request {
                blog_id: Some(Some(12345.to_string())),
                ..Default::default()
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Blog does not exist").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_invalid_story_category(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(patch, pool, true, true, None).await;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/metadata", 2))
            .set_json(Request {
                category: Some("invalid".to_string()),
                ..Default::default()
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(res, vec![("category", "Invalid category")]).await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_invalid_story_tags(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(patch, pool, true, true, None).await;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/metadata", 2))
            .set_json(Request {
                tags: Some(vec!["SOME INVALID TAG".to_string()]),
                ..Default::default()
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(res, vec![("tags", "Invalid tags")]).await;

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_reject_an_invalid_story_splash(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(patch, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/metadata", 2))
            .set_json(Request {
                splash_id: Some(Some(Uuid::new_v4())),
                ..Default::default()
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Invalid splash ID").await;

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_reject_an_invalid_preview_image(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(patch, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/metadata", 2))
            .set_json(Request {
                preview_image: Some(Some(Uuid::new_v4())),
                ..Default::default()
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Invalid preview image").await;

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn should_not_update_metadata_for_a_soft_deleted_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(patch, pool, true, true, Some(1_i64)).await;

        // Soft-delete the story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
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
            .set_json(Request::default())
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Story not found").await;

        Ok(())
    }
}
