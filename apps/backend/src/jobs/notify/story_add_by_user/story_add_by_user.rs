use crate::{
    constants::notification_entity_type::NotificationEntityType,
    jobs::init::SharedJobState,
};
use apalis::prelude::*;
use serde::{
    Deserialize,
    Serialize,
};
use std::sync::Arc;
use tracing::debug;

pub const NOTIFY_STORY_ADD_BY_USER_JOB_NAME: &str = "j:n:story_add_by_user";

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct NotifyStoryAddByUserJob {
    /// The ID of the published story.
    pub story_id: i64,
}

impl Job for NotifyStoryAddByUserJob {
    const NAME: &'static str = NOTIFY_STORY_ADD_BY_USER_JOB_NAME;
}

/// Notifies the followers and friends of the story writer.
#[tracing::instrument(
    name = "JOB notify_story_add_by_user",
    skip_all,
    fields(
        story_id = %job.story_id
    ),
    err
)]
pub async fn notify_story_add_by_user(
    job: NotifyStoryAddByUserJob,
    state: Data<Arc<SharedJobState>>,
) -> Result<(), Error> {
    debug!(
        "attempting to insert notifications for story with ID `{}`",
        job.story_id
    );

    let result = sqlx::query(
        r#"
WITH published_story AS (
    SELECT s.user_id, u.is_private
    FROM stories s
        INNER JOIN users u
            ON u.id = s.user_id
    WHERE
        s.id = $1
        AND s.published_at IS NOT NULL
        AND s.deleted_at IS NULL
),
inserted_notification AS (
    INSERT INTO notifications (entity_type, entity_id, notifier_id)
    SELECT $2, $1, (SELECT user_id FROM published_story)
    WHERE EXISTS (SELECT 1 FROM published_story)
    RETURNING id
)
INSERT INTO
    notification_outs (notified_id, notification_id)
SELECT
    target_id, (SELECT id FROM inserted_notification)
FROM
    (
        -- Friends
        SELECT
            CASE
                WHEN f.receiver_id = (SELECT user_id FROM published_story)
                    THEN f.transmitter_id
                ELSE f.receiver_id
            END AS "target_id"
        FROM
            friends f
        WHERE
            (
                f.transmitter_id = (SELECT user_id FROM published_story)
            OR
                f.receiver_id = (SELECT user_id FROM published_story)
            )
            AND f.deleted_at IS NULL
            AND f.accepted_at IS NOT NULL
        UNION
        -- Followers
        SELECT r.follower_id as "target_id"
        FROM relations r
        WHERE
              r.followed_id = (SELECT user_id FROM published_story)
          AND r.deleted_at IS NULL
          AND r.subscribed_at IS NOT NULL
          -- Handle private writer
          AND (SELECT is_private FROM published_story) IS NOT TRUE
    ) AS user_relations
WHERE EXISTS (SELECT 1 FROM published_story)
"#,
    )
    .bind(job.story_id)
    .bind(NotificationEntityType::StoryAddByUser as i16)
    .execute(&state.db_pool)
    .await
    .map_err(Box::new)
    .map_err(|err| Error::Failed(err))?;

    debug!(
        "inserted `{}` notifications for story with ID `{}`",
        result.rows_affected(),
        job.story_id
    );

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::get_job_state_for_test;
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test(fixtures("story_add_by_user"))]
    async fn can_notify_story_add_by_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let state = get_job_state_for_test(pool, None).await;
        let result =
            notify_story_add_by_user(NotifyStoryAddByUserJob { story_id: 4_i64 }, state).await;

        assert!(result.is_ok());

        // Notifications should be present in the database.
        let result = sqlx::query(
            r#"
WITH notification AS (
    SELECT id FROM notifications
    WHERE entity_id = $1 AND entity_type = $2
)
SELECT 1 FROM notification_outs
WHERE notification_id = (
    (SELECT id FROM notification)
)
"#,
        )
        .bind(4_i64)
        .bind(NotificationEntityType::StoryAddByUser as i16)
        .fetch_all(&mut *conn)
        .await?;

        assert_eq!(result.len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("story_add_by_user"))]
    async fn should_not_notify_followers_for_a_private_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let state = get_job_state_for_test(pool, None).await;

        // Make the user private.
        let result = sqlx::query(
            r#"
WITH deleted_friends AS (
    DELETE FROM friends
    WHERE
        receiver_id = $1
        OR transmitter_id = $1
)
UPDATE users
SET is_private = TRUE
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let result =
            notify_story_add_by_user(NotifyStoryAddByUserJob { story_id: 4_i64 }, state).await;

        assert!(result.is_ok());

        // Notifications should not be present in the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM notification_outs n_out
        INNER JOIN notifications n
            ON n.id = n_out.notification_id
            AND n.entity_id = $1
)
"#,
        )
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("story_add_by_user"))]
    async fn should_not_notify_story_add_by_user_for_an_unpublished_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let state = get_job_state_for_test(pool, None).await;

        // Unpublish the story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let result =
            notify_story_add_by_user(NotifyStoryAddByUserJob { story_id: 4_i64 }, state).await;

        assert!(result.is_ok());

        // Notifications should not be present in the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM notifications
    WHERE entity_id = $1
)
"#,
        )
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("story_add_by_user"))]
    async fn should_not_notify_story_add_by_user_for_a_soft_deleted_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let state = get_job_state_for_test(pool, None).await;

        // Soft-delete the story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let result =
            notify_story_add_by_user(NotifyStoryAddByUserJob { story_id: 4_i64 }, state).await;

        assert!(result.is_ok());

        // Notifications should not be present in the database.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM notifications
    WHERE entity_id = $1
)
"#,
        )
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }
}
