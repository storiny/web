#[cfg(test)]
mod tests {
    use sqlx::{
        pool::PoolConnection,
        postgres::PgRow,
        Error,
        PgPool,
        Postgres,
        Row,
    };
    use storiny::constants::sql_states::SqlState;
    use time::OffsetDateTime;

    /// Inserts a sample reply into the database.
    ///
    /// * `conn` - Pool connection.
    async fn insert_sample_reply(conn: &mut PoolConnection<Postgres>) -> Result<PgRow, Error> {
        sqlx::query(
            r#"
INSERT INTO replies (content, user_id, comment_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Sample content".to_string())
        .bind(1_i64)
        .bind(4_i64)
        .fetch_one(&mut **conn)
        .await
    }

    #[sqlx::test(fixtures("user", "story", "comment"))]
    async fn can_insert_a_valid_reply(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = insert_sample_reply(&mut conn).await?;
        assert!(result.try_get::<i64, _>("id").is_ok());
        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "comment"))]
    async fn can_reject_reply_for_soft_deleted_comment(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Soft-delete the comment
        sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO replies (content, user_id, comment_id)
VALUES ($1, $2, $3)
"#,
        )
        .bind("Sample content")
        .bind(1_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await;

        // Should reject with the correct SQLSTATE.
        assert_eq!(
            result
                .unwrap_err()
                .into_database_error()
                .unwrap()
                .code()
                .unwrap(),
            SqlState::EntityUnavailable.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "comment"))]
    async fn can_reject_reply_for_soft_deleted_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO replies (content, user_id, comment_id)
VALUES ($1, $2, $3)
"#,
        )
        .bind("Sample content")
        .bind(1_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await;

        // Should reject with the correct SQLSTATE.
        assert_eq!(
            result
                .unwrap_err()
                .into_database_error()
                .unwrap()
                .code()
                .unwrap(),
            SqlState::EntityUnavailable.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "comment"))]
    async fn can_reject_reply_for_deactivated_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO replies (content, user_id, comment_id)
VALUES ($1, $2, $3)
"#,
        )
        .bind("Sample content")
        .bind(1_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await;

        // Should reject with the correct SQLSTATE.
        assert_eq!(
            result
                .unwrap_err()
                .into_database_error()
                .unwrap()
                .code()
                .unwrap(),
            SqlState::EntityUnavailable.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "comment"))]
    async fn can_reject_reply_if_the_user_is_blocked_by_the_comment_writer(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Block the reply writer
        sqlx::query(
            r#"
INSERT INTO blocks (blocker_id, blocked_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Insert a reply
        let result = sqlx::query(
            r#"
INSERT INTO replies (content, user_id, comment_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Sample content".to_string())
        .bind(2_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await;

        // Should reject with the correct SQLSTATE.
        assert_eq!(
            result
                .unwrap_err()
                .into_database_error()
                .unwrap()
                .code()
                .unwrap(),
            SqlState::ReplyWriterBlockedByCommentWriter.to_string()
        );

        Ok(())
    }

    // Reply likes

    #[sqlx::test(fixtures("user", "story", "comment"))]
    async fn can_cascade_reply_soft_delete_to_reply_likes(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let reply_id = (insert_sample_reply(&mut conn).await?).get::<i64, _>("id");

        // Like the reply
        let insert_result = sqlx::query(
            r#"
INSERT INTO reply_likes (user_id, reply_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(reply_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the reply
        sqlx::query(
            r#"
UPDATE replies
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(reply_id)
        .execute(&mut *conn)
        .await?;

        // Reply like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM reply_likes
WHERE user_id = $1 AND reply_id = $2
"#,
        )
        .bind(1_i64)
        .bind(reply_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the reply
        sqlx::query(
            r#"
UPDATE replies
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(reply_id)
        .execute(&mut *conn)
        .await?;

        // Reply like should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM reply_likes
WHERE user_id = $1 AND reply_id = $2
"#,
        )
        .bind(1_i64)
        .bind(reply_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    // Notifications

    #[sqlx::test(fixtures("user", "story", "comment"))]
    async fn can_delete_notifications_when_the_reply_is_soft_deleted(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let reply_id = (insert_sample_reply(&mut conn).await?).get::<i64, _>("id");

        // Insert a notification
        let insert_result = sqlx::query(
            r#"
INSERT INTO notifications (entity_id, entity_type, notifier_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind(reply_id)
        .bind(0)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Soft-delete the reply
        sqlx::query(
            r#"
UPDATE replies
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(reply_id)
        .execute(&mut *conn)
        .await?;

        // Notification should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM notifications
    WHERE id = $1
)
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    // `reply_count` counter cache

    #[sqlx::test(fixtures("user", "story", "comment"))]
    async fn can_increment_reply_count_on_comment_when_inserting_the_reply(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        insert_sample_reply(&mut conn).await?;

        // Should increment the `reply_count`
        let story_result = sqlx::query(
            r#"
SELECT reply_count FROM comments
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(story_result.get::<i32, _>("reply_count"), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "comment"))]
    async fn can_update_reply_count_on_comment_when_soft_deleting_and_restoring_the_reply(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let reply_id = (insert_sample_reply(&mut conn).await?).get::<i64, _>("id");

        // Should have 1 `reply_count` initially
        let story_result = sqlx::query(
            r#"
SELECT reply_count FROM comments
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(story_result.get::<i32, _>("reply_count"), 1);

        // Soft-delete the reply
        sqlx::query(
            r#"
UPDATE replies
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(reply_id)
        .execute(&mut *conn)
        .await?;

        // Should decrement the `reply_count`
        let story_result = sqlx::query(
            r#"
SELECT reply_count FROM comments
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(story_result.get::<i32, _>("reply_count"), 0);

        // Restore the reply
        sqlx::query(
            r#"
UPDATE replies
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(reply_id)
        .execute(&mut *conn)
        .await?;

        // Should increment the `reply_count`
        let story_result = sqlx::query(
            r#"
SELECT reply_count FROM comments
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(story_result.get::<i32, _>("reply_count"), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "comment"))]
    async fn can_update_reply_count_on_comment_when_hard_deleting_the_reply(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let reply_id = (insert_sample_reply(&mut conn).await?).get::<i64, _>("id");

        // Should have 1 `reply_count` initially
        let story_result = sqlx::query(
            r#"
SELECT reply_count FROM comments
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(story_result.get::<i32, _>("reply_count"), 1);

        // Delete the reply
        sqlx::query(
            r#"
DELETE FROM replies
WHERE id = $1
"#,
        )
        .bind(reply_id)
        .execute(&mut *conn)
        .await?;

        // Should decrement the `reply_count`
        let story_result = sqlx::query(
            r#"
SELECT reply_count FROM comments
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(story_result.get::<i32, _>("reply_count"), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "comment"))]
    async fn should_not_update_reply_count_on_comment_when_hard_deleting_a_soft_deleted_reply(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let reply_id = (insert_sample_reply(&mut conn).await?).get::<i64, _>("id");

        // Insert one more reply so that the `reply_count` is always >= 1,
        // which would allow us to bypass the `reply_count > 1` constraint
        // on the comment when decrementing the `reply_count`.
        insert_sample_reply(&mut conn).await?;

        // Should have 2 `reply_count` initially
        let comment_result = sqlx::query(
            r#"
SELECT reply_count FROM comments
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(comment_result.get::<i32, _>("reply_count"), 2);

        // Soft-delete the reply
        sqlx::query(
            r#"
UPDATE replies
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(reply_id)
        .execute(&mut *conn)
        .await?;

        // Should decrement the `reply_count`
        let story_result = sqlx::query(
            r#"
SELECT reply_count FROM comments
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(story_result.get::<i32, _>("reply_count"), 1);

        // Delete the reply
        sqlx::query(
            r#"
DELETE FROM replies
WHERE id = $1
"#,
        )
        .bind(reply_id)
        .execute(&mut *conn)
        .await?;

        // Should not decrement the `reply_count` any further
        let story_result = sqlx::query(
            r#"
SELECT reply_count FROM comments
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(story_result.get::<i32, _>("reply_count"), 1);

        Ok(())
    }

    // Misc

    #[sqlx::test(fixtures("user", "story", "comment"))]
    async fn should_not_restore_reply_likes_from_deleted_users_when_cascading_reply(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let reply_id = (insert_sample_reply(&mut conn).await?).get::<i64, _>("id");

        // Like the reply
        let insert_result = sqlx::query(
            r#"
INSERT INTO reply_likes (user_id, reply_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(reply_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the reply
        sqlx::query(
            r#"
UPDATE replies
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(reply_id)
        .execute(&mut *conn)
        .await?;

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Reply like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM reply_likes
WHERE user_id = $1 AND reply_id = $2
"#,
        )
        .bind(1_i64)
        .bind(reply_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the reply
        sqlx::query(
            r#"
UPDATE replies
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(reply_id)
        .execute(&mut *conn)
        .await?;

        // Reply like should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM reply_likes
WHERE user_id = $1 AND reply_id = $2
"#,
        )
        .bind(1_i64)
        .bind(reply_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Reply like should get restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM reply_likes
WHERE user_id = $1 AND reply_id = $2
"#,
        )
        .bind(1_i64)
        .bind(reply_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "comment"))]
    async fn should_not_restore_reply_likes_from_deactivated_users_when_cascading_reply(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let reply_id = (insert_sample_reply(&mut conn).await?).get::<i64, _>("id");

        // Like the reply
        let insert_result = sqlx::query(
            r#"
INSERT INTO reply_likes (user_id, reply_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(reply_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the reply
        sqlx::query(
            r#"
UPDATE replies
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(reply_id)
        .execute(&mut *conn)
        .await?;

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Reply like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM reply_likes
WHERE user_id = $1 AND reply_id = $2
"#,
        )
        .bind(1_i64)
        .bind(reply_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the reply
        sqlx::query(
            r#"
UPDATE replies
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(reply_id)
        .execute(&mut *conn)
        .await?;

        // Reply like should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM reply_likes
WHERE user_id = $1 AND reply_id = $2
"#,
        )
        .bind(1_i64)
        .bind(reply_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Activate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Reply like should get restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM reply_likes
WHERE user_id = $1 AND reply_id = $2
"#,
        )
        .bind(1_i64)
        .bind(reply_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    // Hard deletes

    #[sqlx::test(fixtures("user", "story", "comment"))]
    async fn can_delete_reply_like_on_reply_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let reply_id = (insert_sample_reply(&mut conn).await?).get::<i64, _>("id");

        // Like the reply
        let insert_result = sqlx::query(
            r#"
INSERT INTO reply_likes (user_id, reply_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(reply_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the reply
        sqlx::query(
            r#"
DELETE FROM replies
WHERE id = $1
"#,
        )
        .bind(reply_id)
        .execute(&mut *conn)
        .await?;

        // Reply like should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM reply_likes
    WHERE user_id = $1 AND reply_id = $2
)
"#,
        )
        .bind(1_i64)
        .bind(reply_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "comment"))]
    async fn can_delete_notification_on_reply_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let reply_id = (insert_sample_reply(&mut conn).await?).get::<i64, _>("id");

        // Insert a notification
        let insert_result = sqlx::query(
            r#"
INSERT INTO notifications (entity_id, entity_type, notifier_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind(reply_id)
        .bind(0)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Delete the reply
        sqlx::query(
            r#"
DELETE FROM replies
WHERE id = $1
"#,
        )
        .bind(reply_id)
        .execute(&mut *conn)
        .await?;

        // Notification should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM notifications
    WHERE id = $1
)
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }
}
