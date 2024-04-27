use crate::{
    amqp::init::SharedQueueState,
    constants::notification_entity_type::NotificationEntityType,
    LapinPool,
};
use anyhow::anyhow;
use deadpool_lapin::lapin::{
    options::{
        BasicAckOptions,
        BasicConsumeOptions,
        QueueDeclareOptions,
    },
    types::FieldTable,
};
use futures_util::TryStreamExt;
use serde::{
    Deserialize,
    Serialize,
};
use std::sync::Arc;
use tracing::debug;

pub const NOTIFY_STORY_ADD_QUEUE_NAME: &str = "notify_story_add";

/// The source of the action. If the source is [StoryAddSource::User], the followers and friends of
/// the story writer will be notified. If the source is [StoryAddSource::Tag], the followers of all
/// the tags associated with the story will be notified.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StoryAddSource {
    /// Notify all the followers and friends of the story writer.
    User,
    /// Notify all the followers of the tags associated with the story.
    Tag,
}

/// The queue message to send a story add notification message.
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct NotifyStoryAddMessage {
    /// The ID of the published story.
    pub story_id: i64,
    /// The source of the action.
    pub source: StoryAddSource,
}

/// Notifies all the users related to the story based on the [StoryAddSource] variant.
///
/// * `lapin` - The lapin pool.
/// * `state` - The shared queue state.
#[tracing::instrument(name = "AMQP notify_story_add_consumer", skip_all, err)]
pub async fn notify_story_add_consumer(
    lapin: LapinPool,
    state: Arc<SharedQueueState>,
) -> anyhow::Result<()> {
    let conn = lapin.get().await?;
    let channel = conn.create_channel().await?;

    let _queue = channel
        .queue_declare(
            NOTIFY_STORY_ADD_QUEUE_NAME,
            QueueDeclareOptions {
                passive: false,
                durable: true,
                exclusive: false,
                auto_delete: false,
                nowait: false,
            },
            FieldTable::default(),
        )
        .await?;

    let mut consumer = channel
        .basic_consume(
            NOTIFY_STORY_ADD_QUEUE_NAME,
            "",
            BasicConsumeOptions::default(),
            FieldTable::default(),
        )
        .await?;

    tokio::spawn(async move {
        while let Ok(Some(delivery)) = consumer.try_next().await {
            let state = state.clone();

            tokio::spawn(async move {
                let data = serde_json::from_slice::<NotifyStoryAddMessage>(&delivery.data)
                    .map_err(|err| anyhow!("failed to deserialize the message: {err:?}"))?;

                debug!(
                    "attempting to insert notifications for story with ID `{}` and source `{:?}`",
                    data.story_id, data.source
                );

                match data.source {
                    StoryAddSource::User => {
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
                        .bind(data.story_id)
                        .bind(NotificationEntityType::StoryAddByUser as i16)
                        .execute(&state.db_pool)
                        .await
                        .map_err(|err| anyhow!("database error: {err:?}"))?;

                        debug!(
                            "inserted `{}` notifications for story with ID `{}`",
                            result.rows_affected(),
                            data.story_id
                        );
                    }

                    StoryAddSource::Tag => {
                        let result = sqlx::query(r#"SELECT public.notify_tag_followers($1, $2)"#)
                            .bind(data.story_id)
                            .bind(NotificationEntityType::StoryAddByTag as i16)
                            .execute(&state.db_pool)
                            .await
                            .map_err(|err| anyhow!("database error: {err:?}"))?;

                        debug!(
                            "inserted `{}` notifications for story with ID `{}`",
                            result.rows_affected(),
                            data.story_id
                        );
                    }
                };

                delivery
                    .ack(BasicAckOptions::default())
                    .await
                    .map_err(|err| anyhow!("failed to send the acknowledgement: {err:?}"))
            });
        }
    });

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        get_lapin_pool,
        get_queue_state_for_test,
    };
    use deadpool_lapin::lapin::{
        options::BasicPublishOptions,
        BasicProperties,
    };
    use sqlx::{
        PgPool,
        Row,
    };
    use std::time::Duration;

    // With user as the source

    #[sqlx::test(fixtures("by_user"))]
    async fn can_notify_story_add_by_user(pool: PgPool) -> sqlx::Result<()> {
        let mut db_conn = pool.acquire().await?;
        let state = get_queue_state_for_test(pool, None).await;
        let lapin = get_lapin_pool();

        notify_story_add_consumer(lapin.clone(), state)
            .await
            .expect("unable to start the consumer");

        let channel = {
            let connection = lapin.get().await.unwrap();
            connection.create_channel().await.unwrap()
        };

        let message = serde_json::to_vec(&NotifyStoryAddMessage {
            story_id: 4_i64,
            source: StoryAddSource::User,
        })
        .expect("unable to build the binary message");

        channel
            .basic_publish(
                "",
                NOTIFY_STORY_ADD_QUEUE_NAME,
                BasicPublishOptions::default(),
                &message,
                BasicProperties::default(),
            )
            .await
            .unwrap();

        tokio::time::sleep(Duration::from_secs(5)).await;

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
        .fetch_all(&mut *db_conn)
        .await?;

        assert_eq!(result.len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("by_user"))]
    async fn should_not_notify_followers_for_a_private_user(pool: PgPool) -> sqlx::Result<()> {
        let mut db_conn = pool.acquire().await?;
        let state = get_queue_state_for_test(pool, None).await;
        let lapin = get_lapin_pool();

        notify_story_add_consumer(lapin.clone(), state)
            .await
            .expect("unable to start the consumer");

        let channel = {
            let connection = lapin.get().await.unwrap();
            connection.create_channel().await.unwrap()
        };

        let message = serde_json::to_vec(&NotifyStoryAddMessage {
            story_id: 4_i64,
            source: StoryAddSource::User,
        })
        .expect("unable to build the binary message");

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
        .execute(&mut *db_conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Send the message.
        channel
            .basic_publish(
                "",
                NOTIFY_STORY_ADD_QUEUE_NAME,
                BasicPublishOptions::default(),
                &message,
                BasicProperties::default(),
            )
            .await
            .unwrap();

        tokio::time::sleep(Duration::from_secs(5)).await;

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
        .fetch_one(&mut *db_conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("by_user"))]
    async fn should_not_notify_story_add_by_user_for_an_unpublished_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut db_conn = pool.acquire().await?;
        let state = get_queue_state_for_test(pool, None).await;
        let lapin = get_lapin_pool();

        notify_story_add_consumer(lapin.clone(), state)
            .await
            .expect("unable to start the consumer");

        let channel = {
            let connection = lapin.get().await.unwrap();
            connection.create_channel().await.unwrap()
        };

        let message = serde_json::to_vec(&NotifyStoryAddMessage {
            story_id: 4_i64,
            source: StoryAddSource::User,
        })
        .expect("unable to build the binary message");

        // Unpublish the story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&mut *db_conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Send the message.
        channel
            .basic_publish(
                "",
                NOTIFY_STORY_ADD_QUEUE_NAME,
                BasicPublishOptions::default(),
                &message,
                BasicProperties::default(),
            )
            .await
            .unwrap();

        tokio::time::sleep(Duration::from_secs(5)).await;

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
        .fetch_one(&mut *db_conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("by_user"))]
    async fn should_not_notify_story_add_by_user_for_a_soft_deleted_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut db_conn = pool.acquire().await?;
        let state = get_queue_state_for_test(pool, None).await;
        let lapin = get_lapin_pool();

        notify_story_add_consumer(lapin.clone(), state)
            .await
            .expect("unable to start the consumer");

        let channel = {
            let connection = lapin.get().await.unwrap();
            connection.create_channel().await.unwrap()
        };

        let message = serde_json::to_vec(&NotifyStoryAddMessage {
            story_id: 4_i64,
            source: StoryAddSource::User,
        })
        .expect("unable to build the binary message");

        // Soft-delete the story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&mut *db_conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Send the message.
        channel
            .basic_publish(
                "",
                NOTIFY_STORY_ADD_QUEUE_NAME,
                BasicPublishOptions::default(),
                &message,
                BasicProperties::default(),
            )
            .await
            .unwrap();

        tokio::time::sleep(Duration::from_secs(5)).await;

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
        .fetch_one(&mut *db_conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    // With tag as the source

    #[sqlx::test(fixtures("by_tag"))]
    async fn can_notify_story_add_by_tag(pool: PgPool) -> sqlx::Result<()> {
        let mut db_conn = pool.acquire().await?;
        let state = get_queue_state_for_test(pool, None).await;
        let lapin = get_lapin_pool();

        notify_story_add_consumer(lapin.clone(), state)
            .await
            .expect("unable to start the consumer");

        let channel = {
            let connection = lapin.get().await.unwrap();
            connection.create_channel().await.unwrap()
        };

        let message = serde_json::to_vec(&NotifyStoryAddMessage {
            story_id: 5_i64,
            source: StoryAddSource::Tag,
        })
        .expect("unable to build the binary message");

        channel
            .basic_publish(
                "",
                NOTIFY_STORY_ADD_QUEUE_NAME,
                BasicPublishOptions::default(),
                &message,
                BasicProperties::default(),
            )
            .await
            .unwrap();

        tokio::time::sleep(Duration::from_secs(5)).await;

        // Notifications should be present in the database.
        let result = sqlx::query(
            r#"
WITH notification AS (
    SELECT id FROM notifications
    WHERE entity_id = $1 AND entity_type = $2
)
SELECT 1 FROM notification_outs
WHERE notification_id = (SELECT id FROM notification)
"#,
        )
        .bind(6_i64)
        .bind(NotificationEntityType::StoryAddByTag as i16)
        .fetch_all(&mut *db_conn)
        .await?;

        assert_eq!(result.len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("by_tag"))]
    async fn should_not_notify_the_publisher_of_the_story(pool: PgPool) -> sqlx::Result<()> {
        let mut db_conn = pool.acquire().await?;
        let state = get_queue_state_for_test(pool, None).await;
        let lapin = get_lapin_pool();

        notify_story_add_consumer(lapin.clone(), state)
            .await
            .expect("unable to start the consumer");

        let channel = {
            let connection = lapin.get().await.unwrap();
            connection.create_channel().await.unwrap()
        };

        let message = serde_json::to_vec(&NotifyStoryAddMessage {
            story_id: 5_i64,
            source: StoryAddSource::Tag,
        })
        .expect("unable to build the binary message");

        // Update the writer of the story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET user_id = $1
WHERE id = $2
"#,
        )
        .bind(2_i64)
        .bind(5_i64)
        .execute(&mut *db_conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Send the message.
        channel
            .basic_publish(
                "",
                NOTIFY_STORY_ADD_QUEUE_NAME,
                BasicPublishOptions::default(),
                &message,
                BasicProperties::default(),
            )
            .await
            .unwrap();

        tokio::time::sleep(Duration::from_secs(5)).await;

        let result = sqlx::query(
            r#"
WITH notification AS (
    SELECT id FROM notifications
    WHERE entity_id = $1 AND entity_type = $2
)
SELECT 1 FROM notification_outs
WHERE notification_id = (SELECT id FROM notification)
"#,
        )
        .bind(6_i64)
        .bind(NotificationEntityType::StoryAddByTag as i16)
        .fetch_all(&mut *db_conn)
        .await?;

        // Should only insert a notification for the user with ID = `3`.
        assert_eq!(result.len(), 1);

        Ok(())
    }
}
