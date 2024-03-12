#[cfg(test)]
mod tests {
    use sqlx::PgPool;
    use storiny::constants::{
        notification_entity_type::NotificationEntityType,
        sql_states::SqlState,
    };

    #[sqlx::test(fixtures("user", "notification"))]
    async fn can_insert_a_notification_out(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id) 
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user", "notification"))]
    async fn can_reject_notification_out_for_soft_deleted_notified_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Soft-delete the notified user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id) 
VALUES ($1, $2)
"#,
        )
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
            SqlState::EntityUnavailable.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "notification"))]
    async fn can_reject_notification_out_for_deactivated_notified_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Deactivate the notified user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id) 
VALUES ($1, $2)
"#,
        )
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
            SqlState::EntityUnavailable.to_string()
        );

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user", "notification"))]
    async fn can_skip_notification_out_when_the_notified_user_has_muted_the_notifier_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Mute the notifier user
        sqlx::query(
            r#"
INSERT INTO mutes (muter_id, muted_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id) 
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should not insert the notification
        assert_eq!(result.rows_affected(), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "notification"))]
    async fn can_skip_notification_out_when_the_notified_user_has_blocked_the_notifier_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Block the notifier user
        sqlx::query(
            r#"
INSERT INTO blocks (blocker_id, blocked_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id) 
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should not insert the notification
        assert_eq!(result.rows_affected(), 0);

        Ok(())
    }

    // Notification settings

    #[sqlx::test(fixtures("user", "notification"))]
    async fn can_skip_notification_out_when_the_notified_user_has_disabled_push_stories(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Update notification settings for the notified user
        sqlx::query(
            r#"
UPDATE notification_settings
SET push_stories = FALSE
WHERE user_id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Set entity type to story add by user
        sqlx::query(
            r#"
UPDATE notifications
SET entity_type = $1
WHERE id = $2
"#,
        )
        .bind(NotificationEntityType::StoryAddByUser as i16)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id) 
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should not insert the row
        assert_eq!(result.rows_affected(), 0);

        // Set entity type to story add by tag
        sqlx::query(
            r#"
UPDATE notifications
SET entity_type = $1
WHERE id = $2
"#,
        )
        .bind(NotificationEntityType::StoryAddByTag as i16)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id) 
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should not insert the row
        assert_eq!(result.rows_affected(), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "notification"))]
    async fn can_skip_notification_out_when_the_notified_user_has_disabled_push_story_likes(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Update notification settings for the notified user
        sqlx::query(
            r#"
UPDATE notification_settings
SET push_story_likes = FALSE
WHERE user_id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Set entity type to story like
        sqlx::query(
            r#"
UPDATE notifications
SET entity_type = $1
WHERE id = $2
"#,
        )
        .bind(NotificationEntityType::StoryLike as i16)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id) 
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should not insert the row
        assert_eq!(result.rows_affected(), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "notification"))]
    async fn can_skip_notification_out_when_the_notified_user_has_disabled_push_comments(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Update notification settings for the notified user
        sqlx::query(
            r#"
UPDATE notification_settings
SET push_comments = FALSE
WHERE user_id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Set entity type to comment add
        sqlx::query(
            r#"
UPDATE notifications
SET entity_type = $1
WHERE id = $2
"#,
        )
        .bind(NotificationEntityType::CommentAdd as i16)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id) 
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should not insert the row
        assert_eq!(result.rows_affected(), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "notification"))]
    async fn can_skip_notification_out_when_the_notified_user_has_disabled_push_replies(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Update notification settings for the notified user
        sqlx::query(
            r#"
UPDATE notification_settings
SET push_replies = FALSE
WHERE user_id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Set entity type to reply add
        sqlx::query(
            r#"
UPDATE notifications
SET entity_type = $1
WHERE id = $2
"#,
        )
        .bind(NotificationEntityType::ReplyAdd as i16)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id) 
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should not insert the row
        assert_eq!(result.rows_affected(), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "notification"))]
    async fn can_skip_notification_out_when_the_notified_user_has_disabled_push_followers(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Update notification settings for the notified user
        sqlx::query(
            r#"
UPDATE notification_settings
SET push_followers = FALSE
WHERE user_id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Set entity type to follower add
        sqlx::query(
            r#"
UPDATE notifications
SET entity_type = $1
WHERE id = $2
"#,
        )
        .bind(NotificationEntityType::FollowerAdd as i16)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id) 
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should not insert the row
        assert_eq!(result.rows_affected(), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "notification"))]
    async fn can_skip_notification_out_when_the_notified_user_has_disabled_push_friend_requests(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Update notification settings for the notified user
        sqlx::query(
            r#"
UPDATE notification_settings
SET push_friend_requests = FALSE
WHERE user_id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Set entity type to friend request received
        sqlx::query(
            r#"
UPDATE notifications
SET entity_type = $1
WHERE id = $2
"#,
        )
        .bind(NotificationEntityType::FriendReqReceived as i16)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id) 
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should not insert the row
        assert_eq!(result.rows_affected(), 0);

        // Set entity type to friend request accept
        sqlx::query(
            r#"
UPDATE notifications
SET entity_type = $1
WHERE id = $2
"#,
        )
        .bind(NotificationEntityType::FriendReqAccept as i16)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id) 
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should not insert the row
        assert_eq!(result.rows_affected(), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "notification"))]
    async fn can_skip_notification_out_when_the_notified_user_has_disabled_push_collaboration_requests(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Update notification settings for the notified user
        sqlx::query(
            r#"
UPDATE notification_settings
SET push_collaboration_requests = FALSE
WHERE user_id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Set entity type to collaboration request received
        sqlx::query(
            r#"
UPDATE notifications
SET entity_type = $1
WHERE id = $2
"#,
        )
        .bind(NotificationEntityType::CollabReqReceived as i16)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should not insert the row
        assert_eq!(result.rows_affected(), 0);

        // Set entity type to collaboration request accept
        sqlx::query(
            r#"
UPDATE notifications
SET entity_type = $1
WHERE id = $2
"#,
        )
        .bind(NotificationEntityType::CollabReqAccept as i16)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should not insert the row
        assert_eq!(result.rows_affected(), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "notification"))]
    async fn can_skip_notification_out_when_the_notified_user_has_disabled_push_blog_requests(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Update notification settings for the notified user
        sqlx::query(
            r#"
UPDATE notification_settings
SET push_blog_requests = FALSE
WHERE user_id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Set entity type to blog editor invite
        sqlx::query(
            r#"
UPDATE notifications
SET entity_type = $1
WHERE id = $2
"#,
        )
        .bind(NotificationEntityType::BlogEditorInvite as i16)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should not insert the row
        assert_eq!(result.rows_affected(), 0);

        // Set entity type to blog writer invite
        sqlx::query(
            r#"
UPDATE notifications
SET entity_type = $1
WHERE id = $2
"#,
        )
        .bind(NotificationEntityType::BlogWriterInvite as i16)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should not insert the row
        assert_eq!(result.rows_affected(), 0);

        Ok(())
    }
}
