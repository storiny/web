use crate::{
    constants::notification_entity_type::NotificationEntityType,
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
use sqlx::{
    Postgres,
    QueryBuilder,
};
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    // Exclude types < 3 (system types)
    #[validate(range(min = 3, max = 11, message = "Invalid notification type"))]
    r#type: u16,
}

#[patch("/v1/me/settings/notifications/unsubscribe")]
#[tracing::instrument(
    name = "PATCH /v1/me/settings/notifications/unsubscribe",
    skip_all,
    fields(
        user = user.id().ok(),
        r#type = payload.r#type
    ),
    err
)]
async fn patch(
    payload: Json<Request>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let notification_type = NotificationEntityType::try_from(payload.r#type)
        .map_err(|_| AppError::from("Invalid notification type"))?;

    let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
        r#"
UPDATE notification_settings
SET
"#,
    );

    query_builder.push(match notification_type {
        NotificationEntityType::FriendReqAccept | NotificationEntityType::FriendReqReceived => {
            "push_friend_requests"
        }
        NotificationEntityType::CollabReqAccept | NotificationEntityType::CollabReqReceived => {
            "push_collaboration_requests"
        }
        NotificationEntityType::BlogEditorInvite | NotificationEntityType::BlogWriterInvite => {
            "push_blog_requests"
        }
        NotificationEntityType::FollowerAdd => "push_followers",
        NotificationEntityType::CommentAdd => "push_comments",
        NotificationEntityType::ReplyAdd => "push_replies",
        NotificationEntityType::StoryMention => "push_stories",
        NotificationEntityType::StoryLike => "push_story_likes",
        NotificationEntityType::StoryAddByUser => "push_stories",
        NotificationEntityType::StoryAddByTag => "push_stories",
        _ => "",
    });

    query_builder.push(
        r#"
    = FALSE
WHERE user_id = 
"#,
    );

    query_builder.push_bind(user_id);

    match query_builder
        .build()
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
    async fn can_unsubscribe_from_notifications(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // `push_followers` should be TRUE initially.
        let result = sqlx::query(
            r#"
SELECT push_followers
FROM notification_settings
WHERE user_id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("push_followers"));

        // Unsubscribe from `push_followers`.
        let req = test::TestRequest::patch()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/settings/notifications/unsubscribe")
            .set_json(Request {
                r#type: NotificationEntityType::FollowerAdd as u16,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // `push_followers` should be FALSE.
        let result = sqlx::query(
            r#"
SELECT push_followers
FROM notification_settings
WHERE user_id = $1
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("push_followers"));

        Ok(())
    }
}
