use crate::grpc::{
    defs::notification_settings_def::v1::{
        GetNotificationSettingsRequest,
        GetNotificationSettingsResponse,
    },
    service::GrpcService,
};
use sqlx::Row;
use tonic::{
    Request,
    Response,
    Status,
};
use tracing::error;

/// Returns the notification settings for a user.
#[tracing::instrument(
    name = "GRPC get_notification_settings",
    skip_all,
    fields(
        user_id = tracing::field::Empty
    ),
    err
)]
pub async fn get_notification_settings(
    client: &GrpcService,
    request: Request<GetNotificationSettingsRequest>,
) -> Result<Response<GetNotificationSettingsResponse>, Status> {
    let user_id_str = request.into_inner().user_id;

    tracing::Span::current().record("user_id", &user_id_str);

    let user_id = user_id_str
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`user_id` is invalid"))?;

    let notification_settings = sqlx::query(
        r#"
SELECT
    -- Push
    push_features_and_updates   AS "features_and_updates",
    push_stories                AS "stories",
    push_story_likes            AS "story_likes",
    push_tags                   AS "tags",
    push_comments               AS "comments",
    push_replies                AS "replies",
    push_followers              AS "new_followers",
    push_friend_requests        AS "friend_requests",
    push_collaboration_requests AS "collaboration_requests",
    push_blog_requests          AS "blog_requests",
    -- Mail
    mail_login_activity,
    mail_features_and_updates,
    mail_newsletters,
    mail_suggested_stories    AS "mail_digest"
FROM
    notification_settings
WHERE
    user_id = $1
"#,
    )
    .bind(user_id)
    .fetch_one(&client.db_pool)
    .await
    .map_err(|error| {
        if matches!(error, sqlx::Error::RowNotFound) {
            Status::not_found("Notification settings not found")
        } else {
            error!("database error: {error:?}");

            Status::internal("Database error")
        }
    })?;

    Ok(Response::new(GetNotificationSettingsResponse {
        features_and_updates: notification_settings.get::<bool, _>("features_and_updates"),
        stories: notification_settings.get::<bool, _>("stories"),
        story_likes: notification_settings.get::<bool, _>("story_likes"),
        tags: notification_settings.get::<bool, _>("tags"),
        comments: notification_settings.get::<bool, _>("comments"),
        replies: notification_settings.get::<bool, _>("replies"),
        new_followers: notification_settings.get::<bool, _>("new_followers"),
        friend_requests: notification_settings.get::<bool, _>("friend_requests"),
        collaboration_requests: notification_settings.get::<bool, _>("collaboration_requests"),
        blog_requests: notification_settings.get::<bool, _>("blog_requests"),
        mail_login_activity: notification_settings.get::<bool, _>("mail_login_activity"),
        mail_features_and_updates: notification_settings
            .get::<bool, _>("mail_features_and_updates"),
        mail_newsletters: notification_settings.get::<bool, _>("mail_newsletters"),
        mail_digest: notification_settings.get::<bool, _>("mail_digest"),
    }))
}

#[cfg(test)]
mod tests {
    use crate::{
        grpc::defs::notification_settings_def::v1::{
            GetNotificationSettingsRequest,
            GetNotificationSettingsResponse,
        },
        test_utils::test_grpc_service,
    };
    use sqlx::PgPool;
    use tonic::Request;

    #[sqlx::test]
    async fn can_return_notification_settings(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Update the notification settings.
                let result = sqlx::query(
                    r#"
UPDATE notification_settings
SET
    -- Push
    push_features_and_updates = FALSE,
    push_stories = FALSE,
    push_story_likes = FALSE,
    push_tags = FALSE,
    push_comments = FALSE,
    push_replies = FALSE,
    push_followers = FALSE,
    push_friend_requests = FALSE,
    push_collaboration_requests = FALSE,
    push_blog_requests = FALSE,
    -- Mail
    mail_login_activity = FALSE,
    mail_features_and_updates = FALSE,
    mail_newsletters = FALSE,
    mail_suggested_stories = FALSE
WHERE user_id = $1
"#,
                )
                .bind(user_id.unwrap())
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_notification_settings(Request::new(GetNotificationSettingsRequest {
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(
                    response,
                    GetNotificationSettingsResponse {
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
                        mail_login_activity: false,
                        mail_features_and_updates: false,
                        mail_newsletters: false,
                        mail_digest: false,
                    }
                );
            }),
        )
        .await;
    }
}
