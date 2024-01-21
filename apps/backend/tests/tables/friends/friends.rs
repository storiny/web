#[cfg(test)]
mod tests {
    use sqlx::{
        PgPool,
        Row,
    };
    use storiny::{
        constants::sql_states::SqlState,
        grpc::defs::privacy_settings_def::v1::IncomingFriendRequest,
    };

    #[sqlx::test(fixtures("user"))]
    async fn can_send_a_friend_request(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
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
    async fn can_reject_friend_on_overlap(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Insert friend with overlapping IDs
        let result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
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
    async fn can_reject_friend_for_soft_deleted_transmitter_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Soft-delete the transmitter user
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
INSERT INTO friends (transmitter_id, receiver_id)
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
    async fn can_reject_friend_for_deactivated_transmitter_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Deactivate the transmitter user
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
INSERT INTO friends (transmitter_id, receiver_id)
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
    async fn can_reject_friend_for_soft_deleted_receiver_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Soft-delete the receiver user
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
INSERT INTO friends (transmitter_id, receiver_id)
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
    async fn can_reject_friend_for_deactivated_receiver_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Deactivate the receiver user
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
INSERT INTO friends (transmitter_id, receiver_id)
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

    // `friend_count` counter cache

    #[sqlx::test(fixtures("user"))]
    async fn can_increment_friend_count_when_accepting_a_friend_request(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Send a friend request
        sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should not increment `friend_count`
        let user_result = sqlx::query(
            r#"
SELECT friend_count FROM users
WHERE id IN ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .fetch_all(&mut *conn)
        .await?;

        for result in user_result {
            assert_eq!(result.get::<i32, _>("friend_count"), 0);
        }

        // Accept the friend request
        sqlx::query(
            r#"
UPDATE friends
SET accepted_at = NOW()
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should increment the `friend_count`
        let user_result = sqlx::query(
            r#"
SELECT friend_count FROM users
WHERE id IN ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .fetch_all(&mut *conn)
        .await?;

        for result in user_result {
            assert_eq!(result.get::<i32, _>("friend_count"), 1);
        }

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_update_friend_count_when_soft_deleting_and_restoring_the_friend(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Send a friend request
        sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Accept the friend request
        sqlx::query(
            r#"
UPDATE friends
SET accepted_at = NOW()
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should have 1 `friend_count` initially
        let user_result = sqlx::query(
            r#"
SELECT friend_count FROM users
WHERE id IN ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .fetch_all(&mut *conn)
        .await?;

        for result in user_result {
            assert_eq!(result.get::<i32, _>("friend_count"), 1);
        }

        // Soft-delete the friend
        sqlx::query(
            r#"
UPDATE friends
SET deleted_at = NOW()
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement the `friend_count`
        let user_result = sqlx::query(
            r#"
SELECT friend_count FROM users
WHERE id IN ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .fetch_all(&mut *conn)
        .await?;

        for result in user_result {
            assert_eq!(result.get::<i32, _>("friend_count"), 0);
        }

        // Restore the friend
        sqlx::query(
            r#"
UPDATE friends
SET deleted_at = NULL
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should increment the `friend_count`
        let user_result = sqlx::query(
            r#"
SELECT friend_count FROM users
WHERE id IN ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .fetch_all(&mut *conn)
        .await?;

        for result in user_result {
            assert_eq!(result.get::<i32, _>("friend_count"), 1);
        }

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_update_friend_count_when_hard_deleting_the_friend(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Send a friend request
        sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Accept the friend request
        sqlx::query(
            r#"
UPDATE friends
SET accepted_at = NOW()
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should have 1 `friend_count` initially
        let user_result = sqlx::query(
            r#"
SELECT friend_count FROM users
WHERE id IN ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .fetch_all(&mut *conn)
        .await?;

        for result in user_result {
            assert_eq!(result.get::<i32, _>("friend_count"), 1);
        }

        // Delete the friend
        sqlx::query(
            r#"
DELETE FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement the `friend_count`
        let user_result = sqlx::query(
            r#"
SELECT friend_count FROM users
WHERE id IN ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .fetch_all(&mut *conn)
        .await?;

        for result in user_result {
            assert_eq!(result.get::<i32, _>("friend_count"), 0);
        }

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn should_not_update_friend_count_when_hard_deleting_a_soft_deleted_friend(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Send a friend request
        sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Accept the friend request
        sqlx::query(
            r#"
UPDATE friends
SET accepted_at = NOW()
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Insert two more friends so that the `friend_count` is always >= 1,
        // which would allow us to bypass the `friend_count > 1` constraint
        // on the user when decrementing the `friend_count`.
        sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
UPDATE friends
SET accepted_at = NOW()
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(3_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        //

        sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
UPDATE friends
SET accepted_at = NOW()
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(3_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Should have 2 `friend_count` initially
        let user_result = sqlx::query(
            r#"
SELECT friend_count FROM users
WHERE id IN ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .fetch_all(&mut *conn)
        .await?;

        for result in user_result {
            assert_eq!(result.get::<i32, _>("friend_count"), 2);
        }

        // Soft-delete the friend
        sqlx::query(
            r#"
UPDATE friends
SET deleted_at = NOW()
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement the `friend_count`
        let user_result = sqlx::query(
            r#"
SELECT friend_count FROM users
WHERE id IN ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .fetch_all(&mut *conn)
        .await?;

        for result in user_result {
            assert_eq!(result.get::<i32, _>("friend_count"), 1);
        }

        // Delete the friend
        sqlx::query(
            r#"
DELETE FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should not decrement the `friend_count` any further
        let user_result = sqlx::query(
            r#"
SELECT friend_count FROM users
WHERE id IN ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .fetch_all(&mut *conn)
        .await?;

        for result in user_result {
            assert_eq!(result.get::<i32, _>("friend_count"), 1);
        }

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user"))]
    async fn should_not_increment_friend_count_when_inserting_a_friend_request(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Send a friend request
        sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should not increment `friend_count`
        let user_result = sqlx::query(
            r#"
SELECT friend_count FROM users
WHERE id IN ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .fetch_all(&mut *conn)
        .await?;

        for result in user_result {
            assert_eq!(result.get::<i32, _>("friend_count"), 0);
        }

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn should_not_update_friend_count_when_soft_deleting_and_restoring_the_non_accepted_friend(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Send a friend request
        sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Soft-delete the friend
        sqlx::query(
            r#"
UPDATE friends
SET deleted_at = NOW()
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Restore the friend
        sqlx::query(
            r#"
UPDATE friends
SET deleted_at = NULL
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should not increment the `friend_count`
        let user_result = sqlx::query(
            r#"
SELECT friend_count FROM users
WHERE id IN ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .fetch_all(&mut *conn)
        .await?;

        for result in user_result {
            assert_eq!(result.get::<i32, _>("friend_count"), 0);
        }

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn should_not_update_friend_count_when_hard_deleting_the_non_accepted_friend(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Send a friend request
        sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Insert two more friends so that the `friend_count` is always >= 1,
        // which would allow us to bypass the `friend_count > 1` constraint
        // on the user when decrementing the `friend_count`.
        sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
UPDATE friends
SET accepted_at = NOW()
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(3_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        //

        sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
UPDATE friends
SET accepted_at = NOW()
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(3_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Should have 1 `friend_count` initially
        let user_result = sqlx::query(
            r#"
SELECT friend_count FROM users
WHERE id IN ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .fetch_all(&mut *conn)
        .await?;

        for result in user_result {
            assert_eq!(result.get::<i32, _>("friend_count"), 1);
        }

        // Delete the friend
        sqlx::query(
            r#"
DELETE FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should not decrement the `friend_count`
        let user_result = sqlx::query(
            r#"
SELECT friend_count FROM users
WHERE id IN ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .fetch_all(&mut *conn)
        .await?;

        for result in user_result {
            assert_eq!(result.get::<i32, _>("friend_count"), 1);
        }

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn should_not_update_friend_count_when_hard_deleting_a_soft_deleted_non_accepted_friend(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Send a friend request
        sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Insert two more friends so that the `friend_count` is always >= 1,
        // which would allow us to bypass the `friend_count > 1` constraint
        // on the user when decrementing the `friend_count`.
        sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
UPDATE friends
SET accepted_at = NOW()
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(3_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        //

        sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
UPDATE friends
SET accepted_at = NOW()
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(3_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Should have 1 `friend_count` initially
        let user_result = sqlx::query(
            r#"
SELECT friend_count FROM users
WHERE id IN ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .fetch_all(&mut *conn)
        .await?;

        for result in user_result {
            assert_eq!(result.get::<i32, _>("friend_count"), 1);
        }

        // Soft-delete the friend
        sqlx::query(
            r#"
UPDATE friends
SET deleted_at = NOW()
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should not decrement the `friend_count`
        let user_result = sqlx::query(
            r#"
SELECT friend_count FROM users
WHERE id IN ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .fetch_all(&mut *conn)
        .await?;

        for result in user_result {
            assert_eq!(result.get::<i32, _>("friend_count"), 1);
        }

        // Delete the friend
        sqlx::query(
            r#"
DELETE FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Should not decrement the `friend_count`
        let user_result = sqlx::query(
            r#"
SELECT friend_count FROM users
WHERE id IN ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .fetch_all(&mut *conn)
        .await?;

        for result in user_result {
            assert_eq!(result.get::<i32, _>("friend_count"), 1);
        }

        Ok(())
    }

    // `incoming_friend_requests` setting

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_friend_for_none_incoming_friend_requests_setting(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set `incoming_friend_requests` to none
        sqlx::query(
            r#"
UPDATE users
SET incoming_friend_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingFriendRequest::None as i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
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
            SqlState::ReceiverNotAcceptingFriendRequest.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "following"))]
    async fn can_reject_friend_for_none_incoming_friend_requests_setting_from_following_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set `incoming_friend_requests` to none
        sqlx::query(
            r#"
UPDATE users
SET incoming_friend_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingFriendRequest::None as i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
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
            SqlState::ReceiverNotAcceptingFriendRequest.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "fof"))]
    async fn can_reject_friend_for_none_incoming_friend_requests_setting_from_fof(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set `incoming_friend_requests` to none
        sqlx::query(
            r#"
UPDATE users
SET incoming_friend_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingFriendRequest::None as i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
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
            SqlState::ReceiverNotAcceptingFriendRequest.to_string()
        );

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_friend_for_following_incoming_friend_requests_setting(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set `incoming_friend_requests` to following
        sqlx::query(
            r#"
UPDATE users
SET incoming_friend_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingFriendRequest::Following as i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
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
            SqlState::ReceiverNotAcceptingFriendRequest.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "following"))]
    async fn can_accept_friend_for_following_incoming_friend_requests_setting_from_following_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set `incoming_friend_requests` to following
        sqlx::query(
            r#"
UPDATE users
SET incoming_friend_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingFriendRequest::Following as i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "fof"))]
    async fn can_reject_friend_for_following_incoming_friend_requests_setting_from_fof(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set `incoming_friend_requests` to following
        sqlx::query(
            r#"
UPDATE users
SET incoming_friend_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingFriendRequest::Following as i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
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
            SqlState::ReceiverNotAcceptingFriendRequest.to_string()
        );

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_friend_for_fof_incoming_friend_requests_setting(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set `incoming_friend_requests` to FOF
        sqlx::query(
            r#"
UPDATE users
SET incoming_friend_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingFriendRequest::Fof as i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
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
            SqlState::ReceiverNotAcceptingFriendRequest.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "following"))]
    async fn can_reject_friend_for_fof_incoming_friend_requests_setting_from_following_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set `incoming_friend_requests` to FOF
        sqlx::query(
            r#"
UPDATE users
SET incoming_friend_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingFriendRequest::Fof as i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
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
            SqlState::ReceiverNotAcceptingFriendRequest.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "fof"))]
    async fn can_accept_friend_for_fof_incoming_friend_requests_setting_from_fof(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set `incoming_friend_requests` to FOF
        sqlx::query(
            r#"
UPDATE users
SET incoming_friend_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingFriendRequest::Fof as i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }

    // Notifications

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_notifications_when_the_friend_is_soft_deleted(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Send a friend request
        sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
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

        // Soft-delete the friend
        sqlx::query(
            r#"
UPDATE friends
SET deleted_at = NOW()
WHERE transmitter_id = $1 AND receiver_id = $2
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
    async fn can_delete_notification_on_friend_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Send a friend request
        sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
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

        // Delete the friend
        sqlx::query(
            r#"
DELETE FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
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
