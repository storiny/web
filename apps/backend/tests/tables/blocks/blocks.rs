#[cfg(test)]
mod tests {
    use sqlx::{
        PgPool,
        Row,
    };
    use storiny::constants::sql_states::SqlState;

    #[sqlx::test(fixtures("user"))]
    async fn can_insert_a_block(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
INSERT INTO blocks (blocker_id, blocked_id)
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
    async fn can_reject_block_on_overlap(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Block a user with overlapping IDs
        let result = sqlx::query(
            r#"
INSERT INTO blocks (blocker_id, blocked_id)
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
    async fn can_reject_block_for_soft_deleted_blocker_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Soft-delete the blocker user.
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
INSERT INTO blocks (blocker_id, blocked_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
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
    async fn can_reject_block_for_deactivated_blocker_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Deactivate the blocker user.
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
INSERT INTO blocks (blocker_id, blocked_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
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
    async fn can_reject_block_for_soft_deleted_blocked_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Soft-delete the blocked user.
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
INSERT INTO blocks (blocker_id, blocked_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
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
    async fn can_reject_block_for_deactivated_blocked_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Deactivate the blocked user.
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
INSERT INTO blocks (blocker_id, blocked_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
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

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_followed_relation_when_blocking_a_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Follow a user.
        let insert_result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Block the user.
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

        // Should delete the followed relation.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM relations
    WHERE follower_id = $1 AND followed_id = $2
)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_followed_relation_when_getting_blocked_by_a_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Follow a user.
        let insert_result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Get blocked by the user.
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

        // Should delete the followed relation.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM relations
    WHERE follower_id = $1 AND followed_id = $2
)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_follower_relation_when_blocking_a_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Add a follower.
        let insert_result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Block the user.
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

        // Should delete the follower relation.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM relations
    WHERE follower_id = $1 AND followed_id = $2
)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_follower_relation_when_getting_blocked_by_a_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Add a follower.
        let insert_result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Get blocked by the user.
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

        // Should delete the follower relation.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM relations
    WHERE follower_id = $1 AND followed_id = $2
)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_transmitter_friend_when_blocking_a_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Add a friend.
        let insert_result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Block the user.
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

        // Should delete the friend relation.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM friends
    WHERE transmitter_id = $1 AND receiver_id = $2
)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_transmitter_friend_when_getting_blocked_by_a_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Add a friend.
        let insert_result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Get blocked by the user.
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

        // Should delete the friend relation.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM friends
    WHERE transmitter_id = $1 AND receiver_id = $2
)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_receiver_friend_when_blocking_a_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Add a friend.
        let insert_result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Block the user.
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

        // Should delete the friend relation.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM friends
    WHERE transmitter_id = $1 AND receiver_id = $2
)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_receiver_friend_when_getting_blocked_by_a_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Add a friend.
        let insert_result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Get blocked by the user.
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

        // Should delete the friend relation.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM friends
    WHERE transmitter_id = $1 AND receiver_id = $2
)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }
}
