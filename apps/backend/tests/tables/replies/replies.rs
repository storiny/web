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
    use storiny::models::{
        comment::Comment,
        reply::Reply,
    };
    use time::OffsetDateTime;

    /// Returns a sample reply
    fn get_default_reply() -> Reply {
        Reply {
            id: 0,
            content: "Sample **content**".to_string(),
            rendered_content: "Sample <strong>content</strong>".to_string(),
            hidden: false,
            user_id: 1i64,
            comment_id: 3i64,
            like_count: 0,
            created_at: OffsetDateTime::now_utc(),
            edited_at: None,
            deleted_at: None,
        }
    }

    /// Inserts a sample reply into the database.
    ///
    /// * `conn` - Pool connection.
    async fn insert_sample_reply(conn: &mut PoolConnection<Postgres>) -> Result<PgRow, Error> {
        let reply = get_default_reply();
        sqlx::query(
            r#"
            INSERT INTO replies (content, rendered_content, hidden, user_id, comment_id, like_count, created_at, edited_at, deleted_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id
            "#,
        )
        .bind(reply.content)
        .bind(reply.rendered_content)
        .bind(reply.hidden)
        .bind(reply.user_id)
        .bind(reply.comment_id)
        .bind(reply.like_count)
        .bind(reply.created_at)
        .bind(reply.edited_at)
        .bind(reply.deleted_at)
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

    // Reply likes

    #[sqlx::test(fixtures("user", "story", "comment"))]
    async fn can_cascade_reply_soft_delete_to_reply_likes(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let reply_id = (insert_sample_reply(&mut conn).await?).get::<i64, _>("id");

        // Like the reply
        let insert_result = sqlx::query(
            r#"
            INSERT INTO reply_likes(user_id, reply_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
        .bind(reply_id)
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(comment_id)
        .execute(&mut *conn)
        .await?;

        // Comment like should be soft-deleted
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM comment_likes
            WHERE user_id = $1 AND comment_id = $2
            "#,
        )
        .bind(1i64)
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

        // Comment like should be restored
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM comment_likes
            WHERE user_id = $1 AND comment_id = $2
            "#,
        )
        .bind(1i64)
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
        let comment_id = (insert_sample_reply(&mut conn).await?).get::<i64, _>("id");

        // Insert a notification
        let insert_result = sqlx::query(
            r#"
            INSERT INTO notifications(entity_id, entity_type, notifier_id)
            VALUES ($1, $2, $3)
            RETURNING id
            "#,
        )
        .bind(comment_id)
        .bind(0)
        .bind(1i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Soft-delete the comment
        sqlx::query(
            r#"
            UPDATE comments
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(comment_id)
        .execute(&mut *conn)
        .await?;

        // Notification should get deleted
        let result = sqlx::query(
            r#"
            SELECT EXISTS(
                SELECT 1 FROM notifications
                WHERE id = $1
            )
            "#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

        Ok(())
    }

    // `comment_count` counter cache

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_increment_comment_count_on_story_when_inserting_the_comment(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        insert_sample_reply(&mut conn).await?;

        // Should increment the `comment_count`
        let story_result = sqlx::query(
            r#"
            SELECT comment_count FROM stories
            WHERE id = $1
            "#,
        )
        .bind(2i64)
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
        let comment_id = (insert_sample_reply(&mut conn).await?).get::<i64, _>("id");

        // Should have 1 `comment_count` initially
        let story_result = sqlx::query(
            r#"
            SELECT comment_count FROM stories
            WHERE id = $1
            "#,
        )
        .bind(2i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(story_result.get::<i32, _>("comment_count"), 1);

        // Soft-delete the comment
        sqlx::query(
            r#"
            UPDATE comments
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(comment_id)
        .execute(&mut *conn)
        .await?;

        // Should decrement the `comment_count`
        let story_result = sqlx::query(
            r#"
            SELECT comment_count FROM stories
            WHERE id = $1
            "#,
        )
        .bind(2i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(story_result.get::<i32, _>("comment_count"), 0);

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

        // Should increment the `comment_count`
        let story_result = sqlx::query(
            r#"
            SELECT comment_count FROM stories
            WHERE id = $1
            "#,
        )
        .bind(2i64)
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
        let comment_id = (insert_sample_reply(&mut conn).await?).get::<i64, _>("id");

        // Should have 1 `comment_count` initially
        let story_result = sqlx::query(
            r#"
            SELECT comment_count FROM stories
            WHERE id = $1
            "#,
        )
        .bind(2i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(story_result.get::<i32, _>("comment_count"), 1);

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

        // Should decrement the `comment_count`
        let story_result = sqlx::query(
            r#"
            SELECT comment_count FROM stories
            WHERE id = $1
            "#,
        )
        .bind(2i64)
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
        let comment_id = (insert_sample_reply(&mut conn).await?).get::<i64, _>("id");

        // Insert one more comment so that the `comment_count` is always >= 1,
        // which would allow us to bypass the `comment_count > 1` constraint
        // on the story when decrementing the `comment_count`.
        insert_sample_reply(&mut conn).await?;

        // Should have 2 `comment_count` initially
        let story_result = sqlx::query(
            r#"
            SELECT comment_count FROM stories
            WHERE id = $1
            "#,
        )
        .bind(2i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(story_result.get::<i32, _>("comment_count"), 2);

        // Soft-delete the comment
        sqlx::query(
            r#"
            UPDATE comments
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(comment_id)
        .execute(&mut *conn)
        .await?;

        // Should decrement the `comment_count`
        let story_result = sqlx::query(
            r#"
            SELECT comment_count FROM stories
            WHERE id = $1
            "#,
        )
        .bind(2i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(story_result.get::<i32, _>("comment_count"), 1);

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

        // Should not decrement the `comment_count` any further
        let story_result = sqlx::query(
            r#"
            SELECT comment_count FROM stories
            WHERE id = $1
            "#,
        )
        .bind(2i64)
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
        let comment_id = (insert_sample_reply(&mut conn).await?).get::<i64, _>("id");

        // Insert a reply
        let insert_result = sqlx::query(
            r#"
            INSERT INTO replies(content, user_id, comment_id)
            VALUES ($1, $2, $3)
            RETURNING id, deleted_at
            "#,
        )
        .bind("Sample content".to_string())
        .bind(1i64)
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
            SET deleted_at = now()
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
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

        // Restore the user
        sqlx::query(
            r#"
            UPDATE users
            SET deleted_at = NULL
            WHERE id = $1
            "#,
        )
        .bind(1i64)
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

    #[sqlx::test(fixtures("user", "story"))]
    async fn should_not_restore_replies_from_deactivated_users_when_cascading_comment(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let comment_id = (insert_sample_reply(&mut conn).await?).get::<i64, _>("id");

        // Insert a reply
        let insert_result = sqlx::query(
            r#"
            INSERT INTO replies(content, user_id, comment_id)
            VALUES ($1, $2, $3)
            RETURNING id, deleted_at
            "#,
        )
        .bind("Sample content".to_string())
        .bind(1i64)
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
            SET deleted_at = now()
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
            SET deactivated_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
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
        let comment_id = (insert_sample_reply(&mut conn).await?).get::<i64, _>("id");

        // Like the comment
        let insert_result = sqlx::query(
            r#"
            INSERT INTO comment_likes(user_id, comment_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deleted_at = now()
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Comment like should be soft-deleted
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM comment_likes
            WHERE user_id = $1 AND comment_id = $2
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Comment like should get restored
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM comment_likes
            WHERE user_id = $1 AND comment_id = $2
            "#,
        )
        .bind(1i64)
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
        let comment_id = (insert_sample_reply(&mut conn).await?).get::<i64, _>("id");

        // Like the comment
        let insert_result = sqlx::query(
            r#"
            INSERT INTO comment_likes(user_id, comment_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deleted_at = now()
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
            SET deactivated_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Comment like should be soft-deleted
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM comment_likes
            WHERE user_id = $1 AND comment_id = $2
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Comment like should get restored
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM comment_likes
            WHERE user_id = $1 AND comment_id = $2
            "#,
        )
        .bind(1i64)
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
        let comment_id = (insert_sample_reply(&mut conn).await?).get::<i64, _>("id");

        // Insert a reply
        let insert_result = sqlx::query(
            r#"
            INSERT INTO replies(content, user_id, comment_id)
            VALUES ($1, $2, $3)
            RETURNING id
            "#,
        )
        .bind("Sample content".to_string())
        .bind(1i64)
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
            SELECT EXISTS(
                SELECT 1 FROM replies
                WHERE id = $1
            )
            "#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_delete_comment_like_on_comment_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let comment_id = (insert_sample_reply(&mut conn).await?).get::<i64, _>("id");

        // Like the comment
        let insert_result = sqlx::query(
            r#"
            INSERT INTO comment_likes(user_id, comment_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(1i64)
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
            SELECT EXISTS(
                SELECT 1 FROM comment_likes
                WHERE user_id = $1 AND comment_id = $2
            )
            "#,
        )
        .bind(1i64)
        .bind(comment_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_delete_notification_on_comment_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let comment_id = (insert_sample_reply(&mut conn).await?).get::<i64, _>("id");

        // Insert a notification
        let insert_result = sqlx::query(
            r#"
            INSERT INTO notifications(entity_id, entity_type, notifier_id)
            VALUES ($1, $2, $3)
            RETURNING id
            "#,
        )
        .bind(comment_id)
        .bind(0)
        .bind(1i64)
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
            SELECT EXISTS(
                SELECT 1 FROM notifications
                WHERE id = $1
            )
            "#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

        Ok(())
    }
}
