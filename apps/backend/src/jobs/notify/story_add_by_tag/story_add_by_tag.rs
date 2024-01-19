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

pub const NOTIFY_STORY_ADD_BY_TAG_JOB_NAME: &str = "j:n:story_add_by_tag";

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct NotifyStoryAddByTagJob {
    /// The ID of the published story.
    pub story_id: i64,
}

impl Job for NotifyStoryAddByTagJob {
    const NAME: &'static str = NOTIFY_STORY_ADD_BY_TAG_JOB_NAME;
}

/// Notifies the followers of the story tags.
#[tracing::instrument(
    name = "JOB notify_story_add_by_tag",
    skip_all,
    fields(
        story_id = %job.story_id
    ),
    err
)]
pub async fn notify_story_add_by_tag(
    job: NotifyStoryAddByTagJob,
    ctx: JobContext,
) -> Result<(), JobError> {
    debug!(
        "attempting to insert notifications for story with ID `{}`",
        job.story_id
    );

    let state = ctx.data::<Arc<SharedJobState>>()?;
    let result = sqlx::query(r#"SELECT public.notify_tag_followers($1, $2)"#)
        .bind(job.story_id)
        .bind(NotificationEntityType::StoryAddByTag as i16)
        .execute(&state.db_pool)
        .await
        .map_err(Box::new)
        .map_err(|err| JobError::Failed(err))?;

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
    use crate::test_utils::get_job_ctx_for_test;
    use sqlx::PgPool;

    #[sqlx::test(fixtures("story_add_by_tag"))]
    async fn can_notify_story_add_by_tag(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let ctx = get_job_ctx_for_test(pool, None).await;
        let result = notify_story_add_by_tag(NotifyStoryAddByTagJob { story_id: 5_i64 }, ctx).await;

        assert!(result.is_ok());

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
        .fetch_all(&mut *conn)
        .await?;

        assert_eq!(result.len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("story_add_by_tag"))]
    async fn should_not_notify_the_publisher_of_the_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

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
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let ctx = get_job_ctx_for_test(pool, None).await;
        let result = notify_story_add_by_tag(NotifyStoryAddByTagJob { story_id: 5_i64 }, ctx).await;

        assert!(result.is_ok());

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
        .fetch_all(&mut *conn)
        .await?;

        // Should only insert a notification for the user with ID = `3`.
        assert_eq!(result.len(), 1);

        Ok(())
    }
}
