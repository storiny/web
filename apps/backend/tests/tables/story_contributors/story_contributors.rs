#[cfg(test)]
mod tests {
    use sqlx::{
        PgPool,
        Row,
    };
    use storiny::{
        constants::sql_states::SqlState,
        grpc::defs::privacy_settings_def::v1::IncomingCollaborationRequest,
    };

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_send_a_collaboration_request(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
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

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_reject_an_illegal_contributor(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        let result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
VALUES ($1, $2)
"#,
        )
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
            SqlState::IllegalContributor.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_reject_overflowing_contributors(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        let result = sqlx::query(
            r#"
WITH inserted_users AS (
    INSERT INTO users (id, name, username, email)
    VALUES
        (4, 'Contributor 1', 'contributor_1', 'contributor_1@storiny.com'),
        (5, 'Contributor 2', 'contributor_2', 'contributor_2@storiny.com'),
        (6, 'Contributor 3', 'contributor_3', 'contributor_3@storiny.com')
)
INSERT INTO story_contributors (user_id, story_id)
VALUES (4, $1), (5, $1), (6, $1)
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 3);

        // Force overflow.
        let result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
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
            SqlState::ContributorOverflow.to_string()
        );

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_reject_collaboration_request_for_private_contributor(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Make the contributor private.
        sqlx::query(
            r#"
UPDATE users
SET is_private = TRUE
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
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
            SqlState::ContributorNotAcceptingCollaborationRequest.to_string()
        );

        // Add the user as friend.
        sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
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

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_reject_collaboration_request_for_soft_deleted_contributor(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Soft-delete the contributor
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
INSERT INTO story_contributors (user_id, story_id)
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

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_reject_collaboration_request_for_deactivated_contributor(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Deactivate the contributor
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
INSERT INTO story_contributors (user_id, story_id)
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

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_reject_collaboration_request_for_soft_deleted_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Soft-delete the story
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
INSERT INTO story_contributors (user_id, story_id)
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

    // `incoming_collaboration_requests` setting

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_reject_collaboration_request_for_none_incoming_collaboration_requests_setting(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set `incoming_collaboration_requests` to none
        sqlx::query(
            r#"
UPDATE users
SET incoming_collaboration_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingCollaborationRequest::None as i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
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
            SqlState::ContributorNotAcceptingCollaborationRequest.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "following"))]
    async fn can_reject_collaboration_request_for_none_incoming_collaboration_requests_setting_from_following_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set `incoming_collaboration_requests` to none
        sqlx::query(
            r#"
UPDATE users
SET incoming_collaboration_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingCollaborationRequest::None as i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
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
            SqlState::ContributorNotAcceptingCollaborationRequest.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "friend"))]
    async fn can_reject_collaboration_request_for_none_incoming_collaboration_requests_setting_from_friend(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set `incoming_collaboration_requests` to none
        sqlx::query(
            r#"
UPDATE users
SET incoming_collaboration_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingCollaborationRequest::None as i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
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
            SqlState::ContributorNotAcceptingCollaborationRequest.to_string()
        );

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_reject_collaboration_request_for_following_incoming_collaboration_requests_setting(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set `incoming_collaboration_requests` to following
        sqlx::query(
            r#"
UPDATE users
SET incoming_collaboration_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingCollaborationRequest::Following as i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
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
            SqlState::ContributorNotAcceptingCollaborationRequest.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "following"))]
    async fn can_accept_collaboration_request_for_following_incoming_collaboration_requests_setting_from_following_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set `incoming_collaboration_requests` to following
        sqlx::query(
            r#"
UPDATE users
SET incoming_collaboration_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingCollaborationRequest::Following as i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
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

    #[sqlx::test(fixtures("user", "story", "friend"))]
    async fn can_reject_collaboration_request_for_following_incoming_collaboration_requests_setting_from_friend(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set `incoming_collaboration_requests` to following
        sqlx::query(
            r#"
UPDATE users
SET incoming_collaboration_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingCollaborationRequest::Following as i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
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
            SqlState::ContributorNotAcceptingCollaborationRequest.to_string()
        );

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_reject_collaboration_request_for_friends_incoming_collaboration_requests_setting(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set `incoming_collaboration_requests` to friends
        sqlx::query(
            r#"
UPDATE users
SET incoming_collaboration_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingCollaborationRequest::Friends as i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
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
            SqlState::ContributorNotAcceptingCollaborationRequest.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "following"))]
    async fn can_reject_collaboration_request_for_friends_incoming_collaboration_requests_setting_from_following_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set `incoming_collaboration_requests` to friends
        sqlx::query(
            r#"
UPDATE users
SET incoming_collaboration_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingCollaborationRequest::Friends as i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
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
            SqlState::ContributorNotAcceptingCollaborationRequest.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "friend"))]
    async fn can_accept_collaboration_request_for_friends_incoming_collaboration_requests_setting_from_friends(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set `incoming_collaboration_requests` to friends
        sqlx::query(
            r#"
UPDATE users
SET incoming_collaboration_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingCollaborationRequest::Friends as i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
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

    // Notifications

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_delete_notifications_when_the_contributor_is_soft_deleted(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Add a contributor
        let result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
VALUES ($1, $2)
RETURNING id
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Insert a notification
        let insert_result = sqlx::query(
            r#"
INSERT INTO notifications (entity_id, entity_type, notifier_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind(result.get::<i64, _>("id"))
        .bind(0)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Soft-delete the contributor
        sqlx::query(
            r#"
UPDATE story_contributors
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(result.get::<i64, _>("id"))
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

    // Hard deletes

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_delete_notification_on_contributor_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Add a contributor
        let result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
VALUES ($1, $2)
RETURNING id
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Insert a notification
        let insert_result = sqlx::query(
            r#"
INSERT INTO notifications (entity_id, entity_type, notifier_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind(result.get::<i64, _>("id"))
        .bind(0)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Delete the contributor
        sqlx::query(
            r#"
DELETE FROM story_contributors
WHERE id = $1
"#,
        )
        .bind(result.get::<i64, _>("id"))
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
