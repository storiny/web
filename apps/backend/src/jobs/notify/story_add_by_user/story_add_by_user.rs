use crate::{
    jobs::init::SharedJobState,
    models::notification::NotificationEntityType,
};
use apalis::prelude::*;
use serde::{
    Deserialize,
    Serialize,
};
use std::sync::Arc;

#[derive(Debug, Deserialize, Serialize)]
pub struct NotifyStoryAddByUserJob {
    /// The ID of the published story.
    pub story_id: i64,
}

impl Job for NotifyStoryAddByUserJob {
    const NAME: &'static str = "j:n:story_add_by_user";
}

/// Notifies the followers and friends of the story writer.
pub async fn notify_story_add_by_user(
    job: NotifyStoryAddByUserJob,
    ctx: JobContext,
) -> Result<(), JobError> {
    log::info!(
        "Attempting to insert notifications for story with ID `{}`",
        job.story_id
    );

    panic!("running----");

    let state = ctx.data::<Arc<SharedJobState>>()?;
    let result = sqlx::query(
        r#"
        WITH
            published_story AS (
                SELECT
                    user_id
                FROM
                    stories
                WHERE
                    id = $1
                    AND published_at IS NOT NULL
                    AND deleted_at IS NULL
            ),
            inserted_notification AS (
                INSERT INTO notifications (entity_type, entity_id, notifier_id)
                    VALUES ($2, $1, (SELECT user_id FROM published_story))
                    RETURNING id
            )
        INSERT
        INTO
            notification_outs (notified_id, notification_id)
        SELECT
            target_id,
            (SELECT id FROM inserted_notification)
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
                     f.transmitter_id = (SELECT user_id FROM published_story)
                  OR f.receiver_id = (SELECT user_id FROM published_story)
                         AND f.deleted_at IS NULL
                         AND f.accepted_at IS NOT NULL
                UNION
                -- Followers
                SELECT
                    r.follower_id as "target_id"
                FROM
                    relations r
                WHERE
                      r.followed_id = (SELECT user_id FROM published_story)
                  AND r.deleted_at IS NULL
                  AND r.subscribed_at IS NOT NULL
            ) AS user_relations
        WHERE
            EXISTS (SELECT 1 FROM published_story)
        "#,
    )
    .bind(&job.story_id)
    .bind(NotificationEntityType::StoryAddByUser as i16)
    .execute(&state.db_pool)
    .await
    .map_err(|err| JobError::Failed(Box::new(err)))?;

    log::info!(
        "Inserted `{}` notifications for story with ID `{}`",
        result.rows_affected(),
        job.story_id
    );

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::init_job_for_test;
    use sqlx::PgPool;

    #[sqlx::test(fixtures("story_add_by_user"))]
    async fn can_notify_story_add_by_user(pool: PgPool) -> sqlx::Result<()> {
        let mut storage = init_job_for_test(pool).await;
        let job_id = storage
            .push(NotifyStoryAddByUserJob { story_id: 4_i64 })
            .await
            .unwrap();

        loop {
            if storage
                .fetch_by_id(&job_id)
                .await
                .unwrap()
                .expect("Job not found")
                .status()
                != &JobState::Pending
            {
                break;
            }
        }

        panic!(
            "{:#?}",
            storage
                .fetch_by_id(&job_id)
                .await
                .unwrap()
                .expect("Job not found")
                .status()
        );

        Ok(())
    }
}
