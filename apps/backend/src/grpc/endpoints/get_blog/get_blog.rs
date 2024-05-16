use crate::{
    grpc::{
        defs::blog_def::v1::{
            GetBlogRequest,
            GetBlogResponse,
            LeftSidebarItem as BlogLeftSidebarItem,
            RightSidebarItem as BlogRightSidebarItem,
        },
        service::GrpcService,
    },
    utils::to_iso8601::to_iso8601,
};
use serde::Deserialize;
use sqlx::{
    types::Json,
    FromRow,
};
use time::OffsetDateTime;
use tonic::{
    Request,
    Response,
    Status,
};
use tracing::error;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct LeftSidebarItem {
    id: i64,
    name: String,
    target: String,
    icon: Option<Uuid>,
    priority: i32,
}

#[derive(Debug, Deserialize)]
struct RightSidebarItem {
    id: i64,
    primary_text: String,
    secondary_text: Option<String>,
    target: String,
    icon: Option<Uuid>,
    priority: i32,
}

#[derive(Debug, FromRow)]
struct Blog {
    id: i64,
    name: String,
    slug: String,
    description: Option<String>,
    // Logo
    logo_id: Option<Uuid>,
    logo_hex: Option<String>,
    // Banner
    banner_id: Option<Uuid>,
    banner_hex: Option<String>,
    // Newsletter splash
    newsletter_splash_id: Option<Uuid>,
    newsletter_splash_hex: Option<String>,
    // Marks
    mark_light: Option<Uuid>,
    mark_dark: Option<Uuid>,
    // Fonts
    font_primary: Option<Uuid>,
    font_secondary: Option<Uuid>,
    font_code: Option<Uuid>,
    // Theme
    default_theme: Option<String>,
    force_theme: bool,
    favicon: Option<Uuid>,
    hide_storiny_branding: bool,
    is_homepage_large_layout: bool,
    is_story_minimal_layout: bool,
    //
    domain: Option<String>,
    category: String,
    user_id: i64,
    rsb_items_label: String,
    // SEO
    seo_title: Option<String>,
    seo_description: Option<String>,
    preview_image: Option<Uuid>,
    /// Connections
    website_url: Option<String>,
    public_email: Option<String>,
    github_url: Option<String>,
    instagram_url: Option<String>,
    linkedin_url: Option<String>,
    youtube_url: Option<String>,
    twitter_url: Option<String>,
    twitch_url: Option<String>,
    // Timestamps
    created_at: OffsetDateTime,
    // Joins
    lsb_items: Json<Vec<LeftSidebarItem>>,
    rsb_items: Json<Vec<RightSidebarItem>>,
    // Boolean flags
    is_following: bool,
    is_owner: bool,
    is_editor: bool,
    is_writer: bool,
    is_external: bool,
    has_plus_features: bool,
}

/// Builds a plus feature guard that returns `Some(value)` if the `has_plus_features` parameter is
/// `true`, `None` otherwise.
///
/// * `has_plus_features` - The plus features flag.
fn build_plus_guard<T>(has_plus_features: bool) -> impl Fn(Option<T>) -> Option<T> {
    move |value| {
        if has_plus_features { value } else { None }
    }
}

/// Returns the blog object.
#[tracing::instrument(
    name = "GRPC get_blog",
    skip_all,
    fields(
        identifier = tracing::field::Empty,
        user_id = tracing::field::Empty
    ),
    err
)]
pub async fn get_blog(
    client: &GrpcService,
    request: Request<GetBlogRequest>,
) -> Result<Response<GetBlogResponse>, Status> {
    let request = request.into_inner();
    let maybe_blog_slug = request.identifier.clone();
    let maybe_blog_id = request.identifier.parse::<i64>().ok();
    let current_user_id = request
        .current_user_id
        .and_then(|user_id| user_id.parse::<i64>().ok());

    let mut blog = {
        if let Some(current_user_id) = current_user_id {
            tracing::Span::current().record("user_id", current_user_id);

            if let Some(blog_id) = maybe_blog_id {
                sqlx::query_file_as!(
                    Blog,
                    "queries/grpc/get_blog/logged_in_by_id.sql",
                    blog_id,
                    current_user_id
                )
                .fetch_one(&client.db_pool)
                .await
            } else {
                sqlx::query_file_as!(
                    Blog,
                    "queries/grpc/get_blog/logged_in_by_domain_or_slug.sql",
                    maybe_blog_slug,
                    current_user_id
                )
                .fetch_one(&client.db_pool)
                .await
            }
        } else if let Some(blog_id) = maybe_blog_id {
            sqlx::query_file_as!(Blog, "queries/grpc/get_blog/default_by_id.sql", blog_id)
                .fetch_one(&client.db_pool)
                .await
        } else {
            sqlx::query_file_as!(
                Blog,
                "queries/grpc/get_blog/default_by_domain_or_slug.sql",
                maybe_blog_slug,
            )
            .fetch_one(&client.db_pool)
            .await
        }
    }
    .map_err(|error| {
        if matches!(error, sqlx::Error::RowNotFound) {
            Status::not_found("Blog not found")
        } else {
            error!("database error: {error:?}");
            Status::internal("Database error")
        }
    })?;

    // Sort the sidebar items
    blog.lsb_items.sort_by_key(|item| item.priority);
    blog.rsb_items.sort_by_key(|item| item.priority);

    let plus_guard_uuid = build_plus_guard::<Uuid>(blog.has_plus_features);
    let plus_guard_str = build_plus_guard::<String>(blog.has_plus_features);

    Ok(Response::new(GetBlogResponse {
        id: blog.id.to_string(),
        name: blog.name,
        slug: blog.slug,
        description: blog.description,
        // Logo
        logo_id: blog.logo_id.map(|value| value.to_string()),
        logo_hex: blog.logo_hex,
        // Banner
        banner_id: plus_guard_uuid(blog.banner_id).map(|value| value.to_string()),
        banner_hex: plus_guard_str(blog.banner_hex),
        // Newsletter splash
        newsletter_splash_id: plus_guard_uuid(blog.newsletter_splash_id)
            .map(|value| value.to_string()),
        newsletter_splash_hex: plus_guard_str(blog.newsletter_splash_hex),
        // Marks
        mark_light: blog.mark_light.map(|value| value.to_string()),
        mark_dark: blog.mark_dark.map(|value| value.to_string()),
        // Fonts
        font_primary: plus_guard_uuid(blog.font_primary).map(|value| value.to_string()),
        font_secondary: plus_guard_uuid(blog.font_secondary).map(|value| value.to_string()),
        font_code: plus_guard_uuid(blog.font_code).map(|value| value.to_string()),
        //
        domain: blog.domain,
        category: blog.category,
        user_id: blog.user_id.to_string(),
        rsb_items_label: blog.rsb_items_label,
        // SEO
        seo_description: blog.seo_description,
        seo_title: blog.seo_title,
        preview_image: blog.preview_image.map(|value| value.to_string()),
        // Theme
        default_theme: blog.default_theme,
        force_theme: blog.force_theme,
        favicon: blog.favicon.map(|value| value.to_string()),
        hide_storiny_branding: if !blog.has_plus_features {
            false
        } else {
            blog.hide_storiny_branding
        },
        is_homepage_large_layout: blog.is_homepage_large_layout,
        is_story_minimal_layout: blog.is_story_minimal_layout,
        // Connections
        website_url: blog.website_url,
        public_email: blog.public_email,
        github_url: blog.github_url,
        instagram_url: blog.instagram_url,
        linkedin_url: blog.linkedin_url,
        youtube_url: blog.youtube_url,
        twitter_url: blog.twitter_url,
        twitch_url: blog.twitch_url,
        // Timestamp
        created_at: to_iso8601(&blog.created_at),
        // Joins
        lsb_items: blog
            .lsb_items
            .iter()
            .map(|item| BlogLeftSidebarItem {
                id: item.id.to_string(),
                name: item.name.clone(),
                target: item.target.clone(),
                icon: item.icon.map(|value| value.to_string()),
            })
            .collect::<Vec<_>>(),
        rsb_items: if blog.has_plus_features {
            blog.rsb_items
                .iter()
                .map(|item| BlogRightSidebarItem {
                    id: item.id.to_string(),
                    primary_text: item.primary_text.clone(),
                    secondary_text: item.secondary_text.clone(),
                    target: item.target.clone(),
                    icon: item.icon.map(|value| value.to_string()),
                })
                .collect::<Vec<_>>()
        } else {
            Vec::new()
        },
        // Flags
        is_owner: blog.is_owner,
        is_editor: blog.is_editor,
        is_writer: blog.is_writer,
        is_following: blog.is_following,
        is_external: if !blog.has_plus_features {
            false
        } else {
            blog.is_external
        },
        has_plus_features: blog.has_plus_features,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::test_grpc_service;
    use sqlx::PgPool;
    use tonic::{
        Code,
        Request,
    };

    #[sqlx::test(fixtures("get_blog"))]
    async fn should_not_return_plus_features_for_a_regular_blog(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: 5_i64.to_string(),
                        current_user_id: None,
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should include plus features initially.
                assert!(response.banner_id.is_some());
                assert!(response.banner_hex.is_some());

                assert!(response.newsletter_splash_id.is_some());
                assert!(response.newsletter_splash_hex.is_some());

                assert!(response.font_primary.is_some());
                assert!(response.font_secondary.is_some());
                assert!(response.font_code.is_some());

                assert!(response.hide_storiny_branding);
                assert!(response.is_external);

                assert_eq!(response.rsb_items.len(), 2);

                // Downgrade the blog.
                let result = sqlx::query(
                    r#"
UPDATE blogs
SET has_plus_features = FALSE
WHERE id = $1
"#,
                )
                .bind(5_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: 5_i64.to_string(),
                        current_user_id: None,
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should not include plus features.
                assert!(response.banner_id.is_none());
                assert!(response.banner_hex.is_none());

                assert!(response.newsletter_splash_id.is_none());
                assert!(response.newsletter_splash_hex.is_none());

                assert!(response.font_primary.is_none());
                assert!(response.font_secondary.is_none());
                assert!(response.font_code.is_none());

                assert!(!response.hide_storiny_branding);
                assert!(!response.is_external);

                assert!(response.rsb_items.is_empty());
            }),
        )
        .await;
    }

    // Logged-out

    #[sqlx::test(fixtures("get_blog"))]
    async fn can_return_a_blog_by_id(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: 5_i64.to_string(),
                        current_user_id: None,
                    }))
                    .await;

                assert!(response.is_ok());

                let response = response.unwrap().into_inner();

                // Flags should be neutral.
                assert!(!response.is_owner);
                assert!(!response.is_editor);
                assert!(!response.is_writer);
                assert!(!response.is_following);

                // Sidebar items
                assert_eq!(response.lsb_items.len(), 2);
                assert_eq!(response.rsb_items.len(), 2);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog"))]
    async fn should_not_return_a_soft_deleted_blog_by_id(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                // Soft-delete the blog.
                let result = sqlx::query(
                    r#"
UPDATE blogs
SET deleted_at = NOW()
WHERE id = $1
"#,
                )
                .bind(5_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: 5_i64.to_string(),
                        current_user_id: None,
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    //

    #[sqlx::test(fixtures("get_blog"))]
    async fn can_return_a_blog_by_slug(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: "test-blog".to_string(),
                        current_user_id: None,
                    }))
                    .await;

                assert!(response.is_ok());

                let response = response.unwrap().into_inner();

                // Flags should be neutral.
                assert!(!response.is_owner);
                assert!(!response.is_editor);
                assert!(!response.is_writer);
                assert!(!response.is_following);

                // Sidebar items
                assert_eq!(response.lsb_items.len(), 2);
                assert_eq!(response.rsb_items.len(), 2);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog"))]
    async fn should_not_return_a_soft_deleted_blog_by_slug(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                // Soft-delete the blog.
                let result = sqlx::query(
                    r#"
UPDATE blogs
SET deleted_at = NOW()
WHERE id = $1
"#,
                )
                .bind(5_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: "test-blog".to_string(),
                        current_user_id: None,
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    //

    #[sqlx::test(fixtures("get_blog"))]
    async fn can_return_a_blog_by_domain(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: "test.com".to_string(),
                        current_user_id: None,
                    }))
                    .await;

                assert!(response.is_ok());

                let response = response.unwrap().into_inner();

                // Flags should be neutral.
                assert!(!response.is_owner);
                assert!(!response.is_editor);
                assert!(!response.is_writer);
                assert!(!response.is_following);

                // Sidebar items
                assert_eq!(response.lsb_items.len(), 2);
                assert_eq!(response.rsb_items.len(), 2);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog"))]
    async fn should_not_return_a_soft_deleted_blog_by_domain(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                // Soft-delete the blog.
                let result = sqlx::query(
                    r#"
UPDATE blogs
SET deleted_at = NOW()
WHERE id = $1
"#,
                )
                .bind(5_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: "test.com".to_string(),
                        current_user_id: None,
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    // Logged-in

    #[sqlx::test(fixtures("get_blog"))]
    async fn can_return_a_blog_by_id_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, _, _, user_id| async move {
                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: 5_i64.to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await;

                assert!(response.is_ok());

                let response = response.unwrap().into_inner();

                // Flags should be neutral.
                assert!(!response.is_owner);
                assert!(!response.is_editor);
                assert!(!response.is_writer);
                assert!(!response.is_following);

                // Sidebar items
                assert_eq!(response.lsb_items.len(), 2);
                assert_eq!(response.rsb_items.len(), 2);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog"))]
    async fn should_not_return_a_soft_deleted_blog_by_id_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Soft-delete the blog.
                let result = sqlx::query(
                    r#"
UPDATE blogs
SET deleted_at = NOW()
WHERE id = $1
"#,
                )
                .bind(5_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: 5_i64.to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    //

    #[sqlx::test(fixtures("get_blog"))]
    async fn can_return_is_owner_flag_for_blog_by_id_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: 5_i64.to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `false` initially.
                assert!(!response.is_owner);

                // Change the owner of the blog.
                let result = sqlx::query(
                    r#"
UPDATE blogs
SET user_id = $1
WHERE id = $2
"#,
                )
                .bind(user_id.unwrap())
                .bind(5_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: 5_i64.to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `true`.
                assert!(response.is_owner);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog"))]
    async fn can_return_is_editor_flag_for_blog_by_id_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: 5_i64.to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `false` initially.
                assert!(!response.is_editor);

                // Receive an editor invite.
                let result = sqlx::query(
                    r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
                )
                .bind(user_id.unwrap())
                .bind(5_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: 5_i64.to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should still be false as the editor invite has not been not accepted yet.
                assert!(!response.is_editor);

                // Accept the editor invite.
                let result = sqlx::query(
                    r#"
UPDATE blog_editors
SET accepted_at = NOW()
WHERE user_id = $1
"#,
                )
                .bind(user_id.unwrap())
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: 5_i64.to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `true`.
                assert!(response.is_editor);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog"))]
    async fn can_return_is_writer_flag_for_blog_by_id_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: 5_i64.to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `false` initially.
                assert!(!response.is_writer);

                // Receive a writer invite.
                let result = sqlx::query(
                    r#"
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES ($1, $2, $3)
"#,
                )
                .bind(2_i64)
                .bind(user_id.unwrap())
                .bind(5_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: 5_i64.to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should still be false as the writer invite has not been not accepted yet.
                assert!(!response.is_writer);

                // Accept the writer invite.
                let result = sqlx::query(
                    r#"
UPDATE blog_writers
SET accepted_at = NOW()
WHERE receiver_id = $1
"#,
                )
                .bind(user_id.unwrap())
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: 5_i64.to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `true`.
                assert!(response.is_writer);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog"))]
    async fn can_return_is_following_flag_for_blog_by_id_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: 5_i64.to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `false` initially.
                assert!(!response.is_following);

                // Follow the blog.
                let result = sqlx::query(
                    r#"
INSERT INTO blog_followers (user_id, blog_id)
VALUES ($1, $2)
"#,
                )
                .bind(user_id.unwrap())
                .bind(5_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: 5_i64.to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `true`.
                assert!(response.is_following);
            }),
        )
        .await;
    }

    //

    #[sqlx::test(fixtures("get_blog"))]
    async fn can_return_a_blog_by_slug_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, _, _, user_id| async move {
                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: "test-blog".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await;

                assert!(response.is_ok());

                let response = response.unwrap().into_inner();

                // Flags should be neutral.
                assert!(!response.is_owner);
                assert!(!response.is_editor);
                assert!(!response.is_writer);
                assert!(!response.is_following);

                // Sidebar items
                assert_eq!(response.lsb_items.len(), 2);
                assert_eq!(response.rsb_items.len(), 2);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog"))]
    async fn should_not_return_a_soft_deleted_blog_by_slug_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Soft-delete the blog.
                let result = sqlx::query(
                    r#"
UPDATE blogs
SET deleted_at = NOW()
WHERE id = $1
"#,
                )
                .bind(5_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: "test-blog".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    //

    #[sqlx::test(fixtures("get_blog"))]
    async fn can_return_is_owner_flag_for_blog_by_slug_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: "test-blog".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `false` initially.
                assert!(!response.is_owner);

                // Change the owner of the blog.
                let result = sqlx::query(
                    r#"
UPDATE blogs
SET user_id = $1
WHERE id = $2
"#,
                )
                .bind(user_id.unwrap())
                .bind(5_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: "test-blog".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `true`.
                assert!(response.is_owner);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog"))]
    async fn can_return_is_editor_flag_for_blog_by_slug_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: "test-blog".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `false` initially.
                assert!(!response.is_editor);

                // Receive an editor invite.
                let result = sqlx::query(
                    r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
                )
                .bind(user_id.unwrap())
                .bind(5_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: "test-blog".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should still be false as the editor invite has not been not accepted yet.
                assert!(!response.is_editor);

                // Accept the editor invite.
                let result = sqlx::query(
                    r#"
UPDATE blog_editors
SET accepted_at = NOW()
WHERE user_id = $1
"#,
                )
                .bind(user_id.unwrap())
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: "test-blog".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `true`.
                assert!(response.is_editor);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog"))]
    async fn can_return_is_writer_flag_for_blog_by_slug_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: "test-blog".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `false` initially.
                assert!(!response.is_writer);

                // Receive a writer invite.
                let result = sqlx::query(
                    r#"
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES ($1, $2, $3)
"#,
                )
                .bind(2_i64)
                .bind(user_id.unwrap())
                .bind(5_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: "test-blog".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should still be false as the writer invite has not been not accepted yet.
                assert!(!response.is_writer);

                // Accept the writer invite.
                let result = sqlx::query(
                    r#"
UPDATE blog_writers
SET accepted_at = NOW()
WHERE receiver_id = $1
"#,
                )
                .bind(user_id.unwrap())
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: "test-blog".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `true`.
                assert!(response.is_writer);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog"))]
    async fn can_return_is_following_flag_for_blog_by_slug_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: "test-blog".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `false` initially.
                assert!(!response.is_following);

                // Follow the blog.
                let result = sqlx::query(
                    r#"
INSERT INTO blog_followers (user_id, blog_id)
VALUES ($1, $2)
"#,
                )
                .bind(user_id.unwrap())
                .bind(5_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: "test-blog".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `true`.
                assert!(response.is_following);
            }),
        )
        .await;
    }

    //

    #[sqlx::test(fixtures("get_blog"))]
    async fn can_return_a_blog_by_domain_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, _, _, user_id| async move {
                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: "test.com".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await;

                assert!(response.is_ok());

                let response = response.unwrap().into_inner();

                // Flags should be neutral.
                assert!(!response.is_owner);
                assert!(!response.is_editor);
                assert!(!response.is_writer);
                assert!(!response.is_following);

                // Sidebar items
                assert_eq!(response.lsb_items.len(), 2);
                assert_eq!(response.rsb_items.len(), 2);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog"))]
    async fn should_not_return_a_soft_deleted_blog_by_domain_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Soft-delete the blog.
                let result = sqlx::query(
                    r#"
UPDATE blogs
SET deleted_at = NOW()
WHERE id = $1
"#,
                )
                .bind(5_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: "test.com".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    //

    #[sqlx::test(fixtures("get_blog"))]
    async fn can_return_is_owner_flag_for_blog_by_domain_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: "test.com".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `false` initially.
                assert!(!response.is_owner);

                // Change the owner of the blog.
                let result = sqlx::query(
                    r#"
UPDATE blogs
SET user_id = $1
WHERE id = $2
"#,
                )
                .bind(user_id.unwrap())
                .bind(5_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: "test.com".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `true`.
                assert!(response.is_owner);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog"))]
    async fn can_return_is_editor_flag_for_blog_by_domain_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: "test.com".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `false` initially.
                assert!(!response.is_editor);

                // Receive an editor invite.
                let result = sqlx::query(
                    r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
                )
                .bind(user_id.unwrap())
                .bind(5_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: "test.com".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should still be false as the editor invite has not been not accepted yet.
                assert!(!response.is_editor);

                // Accept the editor invite.
                let result = sqlx::query(
                    r#"
UPDATE blog_editors
SET accepted_at = NOW()
WHERE user_id = $1
"#,
                )
                .bind(user_id.unwrap())
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: "test.com".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `true`.
                assert!(response.is_editor);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog"))]
    async fn can_return_is_writer_flag_for_blog_by_domain_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: "test.com".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `false` initially.
                assert!(!response.is_writer);

                // Receive a writer invite.
                let result = sqlx::query(
                    r#"
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES ($1, $2, $3)
"#,
                )
                .bind(2_i64)
                .bind(user_id.unwrap())
                .bind(5_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: "test.com".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should still be false as the writer invite has not been not accepted yet.
                assert!(!response.is_writer);

                // Accept the writer invite.
                let result = sqlx::query(
                    r#"
UPDATE blog_writers
SET accepted_at = NOW()
WHERE receiver_id = $1
"#,
                )
                .bind(user_id.unwrap())
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: "test.com".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `true`.
                assert!(response.is_writer);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog"))]
    async fn can_return_is_following_flag_for_blog_by_domain_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: "test.com".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `false` initially.
                assert!(!response.is_following);

                // Follow the blog.
                let result = sqlx::query(
                    r#"
INSERT INTO blog_followers (user_id, blog_id)
VALUES ($1, $2)
"#,
                )
                .bind(user_id.unwrap())
                .bind(5_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_blog(Request::new(GetBlogRequest {
                        identifier: "test.com".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `true`.
                assert!(response.is_following);
            }),
        )
        .await;
    }
}
