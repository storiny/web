use crate::cron::init::SharedCronJobState;
use apalis::prelude::*;
use chrono::{
    DateTime,
    Utc,
};
use futures::future;
use sqlx::{
    Pool,
    Postgres,
};
use std::sync::Arc;
use tracing::{
    debug,
    info,
    trace,
};

pub const CLEANUP_DB_JOB_NAME: &str = "j:cleanup:db";

#[allow(dead_code)]
#[derive(Debug, Clone)]
pub struct DatabaseCleanupJob(DateTime<Utc>);

impl From<DateTime<Utc>> for DatabaseCleanupJob {
    fn from(dt: DateTime<Utc>) -> Self {
        DatabaseCleanupJob(dt)
    }
}

impl Job for DatabaseCleanupJob {
    const NAME: &'static str = CLEANUP_DB_JOB_NAME;
}

/// Cleans the `users` table based on the conditions specified in [cleanup_db].
///
/// * `db_pool` - The Postgres connection pool.
#[tracing::instrument(skip_all, err)]
async fn clean_users(db_pool: &Pool<Postgres>) -> Result<(), Error> {
    trace!("attempting to clean the `users` table...");

    let delete_users_result = sqlx::query(
        r#"
DELETE FROM users
WHERE
    deleted_at IS NOT NULL
    AND deleted_at <  NOW() - INTERVAL '30 days'
"#,
    )
    .execute(db_pool)
    .await
    .map_err(|err| Box::from(err.to_string()))
    .map_err(Error::Failed)?;

    debug!(
        "deleted {} rows from the `users` table",
        delete_users_result.rows_affected()
    );

    Ok(())
}

/// Cleans the `stories` table based on the conditions specified in [cleanup_db].
///
/// * `db_pool` - The Postgres connection pool.
#[tracing::instrument(skip_all, err)]
async fn clean_stories(db_pool: &Pool<Postgres>) -> Result<(), Error> {
    trace!("attempting to clean the `stories` table...");

    let delete_stories_result = sqlx::query(
        r#"
DELETE
FROM
    stories s
USING users u
WHERE
      s.user_id = u.id
  AND s.deleted_at IS NOT NULL
  AND s.deleted_at < NOW() - INTERVAL '30 days'
  -- Ignore stories that were soft-deleted due to the user being soft-deleted/deactivated.
  AND u.deleted_at IS NULL
  AND u.deactivated_at IS NULL
"#,
    )
    .execute(db_pool)
    .await
    .map_err(|err| Box::from(err.to_string()))
    .map_err(Error::Failed)?;

    debug!(
        "deleted {} rows from the `stories` table",
        delete_stories_result.rows_affected()
    );

    Ok(())
}

/// Cleans the `tokens` table based on the conditions specified in [cleanup_db].
///
/// * `db_pool` - The Postgres connection pool.
#[tracing::instrument(skip_all, err)]
async fn clean_tokens(db_pool: &Pool<Postgres>) -> Result<(), Error> {
    trace!("attempting to clean the `tokens` table...");

    let delete_tokens_result = sqlx::query(
        r#"
DELETE FROM tokens
WHERE expires_at < NOW()
"#,
    )
    .execute(db_pool)
    .await
    .map_err(|err| Box::from(err.to_string()))
    .map_err(Error::Failed)?;

    debug!(
        "deleted {} rows from the `tokens` table",
        delete_tokens_result.rows_affected()
    );

    Ok(())
}

/// Cleans the `newsletter_tokens` table based on the conditions specified in [cleanup_db].
///
/// * `db_pool` - The Postgres connection pool.
#[tracing::instrument(skip_all, err)]
async fn clean_newsletter_tokens(db_pool: &Pool<Postgres>) -> Result<(), Error> {
    trace!("attempting to clean the `newsletter_tokens` table...");

    let delete_tokens_result = sqlx::query(
        r#"
DELETE FROM newsletter_tokens
WHERE expires_at < NOW()
"#,
    )
    .execute(db_pool)
    .await
    .map_err(|err| Box::from(err.to_string()))
    .map_err(Error::Failed)?;

    debug!(
        "deleted {} rows from the `newsletter_tokens` table",
        delete_tokens_result.rows_affected()
    );

    Ok(())
}

/// Cleans the `user_statuses` table based on the conditions specified in [cleanup_db].
///
/// * `db_pool` - The Postgres connection pool.
#[tracing::instrument(skip_all, err)]
async fn clean_user_statuses(db_pool: &Pool<Postgres>) -> Result<(), Error> {
    trace!("attempting to clean the `user_statuses` table...");

    let delete_tokens_result = sqlx::query(
        r#"
DELETE FROM user_statuses
WHERE
    expires_at IS NOT NULL 
    AND expires_at < NOW()
"#,
    )
    .execute(db_pool)
    .await
    .map_err(|err| Box::from(err.to_string()))
    .map_err(Error::Failed)?;

    debug!(
        "deleted {} rows from the `user_statuses` table",
        delete_tokens_result.rows_affected()
    );

    Ok(())
}

/// Cleans the `notifications` table based on the conditions specified in [cleanup_db].
///
/// * `db_pool` - The Postgres connection pool.
#[tracing::instrument(skip_all, err)]
async fn clean_notifications(db_pool: &Pool<Postgres>) -> Result<(), Error> {
    trace!("attempting to clean the `notifications` table...");

    let delete_notifications_result = sqlx::query(
        r#"
DELETE FROM notifications n
WHERE NOT EXISTS (
    SELECT 1 FROM notification_outs nu
    WHERE nu.notification_id = n.id
    LIMIT 1
)
"#,
    )
    .execute(db_pool)
    .await
    .map_err(|err| Box::from(err.to_string()))
    .map_err(Error::Failed)?;

    debug!(
        "deleted {} rows from the `notifications` table",
        delete_notifications_result.rows_affected()
    );

    Ok(())
}

/// Deletes stale rows from the database based on the following procedure:
///
/// - Users who have been marked as deleted for more than 30 days will be permanently deleted. All
///   the relations that the user holds such as stories and comments will also get permanently
///   deleted from the database.
///
/// - Stories (including drafts) that have been marked as deleted for more than 30 days will be
///   permanently deleted. This would also permanently delete the relations that the story holds;
///   such as likes, comments, and replies.
///
/// - Expired tokens, newsletter tokens, and user statuses (based on the `expires_at` column) will
///   be permanently deleted.
///
/// - Notifications that do not have any related row in `notification_outs` table will be
///   permanently deleted.
#[tracing::instrument(name = "JOB cleanup_db", skip_all, err)]
pub async fn cleanup_db(
    _: DatabaseCleanupJob,
    state: Data<Arc<SharedCronJobState>>,
) -> Result<(), Error> {
    info!("starting database cleanup");

    let db_pool = &state.db_pool;

    // The `users` table must be cleaned before any other table (for cascade refs).
    clean_users(db_pool).await?;

    // These can be run in parallel as they do not depend on each other.
    future::try_join4(
        clean_stories(db_pool),
        clean_tokens(db_pool),
        clean_newsletter_tokens(db_pool),
        clean_user_statuses(db_pool),
    )
    .await?;

    // The `notifications` table must be cleaned at the end.
    clean_notifications(db_pool).await?;

    info!("finished database cleanup");

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::get_cron_job_state_for_test;
    use sqlx::PgPool;

    // Users

    #[sqlx::test(fixtures("users"))]
    async fn can_clean_users_table(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Rows should be present initially.
        let result = sqlx::query(r#"SELECT 1 FROM users"#)
            .fetch_all(&mut *conn)
            .await?;

        assert!(!result.is_empty());

        let state = get_cron_job_state_for_test(pool, None).await;
        let result = cleanup_db(DatabaseCleanupJob(Utc::now()), state).await;

        assert!(result.is_ok());

        // Rows should get deleted from the database.
        let result = sqlx::query(r#"SELECT 1 FROM users"#)
            .fetch_all(&mut *conn)
            .await?;

        assert!(result.is_empty());

        Ok(())
    }

    #[sqlx::test(fixtures("users"))]
    async fn should_not_delete_non_deleted_users(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Rows should be present initially.
        let result = sqlx::query(r#"SELECT 1 FROM users"#)
            .fetch_all(&mut *conn)
            .await?;

        assert!(result.len() > 1);

        // Restore a single user.
        let result = sqlx::query(
            r#"
WITH selected_user AS (
    SELECT id FROM users
    LIMIT 1
)
UPDATE users
SET deleted_at = NULL
WHERE id = (SELECT id FROM selected_user)
"#,
        )
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let state = get_cron_job_state_for_test(pool, None).await;
        let result = cleanup_db(DatabaseCleanupJob(Utc::now()), state).await;

        assert!(result.is_ok());

        // Exactly one row should be present in the database.
        let result = sqlx::query(r#"SELECT 1 FROM users"#)
            .fetch_all(&mut *conn)
            .await?;

        assert_eq!(result.len(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("users"))]
    async fn should_not_delete_users_marked_as_deleted_within_the_last_30_days(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Rows should be present initially.
        let result = sqlx::query(r#"SELECT 1 FROM users"#)
            .fetch_all(&mut *conn)
            .await?;

        assert!(!result.is_empty());

        // Update a single user to have a recently `deleted_at` value.
        let result = sqlx::query(
            r#"
WITH selected_user AS (
    SELECT id FROM users
    LIMIT 1
)
UPDATE users
SET deleted_at = NOW()
WHERE id = (SELECT id FROM selected_user)
"#,
        )
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let state = get_cron_job_state_for_test(pool, None).await;
        let result = cleanup_db(DatabaseCleanupJob(Utc::now()), state).await;

        assert!(result.is_ok());

        // Exactly one row should be present in the database.
        let result = sqlx::query(r#"SELECT 1 FROM users"#)
            .fetch_all(&mut *conn)
            .await?;

        assert_eq!(result.len(), 1);

        Ok(())
    }

    // Stories

    #[sqlx::test(fixtures("stories"))]
    async fn can_clean_stories_table(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Rows should be present initially.
        let result = sqlx::query(r#"SELECT 1 FROM stories"#)
            .fetch_all(&mut *conn)
            .await?;

        assert!(!result.is_empty());

        let state = get_cron_job_state_for_test(pool, None).await;
        let result = cleanup_db(DatabaseCleanupJob(Utc::now()), state).await;

        assert!(result.is_ok());

        // Rows should get deleted from the database.
        let result = sqlx::query(r#"SELECT 1 FROM stories"#)
            .fetch_all(&mut *conn)
            .await?;

        assert!(result.is_empty());

        Ok(())
    }

    #[sqlx::test(fixtures("stories"))]
    async fn should_not_delete_non_deleted_stories(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Rows should be present initially.
        let result = sqlx::query(r#"SELECT 1 FROM stories"#)
            .fetch_all(&mut *conn)
            .await?;

        assert!(result.len() > 1);

        // Restore a single story.
        let result = sqlx::query(
            r#"
WITH selected_story AS (
    SELECT id FROM stories
    LIMIT 1
)
UPDATE stories
SET deleted_at = NULL
WHERE id = (SELECT id FROM selected_story)
"#,
        )
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let state = get_cron_job_state_for_test(pool, None).await;
        let result = cleanup_db(DatabaseCleanupJob(Utc::now()), state).await;

        assert!(result.is_ok());

        // Exactly one row should be present in the database.
        let result = sqlx::query(r#"SELECT 1 FROM stories"#)
            .fetch_all(&mut *conn)
            .await?;

        assert_eq!(result.len(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("stories"))]
    async fn should_not_delete_stories_from_soft_deleted_users(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Rows should be present initially.
        let result = sqlx::query(r#"SELECT 1 FROM stories"#)
            .fetch_all(&mut *conn)
            .await?;

        assert!(result.len() > 1);

        // Soft-delete the writer of a single story.
        let result = sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let state = get_cron_job_state_for_test(pool, None).await;
        let result = cleanup_db(DatabaseCleanupJob(Utc::now()), state).await;

        assert!(result.is_ok());

        // Exactly one row should be present in the database.
        let result = sqlx::query(r#"SELECT 1 FROM stories"#)
            .fetch_all(&mut *conn)
            .await?;

        assert_eq!(result.len(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("stories"))]
    async fn should_not_delete_stories_from_deactivated_users(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Rows should be present initially.
        let result = sqlx::query(r#"SELECT 1 FROM stories"#)
            .fetch_all(&mut *conn)
            .await?;

        assert!(result.len() > 1);

        // Deactivate the writer of a single story.
        let result = sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let state = get_cron_job_state_for_test(pool, None).await;
        let result = cleanup_db(DatabaseCleanupJob(Utc::now()), state).await;

        assert!(result.is_ok());

        // Exactly one row should be present in the database.
        let result = sqlx::query(r#"SELECT 1 FROM stories"#)
            .fetch_all(&mut *conn)
            .await?;

        assert_eq!(result.len(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("stories"))]
    async fn should_not_delete_stories_marked_as_deleted_within_the_last_30_days(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Rows should be present initially.
        let result = sqlx::query(r#"SELECT 1 FROM stories"#)
            .fetch_all(&mut *conn)
            .await?;

        assert!(!result.is_empty());

        // Update a single story to have a recently `deleted_at` value.
        let result = sqlx::query(
            r#"
WITH selected_story AS (
    SELECT id FROM stories
    LIMIT 1
)
UPDATE stories
SET deleted_at = NOW()
WHERE id = (SELECT id FROM selected_story)
"#,
        )
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let state = get_cron_job_state_for_test(pool, None).await;
        let result = cleanup_db(DatabaseCleanupJob(Utc::now()), state).await;

        assert!(result.is_ok());

        // Exactly one row should be present in the database.
        let result = sqlx::query(r#"SELECT 1 FROM stories"#)
            .fetch_all(&mut *conn)
            .await?;

        assert_eq!(result.len(), 1);

        Ok(())
    }

    // Tokens

    #[sqlx::test(fixtures("tokens"))]
    async fn can_clean_tokens_table(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Rows should be present initially.
        let result = sqlx::query(r#"SELECT 1 FROM tokens"#)
            .fetch_all(&mut *conn)
            .await?;

        assert!(!result.is_empty());

        let state = get_cron_job_state_for_test(pool, None).await;
        let result = cleanup_db(DatabaseCleanupJob(Utc::now()), state).await;

        assert!(result.is_ok());

        // Rows should get deleted from the database.
        let result = sqlx::query(r#"SELECT 1 FROM tokens"#)
            .fetch_all(&mut *conn)
            .await?;

        assert!(result.is_empty());

        Ok(())
    }

    #[sqlx::test(fixtures("tokens"))]
    async fn should_not_delete_non_expired_tokens(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Rows should be present initially.
        let result = sqlx::query(r#"SELECT 1 FROM tokens"#)
            .fetch_all(&mut *conn)
            .await?;

        assert!(!result.is_empty());

        // Update `expires_at` for a single token.
        let result = sqlx::query(
            r#"
WITH selected_token AS (
    SELECT id FROM tokens
    LIMIT 1
)
UPDATE tokens
SET expires_at = NOW() + INTERVAL '7 days'
WHERE id = (SELECT id FROM selected_token)
"#,
        )
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let state = get_cron_job_state_for_test(pool, None).await;
        let result = cleanup_db(DatabaseCleanupJob(Utc::now()), state).await;

        assert!(result.is_ok());

        // Exactly one row should be present in the database.
        let result = sqlx::query(r#"SELECT 1 FROM tokens"#)
            .fetch_all(&mut *conn)
            .await?;

        assert_eq!(result.len(), 1);

        Ok(())
    }

    // Newsletter tokens

    #[sqlx::test(fixtures("newsletter_tokens"))]
    async fn can_clean_newsletter_tokens_table(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Rows should be present initially.
        let result = sqlx::query(r#"SELECT 1 FROM newsletter_tokens"#)
            .fetch_all(&mut *conn)
            .await?;

        assert!(!result.is_empty());

        let state = get_cron_job_state_for_test(pool, None).await;
        let result = cleanup_db(DatabaseCleanupJob(Utc::now()), state).await;

        assert!(result.is_ok());

        // Rows should get deleted from the database.
        let result = sqlx::query(r#"SELECT 1 FROM newsletter_tokens"#)
            .fetch_all(&mut *conn)
            .await?;

        assert!(result.is_empty());

        Ok(())
    }

    #[sqlx::test(fixtures("newsletter_tokens"))]
    async fn should_not_delete_non_expired_newsletter_tokens(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Rows should be present initially.
        let result = sqlx::query(r#"SELECT 1 FROM newsletter_tokens"#)
            .fetch_all(&mut *conn)
            .await?;

        assert!(!result.is_empty());

        // Update `expires_at` for a single token.
        let result = sqlx::query(
            r#"
WITH selected_token AS (
    SELECT id FROM newsletter_tokens
    LIMIT 1
)
UPDATE newsletter_tokens
SET expires_at = NOW() + INTERVAL '7 days'
WHERE id = (SELECT id FROM selected_token)
"#,
        )
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let state = get_cron_job_state_for_test(pool, None).await;
        let result = cleanup_db(DatabaseCleanupJob(Utc::now()), state).await;

        assert!(result.is_ok());

        // Exactly one row should be present in the database.
        let result = sqlx::query(r#"SELECT 1 FROM newsletter_tokens"#)
            .fetch_all(&mut *conn)
            .await?;

        assert_eq!(result.len(), 1);

        Ok(())
    }

    // User statuses

    #[sqlx::test(fixtures("user_statuses"))]
    async fn can_clean_user_statuses_table(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Rows should be present initially.
        let result = sqlx::query(r#"SELECT 1 FROM user_statuses"#)
            .fetch_all(&mut *conn)
            .await?;

        assert!(!result.is_empty());

        let state = get_cron_job_state_for_test(pool, None).await;
        let result = cleanup_db(DatabaseCleanupJob(Utc::now()), state).await;

        assert!(result.is_ok());

        // Rows should get deleted from the database.
        let result = sqlx::query(r#"SELECT 1 FROM user_statuses"#)
            .fetch_all(&mut *conn)
            .await?;

        assert!(result.is_empty());

        Ok(())
    }

    #[sqlx::test(fixtures("user_statuses"))]
    async fn should_not_delete_non_expired_user_statuses(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Rows should be present initially.
        let result = sqlx::query(r#"SELECT 1 FROM user_statuses"#)
            .fetch_all(&mut *conn)
            .await?;

        assert!(!result.is_empty());

        // Update `expires_at` for a single user status.
        let result = sqlx::query(
            r#"
WITH selected_user_status AS (
    SELECT user_id FROM user_statuses
    LIMIT 1
)
UPDATE user_statuses
SET expires_at = NOW() + INTERVAL '7 days'
WHERE user_id = (SELECT user_id FROM selected_user_status)
"#,
        )
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let state = get_cron_job_state_for_test(pool, None).await;
        let result = cleanup_db(DatabaseCleanupJob(Utc::now()), state).await;

        assert!(result.is_ok());

        // Exactly one row should be present in the database.
        let result = sqlx::query(r#"SELECT 1 FROM user_statuses"#)
            .fetch_all(&mut *conn)
            .await?;

        assert_eq!(result.len(), 1);

        Ok(())
    }

    // Notifications

    #[sqlx::test(fixtures("notifications"))]
    async fn can_clean_notifications_table(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Rows should be present initially.
        let result = sqlx::query(r#"SELECT 1 FROM notifications"#)
            .fetch_all(&mut *conn)
            .await?;

        assert!(!result.is_empty());

        let state = get_cron_job_state_for_test(pool, None).await;
        let result = cleanup_db(DatabaseCleanupJob(Utc::now()), state).await;

        assert!(result.is_ok());

        // Rows should get deleted from the database.
        let result = sqlx::query(r#"SELECT 1 FROM notifications"#)
            .fetch_all(&mut *conn)
            .await?;

        assert!(result.is_empty());

        Ok(())
    }

    #[sqlx::test(fixtures("notifications"))]
    async fn should_not_delete_notifications_with_notification_outs(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Rows should be present initially.
        let result = sqlx::query(r#"SELECT 1 FROM notifications"#)
            .fetch_all(&mut *conn)
            .await?;

        assert!(!result.is_empty());

        // Insert a row in `notification_outs` for a single notification.
        let result = sqlx::query(
            r#"
WITH selected_notification AS (
    SELECT id FROM notifications
    LIMIT 1
)
INSERT INTO
	notification_outs (notified_id, notification_id)
VALUES (1, (SELECT id FROM selected_notification))
"#,
        )
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let state = get_cron_job_state_for_test(pool, None).await;
        let result = cleanup_db(DatabaseCleanupJob(Utc::now()), state).await;

        assert!(result.is_ok());

        // Exactly one row should be present in the database.
        let result = sqlx::query(r#"SELECT 1 FROM notifications"#)
            .fetch_all(&mut *conn)
            .await?;

        assert_eq!(result.len(), 1);

        Ok(())
    }
}
