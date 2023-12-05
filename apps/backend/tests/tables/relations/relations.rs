#[cfg(test)]
mod tests {
    use sqlx::{
        PgPool,
        Row,
    };
    use storiny::constants::sql_states::SqlState;

    #[sqlx::test(fixtures("user"))]
    async fn can_insert_a_relation(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_relation_on_overlap(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Insert relation with overlapping IDs
        let result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(1_i64)
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
            SqlState::RelationOverlap.to_string()
        );

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_relation_for_soft_deleted_follower_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Soft-delete the follower user
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
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
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

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_relation_for_deactivated_follower_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Deactivate the follower user
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
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
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

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_relation_for_soft_deleted_followed_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Soft-delete the followed user
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
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
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

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_relation_for_deactivated_followed_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Deactivate the followed user
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
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
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

    // `follower_count` counter cache

    #[sqlx::test(fixtures("user"))]
    async fn can_increment_follower_count_on_the_followed_user_when_inserting_the_relation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Follow a user
        sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should increment the `follower_count`
        let user_result = sqlx::query(
            r#"
SELECT follower_count FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("follower_count"), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_update_follower_count_on_the_followed_user_when_soft_deleting_and_restoring_the_relation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Follow a user
        sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should have 1 `follower_count` initially
        let user_result = sqlx::query(
            r#"
SELECT follower_count FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("follower_count"), 1);

        // Soft-delete the relation
        sqlx::query(
            r#"
UPDATE relations
SET deleted_at = NOW()
WHERE follower_id = $1 AND followed_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement the `follower_count`
        let user_result = sqlx::query(
            r#"
SELECT follower_count FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("follower_count"), 0);

        // Restore the relation
        sqlx::query(
            r#"
UPDATE relations
SET deleted_at = NULL
WHERE follower_id = $1 AND followed_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should increment the `follower_count`
        let user_result = sqlx::query(
            r#"
SELECT follower_count FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("follower_count"), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_update_follower_count_on_the_followed_user_when_hard_deleting_the_relation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Follow a user
        sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should have 1 `follower_count` initially
        let user_result = sqlx::query(
            r#"
SELECT follower_count FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("follower_count"), 1);

        // Delete the relation
        sqlx::query(
            r#"
DELETE FROM relations
WHERE follower_id = $1 AND followed_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement the `follower_count`
        let user_result = sqlx::query(
            r#"
SELECT follower_count FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("follower_count"), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn should_not_update_follower_count_on_the_followed_user_when_hard_deleting_a_soft_deleted_relation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Follow a user
        sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Insert one more relation so that the `follower_count` is always >= 1,
        // which would allow us to bypass the `follower_count > 1` constraint
        // on the user when decrementing the `follower_count`.
        sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should have 2 `follower_count` initially
        let user_result = sqlx::query(
            r#"
SELECT follower_count FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("follower_count"), 2);

        // Soft-delete the relation
        sqlx::query(
            r#"
UPDATE relations
SET deleted_at = NOW()
WHERE follower_id = $1 AND followed_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement the `follower_count`
        let user_result = sqlx::query(
            r#"
SELECT follower_count FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("follower_count"), 1);

        // Delete the relation
        sqlx::query(
            r#"
DELETE FROM relations
WHERE follower_id = $1 AND followed_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should not decrement the `follower_count` any further
        let user_result = sqlx::query(
            r#"
SELECT follower_count FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("follower_count"), 1);

        Ok(())
    }

    // `following_count` counter cache

    #[sqlx::test(fixtures("user"))]
    async fn can_increment_following_count_on_the_follower_user_when_inserting_the_relation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Follow a user
        sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should increment the `following_count`
        let user_result = sqlx::query(
            r#"
SELECT following_count FROM users
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("following_count"), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_update_following_count_on_the_follower_user_when_soft_deleting_and_restoring_the_relation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Follow a user
        sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should have 1 `following_count` initially
        let user_result = sqlx::query(
            r#"
SELECT following_count FROM users
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("following_count"), 1);

        // Soft-delete the relation
        sqlx::query(
            r#"
UPDATE relations
SET deleted_at = NOW()
WHERE follower_id = $1 AND followed_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement the `following_count`
        let user_result = sqlx::query(
            r#"
SELECT following_count FROM users
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("following_count"), 0);

        // Restore the relation
        sqlx::query(
            r#"
UPDATE relations
SET deleted_at = NULL
WHERE follower_id = $1 AND followed_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should increment the `following_count`
        let user_result = sqlx::query(
            r#"
SELECT following_count FROM users
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("following_count"), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_update_following_count_on_the_follower_user_when_hard_deleting_the_relation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Follow a user
        sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should have 1 `following_count` initially
        let user_result = sqlx::query(
            r#"
SELECT following_count FROM users
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("following_count"), 1);

        // Delete the relation
        sqlx::query(
            r#"
DELETE FROM relations
WHERE follower_id = $1 AND followed_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement the `following_count`
        let user_result = sqlx::query(
            r#"
SELECT following_count FROM users
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("following_count"), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn should_not_update_following_count_on_the_follower_user_when_hard_deleting_a_soft_deleted_relation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Follow a user
        sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Insert one more relation so that the `following_count` is always >= 1,
        // which would allow us to bypass the `following_count > 1` constraint
        // on the user when decrementing the `following_count`.
        sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should have 2 `following_count` initially
        let user_result = sqlx::query(
            r#"
SELECT following_count FROM users
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("following_count"), 2);

        // Soft-delete the relation
        sqlx::query(
            r#"
UPDATE relations
SET deleted_at = NOW()
WHERE follower_id = $1 AND followed_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement the `following_count`
        let user_result = sqlx::query(
            r#"
SELECT following_count FROM users
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("following_count"), 1);

        // Delete the relation
        sqlx::query(
            r#"
DELETE FROM relations
WHERE follower_id = $1 AND followed_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should not decrement the `following_count` any further
        let user_result = sqlx::query(
            r#"
SELECT following_count FROM users
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("following_count"), 1);

        Ok(())
    }

    // Notifications

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_notifications_when_the_relation_is_soft_deleted(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Follow a user
        sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Insert a notification
        let insert_result = sqlx::query(
            r#"
INSERT INTO notifications (entity_id, entity_type, notifier_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind(2_i64)
        .bind(0)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Soft-delete the relation
        sqlx::query(
            r#"
UPDATE relations
SET deleted_at = NOW()
WHERE follower_id = $1 AND followed_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
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

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_notification_on_relation_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Follow a user
        sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Insert a notification
        let insert_result = sqlx::query(
            r#"
INSERT INTO notifications (entity_id, entity_type, notifier_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind(2_i64)
        .bind(0)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Delete the relation
        sqlx::query(
            r#"
DELETE FROM relations
WHERE follower_id = $1 AND followed_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
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
