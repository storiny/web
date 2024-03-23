use crate::{
    error::AppError,
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
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    features_and_updates: bool,
    stories: bool,
    story_likes: bool,
    tags: bool,
    comments: bool,
    replies: bool,
    new_followers: bool,
    friend_requests: bool,
    collaboration_requests: bool,
    blog_requests: bool,
}

#[patch("/v1/me/settings/notifications/site")]
#[tracing::instrument(
    name = "PATCH /v1/me/settings/notifications/site",
    skip_all,
    fields(
        user = user.id().ok(),
        payload
    ),
    err
)]
async fn patch(
    payload: Json<Request>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;

    match sqlx::query(
        r#"
UPDATE notification_settings
SET
    push_features_and_updates = $2,
    push_stories = $3,
    push_story_likes = $4,
    push_tags = $5,
    push_comments = $6,
    push_replies = $7,
    push_followers = $8,
    push_friend_requests = $9,
    push_collaboration_requests = $10,
    push_blog_requests = $11
WHERE user_id = $1
"#,
    )
    .bind(user_id)
    .bind(payload.features_and_updates)
    .bind(payload.stories)
    .bind(payload.story_likes)
    .bind(payload.tags)
    .bind(payload.comments)
    .bind(payload.replies)
    .bind(payload.new_followers)
    .bind(payload.friend_requests)
    .bind(payload.collaboration_requests)
    .bind(payload.blog_requests)
    .execute(&data.db_pool)
    .await?
    .rows_affected()
    {
        0 => Err(AppError::InternalError(
            "unable to find a matching row in `notification_settings` table for the user"
                .to_string(),
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
    use crate::test_utils::init_app_for_test;
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test]
    async fn can_set_site_notification_settings(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Disable all site notifications.
        let req = test::TestRequest::patch()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/settings/notifications/site")
            .set_json(Request {
                features_and_updates: false,
                stories: false,
                story_likes: false,
                tags: false,
                comments: false,
                replies: false,
                new_followers: false,
                friend_requests: false,
                collaboration_requests: false,
                blog_requests: false,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Notification settings should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT
    push_features_and_updates,
    push_stories,
    push_story_likes,
    push_tags,
    push_comments,
    push_replies,
    push_followers,
    push_friend_requests,
    push_collaboration_requests,
    push_blog_requests
FROM notification_settings
WHERE user_id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("push_features_and_updates"));
        assert!(!result.get::<bool, _>("push_stories"));
        assert!(!result.get::<bool, _>("push_story_likes"));
        assert!(!result.get::<bool, _>("push_tags"));
        assert!(!result.get::<bool, _>("push_comments"));
        assert!(!result.get::<bool, _>("push_replies"));
        assert!(!result.get::<bool, _>("push_followers"));
        assert!(!result.get::<bool, _>("push_friend_requests"));
        assert!(!result.get::<bool, _>("push_collaboration_requests"));
        assert!(!result.get::<bool, _>("push_blog_requests"));

        // Enable all the site notifications.
        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/notifications/site")
            .set_json(Request {
                features_and_updates: true,
                stories: true,
                story_likes: true,
                tags: true,
                comments: true,
                replies: true,
                new_followers: true,
                friend_requests: true,
                collaboration_requests: true,
                blog_requests: true,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Notification settings should get updated in the database.
        let result = sqlx::query(
            r#"
SELECT
    push_features_and_updates,
    push_stories,
    push_story_likes,
    push_tags,
    push_comments,
    push_replies,
    push_followers,
    push_friend_requests,
    push_collaboration_requests,
    push_blog_requests
FROM notification_settings
WHERE user_id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("push_features_and_updates"));
        assert!(result.get::<bool, _>("push_stories"));
        assert!(result.get::<bool, _>("push_story_likes"));
        assert!(result.get::<bool, _>("push_tags"));
        assert!(result.get::<bool, _>("push_comments"));
        assert!(result.get::<bool, _>("push_replies"));
        assert!(result.get::<bool, _>("push_followers"));
        assert!(result.get::<bool, _>("push_friend_requests"));
        assert!(result.get::<bool, _>("push_collaboration_requests"));
        assert!(result.get::<bool, _>("push_blog_requests"));

        Ok(())
    }
}
