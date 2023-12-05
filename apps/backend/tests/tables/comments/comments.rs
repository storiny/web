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

    /// Inserts a sample comment into the database.
    ///
    /// * `conn` - Pool connection.
    async fn insert_sample_comment(conn: &mut PoolConnection<Postgres>) -> Result<PgRow, Error> {
        sqlx::query(
            r#"
INSERT INTO comments (content, user_id, story_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Sample content")
        .bind(1_i64)
        .bind(3_i64)
        .fetch_one(&mut **conn)
        .await
    }

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_insert_a_valid_comment(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = insert_sample_comment(&mut conn).await?;
        assert!(result.try_get::<i64, _>("id").is_ok());
        Ok(())
    }

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_reject_comment_for_soft_deleted_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Soft-delete the story.
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO comments (content, user_id, story_id)
VALUES ($1, $2, $3)
"#,
        )
        .bind("Sample content")
        .bind(1_i64)
        .bind(3_i64)
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

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_reject_comment_for_unpublished_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Unpublish the story.
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO comments (content, user_id, story_id)
VALUES ($1, $2, $3)
"#,
        )
        .bind("Sample content")
        .bind(1_i64)
        .bind(3_i64)
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

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_reject_comment_for_soft_deleted_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Soft-delete the user.
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
INSERT INTO comments (content, user_id, story_id)
VALUES ($1, $2, $3)
"#,
        )
        .bind("Sample content")
        .bind(1_i64)
        .bind(3_i64)
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

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_reject_comment_for_deactivated_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Deactivate the user.
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
INSERT INTO comments (content, user_id, story_id)
VALUES ($1, $2, $3)
"#,
        )
        .bind("Sample content")
        .bind(1_i64)
        .bind(3_i64)
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

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_reject_comment_if_the_user_is_blocked_by_the_story_writer(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Block the comment writer.
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

        // Insert a comment
        let result = sqlx::query(
            r#"
INSERT INTO comments (content, user_id, story_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Sample content".to_string())
        .bind(2_i64)
        .bind(3_i64)
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
            SqlState::CommentWriterBlockedByStoryWriter.to_string()
        );

        Ok(())
    }

    // Replies

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_cascade_comment_soft_delete_to_replies(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let comment_id = (insert_sample_comment(&mut conn).await?).get::<i64, _>("id");

        // Insert a reply.
        let insert_result = sqlx::query(
            r#"
INSERT INTO replies (content, user_id, comment_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample content".to_string())
        .bind(1_i64)
        .bind(comment_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the comment.
        sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(comment_id)
        .execute(&mut *conn)
        .await?;

        // Reply should be soft-deleted.
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM replies
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the comment.
        sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(comment_id)
        .execute(&mut *conn)
        .await?;

        // Reply should be restored.
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM replies
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    // Comment likes

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_cascade_comment_soft_delete_to_comment_likes(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let comment_id = (insert_sample_comment(&mut conn).await?).get::<i64, _>("id");

        // Like the comment.
        let insert_result = sqlx::query(
            r#"
INSERT INTO comment_likes (user_id, comment_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(comment_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the comment.
        sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(comment_id)
        .execute(&mut *conn)
        .await?;

        // Comment like should be soft-deleted.
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comment_likes
WHERE user_id = $1 AND comment_id = $2
"#,
        )
        .bind(1_i64)
        .bind(comment_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the comment.
        sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(comment_id)
        .execute(&mut *conn)
        .await?;

        // Comment like should be restored.
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comment_likes
WHERE user_id = $1 AND comment_id = $2
"#,
        )
        .bind(1_i64)
        .bind(comment_id)
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

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_delete_notifications_when_the_comment_is_soft_deleted(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let comment_id = (insert_sample_comment(&mut conn).await?).get::<i64, _>("id");

        // Insert a notification.
        let insert_result = sqlx::query(
            r#"
INSERT INTO notifications (entity_id, entity_type, notifier_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind(comment_id)
        .bind(0)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Soft-delete the comment.
        sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(comment_id)
        .execute(&mut *conn)
        .await?;

        // Notification should get deleted.
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

    // `comment_count` counter cache

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_increment_comment_count_on_story_when_inserting_the_comment(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        insert_sample_comment(&mut conn).await?;

        // Should increment the `comment_count`.
        let story_result = sqlx::query(
            r#"
SELECT comment_count FROM stories
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(story_result.get::<i32, _>("comment_count"), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_update_comment_count_on_story_when_soft_deleting_and_restoring_the_comment(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let comment_id = (insert_sample_comment(&mut conn).await?).get::<i64, _>("id");

        // Should have 1 `comment_count` initially.
        let story_result = sqlx::query(
            r#"
SELECT comment_count FROM stories
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(story_result.get::<i32, _>("comment_count"), 1);

        // Soft-delete the comment.
        sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(comment_id)
        .execute(&mut *conn)
        .await?;

        // Should decrement the `comment_count`.
        let story_result = sqlx::query(
            r#"
SELECT comment_count FROM stories
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(story_result.get::<i32, _>("comment_count"), 0);

        // Restore the comment.
        sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(comment_id)
        .execute(&mut *conn)
        .await?;

        // Should increment the `comment_count`.
        let story_result = sqlx::query(
            r#"
SELECT comment_count FROM stories
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(story_result.get::<i32, _>("comment_count"), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_update_comment_count_on_story_when_hard_deleting_the_comment(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let comment_id = (insert_sample_comment(&mut conn).await?).get::<i64, _>("id");

        // Should have 1 `comment_count` initially.
        let story_result = sqlx::query(
            r#"
SELECT comment_count FROM stories
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(story_result.get::<i32, _>("comment_count"), 1);

        // Delete the comment.
        sqlx::query(
            r#"
DELETE FROM comments
WHERE id = $1
"#,
        )
        .bind(comment_id)
        .execute(&mut *conn)
        .await?;

        // Should decrement the `comment_count`.
        let story_result = sqlx::query(
            r#"
SELECT comment_count FROM stories
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(story_result.get::<i32, _>("comment_count"), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story"))]
    async fn should_not_update_comment_count_on_story_when_hard_deleting_a_soft_deleted_comment(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let comment_id = (insert_sample_comment(&mut conn).await?).get::<i64, _>("id");

        // Insert one more comment so that the `comment_count` is always >= 1,
        // which would allow us to bypass the `comment_count > 1` constraint
        // on the story when decrementing the `comment_count`.
        insert_sample_comment(&mut conn).await?;

        // Should have 2 `comment_count` initially.
        let story_result = sqlx::query(
            r#"
SELECT comment_count FROM stories
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(story_result.get::<i32, _>("comment_count"), 2);

        // Soft-delete the comment.
        sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(comment_id)
        .execute(&mut *conn)
        .await?;

        // Should decrement the `comment_count`.
        let story_result = sqlx::query(
            r#"
SELECT comment_count FROM stories
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(story_result.get::<i32, _>("comment_count"), 1);

        // Delete the comment.
        sqlx::query(
            r#"
DELETE FROM comments
WHERE id = $1
"#,
        )
        .bind(comment_id)
        .execute(&mut *conn)
        .await?;

        // Should not decrement the `comment_count` any further.
        let story_result = sqlx::query(
            r#"
SELECT comment_count FROM stories
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(story_result.get::<i32, _>("comment_count"), 1);

        Ok(())
    }

    // Misc

    #[sqlx::test(fixtures("user", "story"))]
    async fn should_not_restore_replies_from_deleted_users_when_cascading_comment(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let comment_id = (insert_sample_comment(&mut conn).await?).get::<i64, _>("id");

        // Insert a reply.
        let insert_result = sqlx::query(
            r#"
INSERT INTO replies (content, user_id, comment_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample content".to_string())
        .bind(1_i64)
        .bind(comment_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the comment.
        sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(comment_id)
        .execute(&mut *conn)
        .await?;

        // Soft-delete the user.
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

        // Reply should be soft-deleted.
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM replies
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the comment.
        sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(comment_id)
        .execute(&mut *conn)
        .await?;

        // Reply should still be soft-deleted.
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM replies
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the user.
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

        // Reply should get restored.
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM replies
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story"))]
    async fn should_not_restore_replies_from_deactivated_users_when_cascading_comment(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let comment_id = (insert_sample_comment(&mut conn).await?).get::<i64, _>("id");

        // Insert a reply
        let insert_result = sqlx::query(
            r#"
INSERT INTO replies (content, user_id, comment_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample content".to_string())
        .bind(1_i64)
        .bind(comment_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the comment
        sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(comment_id)
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

        // Reply should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM replies
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the comment
        sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(comment_id)
        .execute(&mut *conn)
        .await?;

        // Reply should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM replies
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
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

        // Reply should get restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM replies
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user", "story"))]
    async fn should_not_restore_comment_likes_from_deleted_users_when_cascading_comment(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let comment_id = (insert_sample_comment(&mut conn).await?).get::<i64, _>("id");

        // Like the comment
        let insert_result = sqlx::query(
            r#"
INSERT INTO comment_likes (user_id, comment_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(comment_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the comment
        sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(comment_id)
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

        // Comment like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comment_likes
WHERE user_id = $1 AND comment_id = $2
"#,
        )
        .bind(1_i64)
        .bind(comment_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the comment
        sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(comment_id)
        .execute(&mut *conn)
        .await?;

        // Comment like should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comment_likes
WHERE user_id = $1 AND comment_id = $2
"#,
        )
        .bind(1_i64)
        .bind(comment_id)
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

        // Comment like should get restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comment_likes
WHERE user_id = $1 AND comment_id = $2
"#,
        )
        .bind(1_i64)
        .bind(comment_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story"))]
    async fn should_not_restore_comment_likes_from_deactivated_users_when_cascading_comment(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let comment_id = (insert_sample_comment(&mut conn).await?).get::<i64, _>("id");

        // Like the comment
        let insert_result = sqlx::query(
            r#"
INSERT INTO comment_likes (user_id, comment_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(comment_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the comment
        sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(comment_id)
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

        // Comment like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comment_likes
WHERE user_id = $1 AND comment_id = $2
"#,
        )
        .bind(1_i64)
        .bind(comment_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the comment
        sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(comment_id)
        .execute(&mut *conn)
        .await?;

        // Comment like should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comment_likes
WHERE user_id = $1 AND comment_id = $2
"#,
        )
        .bind(1_i64)
        .bind(comment_id)
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

        // Comment like should get restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comment_likes
WHERE user_id = $1 AND comment_id = $2
"#,
        )
        .bind(1_i64)
        .bind(comment_id)
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

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_delete_reply_on_comment_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let comment_id = (insert_sample_comment(&mut conn).await?).get::<i64, _>("id");

        // Insert a reply
        let insert_result = sqlx::query(
            r#"
INSERT INTO replies (content, user_id, comment_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Sample content".to_string())
        .bind(1_i64)
        .bind(comment_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Delete the comment
        sqlx::query(
            r#"
DELETE FROM comments
WHERE id = $1
"#,
        )
        .bind(comment_id)
        .execute(&mut *conn)
        .await?;

        // Reply should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM replies
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

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_delete_comment_like_on_comment_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let comment_id = (insert_sample_comment(&mut conn).await?).get::<i64, _>("id");

        // Like the comment
        let insert_result = sqlx::query(
            r#"
INSERT INTO comment_likes (user_id, comment_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(comment_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the comment
        sqlx::query(
            r#"
DELETE FROM comments
WHERE id = $1
"#,
        )
        .bind(comment_id)
        .execute(&mut *conn)
        .await?;

        // Comment like should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM comment_likes
    WHERE user_id = $1 AND comment_id = $2
)
"#,
        )
        .bind(1_i64)
        .bind(comment_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_delete_notification_on_comment_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let comment_id = (insert_sample_comment(&mut conn).await?).get::<i64, _>("id");

        // Insert a notification
        let insert_result = sqlx::query(
            r#"
INSERT INTO notifications (entity_id, entity_type, notifier_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind(comment_id)
        .bind(0)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Delete the comment
        sqlx::query(
            r#"
DELETE FROM comments
WHERE id = $1
"#,
        )
        .bind(comment_id)
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
