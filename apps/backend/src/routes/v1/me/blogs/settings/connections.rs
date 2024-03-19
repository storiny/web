use crate::{
    error::{
        AppError,
        FormErrorResponse,
    },
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_web::{
    patch,
    web,
    HttpResponse,
};
use actix_web_validator::Json;
use serde::{
    Deserialize,
    Serialize,
};
use url::Url;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    blog_id: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(url(message = "Invalid website URL"))]
    #[validate(length(min = 0, max = 1024, message = "Invalid website URL length"))]
    website_url: Option<String>,
    #[validate(email(message = "Invalid public e-mail"))]
    #[validate(length(min = 0, max = 300, message = "Invalid public e-mail length"))]
    public_email: Option<String>,
    #[validate(url(message = "Invalid LinkedIn URL"))]
    #[validate(length(min = 0, max = 1024, message = "Invalid LinkedIn URL length"))]
    linkedin_url: Option<String>,
    #[validate(url(message = "Invalid YouTube URL"))]
    #[validate(length(min = 0, max = 1024, message = "Invalid YouTube URL length"))]
    youtube_url: Option<String>,
    #[validate(url(message = "Invalid Twitch URL"))]
    #[validate(length(min = 0, max = 1024, message = "Invalid Twitch URL length"))]
    twitch_url: Option<String>,
    #[validate(url(message = "Invalid Instagram URL"))]
    #[validate(length(min = 0, max = 1024, message = "Invalid Instagram URL length"))]
    instagram_url: Option<String>,
    #[validate(url(message = "Invalid Twitter URL"))]
    #[validate(length(min = 0, max = 1024, message = "Invalid Twitter URL length"))]
    twitter_url: Option<String>,
    #[validate(url(message = "Invalid GitHub URL"))]
    #[validate(length(min = 0, max = 1024, message = "Invalid GitHub URL length"))]
    github_url: Option<String>,
}

/// The validator for a particular connection provider.
struct ProviderValidator {
    /// The display name of the connection provider.
    display_name: String,
    /// The form field name of the provider.
    field_name: String,
    /// The received URL of the connection.
    url: Option<String>,
    /// The allowed set of domain names for this provider.
    allowed_domains: Vec<String>,
}

#[patch("/v1/me/blogs/{blog_id}/settings/connections")]
#[tracing::instrument(
    name = "PATCH /v1/me/blogs/{blog_id}/settings/connections",
    skip_all,
    fields(
        user = user.id().ok(),
        blog_id = %path.blog_id,
        payload
    ),
    err
)]
async fn patch(
    payload: Json<Request>,
    data: web::Data<AppState>,
    path: web::Path<Fragments>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let blog_id = path
        .blog_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid blog ID"))?;

    // Validate provider URLs.
    {
        let mut validation_errors = Vec::new();

        [
            ProviderValidator {
                display_name: "LinkedIn".to_string(),
                field_name: "linkedin_url".to_string(),
                url: payload.linkedin_url.clone(),
                allowed_domains: vec!["linkedin.com".to_string()],
            },
            ProviderValidator {
                display_name: "YouTube".to_string(),
                field_name: "youtube_url".to_string(),
                url: payload.youtube_url.clone(),
                allowed_domains: vec![
                    "youtube.com".to_string(),
                    "youtu.be".to_string(),
                    "youtubekids.com".to_string(),
                ],
            },
            ProviderValidator {
                display_name: "Twitch".to_string(),
                field_name: "twitch_url".to_string(),
                url: payload.twitch_url.clone(),
                allowed_domains: vec!["twitch.tv".to_string()],
            },
            ProviderValidator {
                display_name: "Instagram".to_string(),
                field_name: "instagram_url".to_string(),
                url: payload.instagram_url.clone(),
                allowed_domains: vec!["ig.me".to_string(), "instagram.com".to_string()],
            },
            ProviderValidator {
                display_name: "Twitter".to_string(),
                field_name: "twitter_url".to_string(),
                url: payload.twitter_url.clone(),
                allowed_domains: vec![
                    "x.com".to_string(),
                    "t.co".to_string(),
                    "twitter.com".to_string(),
                ],
            },
            ProviderValidator {
                display_name: "GitHub".to_string(),
                field_name: "github_url".to_string(),
                url: payload.github_url.clone(),
                allowed_domains: vec!["github.com".to_string(), "github.io".to_string()],
            },
        ]
        .iter()
        .for_each(|item| {
            if let Some(url) = &item.url {
                let field_name = item.field_name.to_string();

                match Url::parse(url.as_ref()) {
                    Ok(result) => {
                        if !result.has_host()
                            || !item.allowed_domains.contains(
                                &result
                                    .domain()
                                    .unwrap_or_default()
                                    .to_string()
                                    // Strip the `www` prefix
                                    .replace("www.", ""),
                            )
                        {
                            validation_errors
                                .push((field_name, format!("Invalid {} URL", item.display_name)));
                        }
                    }
                    Err(_) => {
                        validation_errors
                            .push((field_name, format!("Invalid {} URL", item.display_name)));
                    }
                }
            }
        });

        if !validation_errors.is_empty() {
            return Err(FormErrorResponse::new(
                None,
                validation_errors
                    .iter()
                    .map(|item| (item.0.as_str(), item.1.as_str()))
                    .collect(),
            )
            .into());
        }
    }

    match sqlx::query(
        r#"
WITH blog_as_owner AS (
    SELECT 1 FROM blogs
    WHERE
        id = $2
        AND user_id = $1
        AND deleted_at IS NULL
), blog_as_editor AS (
    SELECT 1 FROM blog_editors
    WHERE
        blog_id = $2
        AND user_id = $1
        AND accepted_at IS NOT NULL
        AND deleted_at IS NULL
        AND NOT EXISTS (
            SELECT FROM blog_as_owner
        )
), sanity_check AS (
    SELECT COALESCE(
        (SELECT TRUE FROM blog_as_owner),
        (SELECT TRUE FROM blog_as_editor)
    ) AS "found"
)
UPDATE blogs
SET
    website_url = $3,
    public_email = $4,
    linkedin_url = $5,
    youtube_url = $6,
    twitch_url = $7,
    instagram_url = $8,
    twitter_url = $9,
    github_url = $10
WHERE
    id = $2
    AND (SELECT found FROM sanity_check) IS TRUE
"#,
    )
    .bind(user_id)
    .bind(blog_id)
    .bind(&payload.website_url)
    .bind(&payload.public_email)
    .bind(&payload.linkedin_url)
    .bind(&payload.youtube_url)
    .bind(&payload.twitch_url)
    .bind(&payload.instagram_url)
    .bind(&payload.twitter_url)
    .bind(&payload.github_url)
    .execute(&data.db_pool)
    .await?
    .rows_affected()
    {
        0 => Err(AppError::from(
            "Missing permission or the blog does not exist",
        )),
        _ => Ok(HttpResponse::NoContent().finish()),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(patch);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_response_body_text,
        init_app_for_test,
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test]
    async fn can_update_connections_as_blog_owner(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING
    id,
    website_url,
    public_email,
    linkedin_url,
    youtube_url,
    twitch_url,
    instagram_url,
    twitter_url,
    github_url
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        // Should be `NULL` initially.
        assert!(result.get::<Option<String>, _>("website_url").is_none());
        assert!(result.get::<Option<String>, _>("public_email").is_none());
        assert!(result.get::<Option<String>, _>("linkedin_url").is_none());
        assert!(result.get::<Option<String>, _>("youtube_url").is_none());
        assert!(result.get::<Option<String>, _>("twitch_url").is_none());
        assert!(result.get::<Option<String>, _>("instagram_url").is_none());
        assert!(result.get::<Option<String>, _>("twitter_url").is_none());
        assert!(result.get::<Option<String>, _>("github_url").is_none());

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/connections"))
            .set_json(Request {
                website_url: Some("https://storiny.com".to_string()),
                public_email: Some("test@storiny.com".to_string()),
                linkedin_url: Some("https://linkedin.com/test".to_string()),
                youtube_url: Some("https://youtube.com/test".to_string()),
                twitch_url: Some("https://twitch.tv/test".to_string()),
                instagram_url: Some("https://instagram.com/test".to_string()),
                twitter_url: Some("https://twitter.com/test".to_string()),
                github_url: Some("https://github.com/test".to_string()),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Blog should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT
    website_url,
    public_email,
    linkedin_url,
    youtube_url,
    twitch_url,
    instagram_url,
    twitter_url,
    github_url
FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<Option<String>, _>("website_url").unwrap(),
            "https://storiny.com".to_string()
        );
        assert_eq!(
            result.get::<Option<String>, _>("public_email").unwrap(),
            "test@storiny.com".to_string()
        );
        assert_eq!(
            result.get::<Option<String>, _>("linkedin_url").unwrap(),
            "https://linkedin.com/test".to_string()
        );
        assert_eq!(
            result.get::<Option<String>, _>("youtube_url").unwrap(),
            "https://youtube.com/test".to_string()
        );
        assert_eq!(
            result.get::<Option<String>, _>("twitch_url").unwrap(),
            "https://twitch.tv/test".to_string()
        );
        assert_eq!(
            result.get::<Option<String>, _>("instagram_url").unwrap(),
            "https://instagram.com/test".to_string()
        );
        assert_eq!(
            result.get::<Option<String>, _>("twitter_url").unwrap(),
            "https://twitter.com/test".to_string()
        );
        assert_eq!(
            result.get::<Option<String>, _>("github_url").unwrap(),
            "https://github.com/test".to_string()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_update_connections_as_blog_editor(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Sample user 1', 'sample_user_1', 'sample_1@storiny.com')
    RETURNING id
)
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, (SELECT id FROM inserted_user))
RETURNING
    id,
    website_url,
    public_email,
    linkedin_url,
    youtube_url,
    twitch_url,
    instagram_url,
    twitter_url,
    github_url
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .fetch_one(&mut *conn)
        .await?;

        // Should be `NULL` initially.
        assert!(result.get::<Option<String>, _>("website_url").is_none());
        assert!(result.get::<Option<String>, _>("public_email").is_none());
        assert!(result.get::<Option<String>, _>("linkedin_url").is_none());
        assert!(result.get::<Option<String>, _>("youtube_url").is_none());
        assert!(result.get::<Option<String>, _>("twitch_url").is_none());
        assert!(result.get::<Option<String>, _>("instagram_url").is_none());
        assert!(result.get::<Option<String>, _>("twitter_url").is_none());
        assert!(result.get::<Option<String>, _>("github_url").is_none());

        let blog_id = result.get::<i64, _>("id");

        // Add the current user as an editor.
        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id.unwrap())
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::patch()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/connections"))
            .set_json(Request {
                website_url: Some("https://storiny.com".to_string()),
                public_email: Some("test@storiny.com".to_string()),
                linkedin_url: Some("https://linkedin.com/test".to_string()),
                youtube_url: Some("https://youtube.com/test".to_string()),
                twitch_url: Some("https://twitch.tv/test".to_string()),
                instagram_url: Some("https://instagram.com/test".to_string()),
                twitter_url: Some("https://twitter.com/test".to_string()),
                github_url: Some("https://github.com/test".to_string()),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should reject the request as the editor has not been accepted yet.
        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Missing permission or the blog does not exist").await;

        // Accept the editor.
        let result = sqlx::query(
            r#"
UPDATE blog_editors
SET accepted_at = NOW()
WHERE user_id = $1
"#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/connections"))
            .set_json(Request {
                website_url: Some("https://storiny.com".to_string()),
                public_email: Some("test@storiny.com".to_string()),
                linkedin_url: Some("https://linkedin.com/test".to_string()),
                youtube_url: Some("https://youtube.com/test".to_string()),
                twitch_url: Some("https://twitch.tv/test".to_string()),
                instagram_url: Some("https://instagram.com/test".to_string()),
                twitter_url: Some("https://twitter.com/test".to_string()),
                github_url: Some("https://github.com/test".to_string()),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Blog should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT
    website_url,
    public_email,
    linkedin_url,
    youtube_url,
    twitch_url,
    instagram_url,
    twitter_url,
    github_url
FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<Option<String>, _>("website_url").unwrap(),
            "https://storiny.com".to_string()
        );
        assert_eq!(
            result.get::<Option<String>, _>("public_email").unwrap(),
            "test@storiny.com".to_string()
        );
        assert_eq!(
            result.get::<Option<String>, _>("linkedin_url").unwrap(),
            "https://linkedin.com/test".to_string()
        );
        assert_eq!(
            result.get::<Option<String>, _>("youtube_url").unwrap(),
            "https://youtube.com/test".to_string()
        );
        assert_eq!(
            result.get::<Option<String>, _>("twitch_url").unwrap(),
            "https://twitch.tv/test".to_string()
        );
        assert_eq!(
            result.get::<Option<String>, _>("instagram_url").unwrap(),
            "https://instagram.com/test".to_string()
        );
        assert_eq!(
            result.get::<Option<String>, _>("twitter_url").unwrap(),
            "https://twitter.com/test".to_string()
        );
        assert_eq!(
            result.get::<Option<String>, _>("github_url").unwrap(),
            "https://github.com/test".to_string()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_reset_blog_connections(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING
    id,
    website_url,
    public_email,
    linkedin_url,
    youtube_url,
    twitch_url,
    instagram_url,
    twitter_url,
    github_url
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        // Set initial values.
        let req = test::TestRequest::patch()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/connections"))
            .set_json(Request {
                website_url: Some("https://storiny.com".to_string()),
                public_email: Some("test@storiny.com".to_string()),
                linkedin_url: Some("https://linkedin.com/test".to_string()),
                youtube_url: Some("https://youtube.com/test".to_string()),
                twitch_url: Some("https://twitch.tv/test".to_string()),
                instagram_url: Some("https://instagram.com/test".to_string()),
                twitter_url: Some("https://twitter.com/test".to_string()),
                github_url: Some("https://github.com/test".to_string()),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Blog should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT
    website_url,
    public_email,
    linkedin_url,
    youtube_url,
    twitch_url,
    instagram_url,
    twitter_url,
    github_url
FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<Option<String>, _>("website_url").unwrap(),
            "https://storiny.com".to_string()
        );
        assert_eq!(
            result.get::<Option<String>, _>("public_email").unwrap(),
            "test@storiny.com".to_string()
        );
        assert_eq!(
            result.get::<Option<String>, _>("linkedin_url").unwrap(),
            "https://linkedin.com/test".to_string()
        );
        assert_eq!(
            result.get::<Option<String>, _>("youtube_url").unwrap(),
            "https://youtube.com/test".to_string()
        );
        assert_eq!(
            result.get::<Option<String>, _>("twitch_url").unwrap(),
            "https://twitch.tv/test".to_string()
        );
        assert_eq!(
            result.get::<Option<String>, _>("instagram_url").unwrap(),
            "https://instagram.com/test".to_string()
        );
        assert_eq!(
            result.get::<Option<String>, _>("twitter_url").unwrap(),
            "https://twitter.com/test".to_string()
        );
        assert_eq!(
            result.get::<Option<String>, _>("github_url").unwrap(),
            "https://github.com/test".to_string()
        );

        // Reset initial values.
        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/connections"))
            .set_json(Request {
                website_url: None,
                public_email: None,
                linkedin_url: None,
                youtube_url: None,
                twitch_url: None,
                instagram_url: None,
                twitter_url: None,
                github_url: None,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Blog should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT
    website_url,
    public_email,
    linkedin_url,
    youtube_url,
    twitch_url,
    instagram_url,
    twitter_url,
    github_url
FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<Option<String>, _>("website_url").is_none());
        assert!(result.get::<Option<String>, _>("public_email").is_none());
        assert!(result.get::<Option<String>, _>("linkedin_url").is_none());
        assert!(result.get::<Option<String>, _>("youtube_url").is_none());
        assert!(result.get::<Option<String>, _>("twitch_url").is_none());
        assert!(result.get::<Option<String>, _>("instagram_url").is_none());
        assert!(result.get::<Option<String>, _>("twitter_url").is_none());
        assert!(result.get::<Option<String>, _>("github_url").is_none());

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_connections_request_for_a_deleted_blog(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Insert a blog.
        let result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        // Delete the blog.
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
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/connections"))
            .set_json(Request {
                website_url: None,
                public_email: None,
                linkedin_url: None,
                youtube_url: None,
                twitch_url: None,
                instagram_url: None,
                twitter_url: None,
                github_url: None,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Missing permission or the blog does not exist").await;

        Ok(())
    }
}
