#[cfg(test)]
mod tests {
    use sqlx::{
        PgPool,
        Row,
    };
    use storiny::constants::sql_states::SqlState;

    #[sqlx::test(fixtures("user", "story", "comment", "reply"))]
    async fn can_like_a_reply(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
INSERT INTO reply_likes (user_id, reply_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "comment", "reply"))]
    async fn can_reject_reply_like_for_soft_deleted_reply(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Soft-delete the reply
        sqlx::query(
            r#"
UPDATE replies
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO reply_likes (user_id, reply_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(5_i64)
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

    #[sqlx::test(fixtures("user", "story", "comment", "reply"))]
    async fn can_reject_reply_like_for_soft_deleted_user(pool: PgPool) -> sqlx::Result<()> {
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
INSERT INTO reply_likes (user_id, reply_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(5_i64)
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

    #[sqlx::test(fixtures("user", "story", "comment", "reply"))]
    async fn can_reject_reply_like_for_deactivated_user(pool: PgPool) -> sqlx::Result<()> {
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
INSERT INTO reply_likes (user_id, reply_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(5_i64)
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

    #[sqlx::test(fixtures("user", "story", "comment", "reply"))]
    async fn can_increment_like_count_on_reply_when_inserting_reply_like(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Like the reply
        let insert_result = sqlx::query(
            r#"
INSERT INTO reply_likes (user_id, reply_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Should increment `like_count` on reply
        let result = sqlx::query(
            r#"
SELECT like_count FROM replies
WHERE id = $1
"#,
        )
        .bind(5_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("like_count"), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "comment", "reply"))]
    async fn can_update_like_count_on_reply_when_soft_deleting_and_restoring_reply_like(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Like the reply
        let insert_result = sqlx::query(
            r#"
INSERT INTO reply_likes (user_id, reply_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Should increment `like_count` on reply
        let result = sqlx::query(
            r#"
SELECT like_count FROM replies
WHERE id = $1
"#,
        )
        .bind(5_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("like_count"), 1);

        // Soft-delete the reply like
        sqlx::query(
            r#"
UPDATE reply_likes
SET deleted_at = NOW()
WHERE user_id = $1 AND reply_id = $2
"#,
        )
        .bind(1_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement `like_count` on reply
        let result = sqlx::query(
            r#"
SELECT like_count FROM replies
WHERE id = $1
"#,
        )
        .bind(5_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("like_count"), 0);

        // Restore the reply like
        sqlx::query(
            r#"
UPDATE reply_likes
SET deleted_at = NULL
WHERE user_id = $1 AND reply_id = $2
"#,
        )
        .bind(1_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        // Should increment `like_count` on reply again
        let result = sqlx::query(
            r#"
SELECT like_count FROM replies
WHERE id = $1
"#,
        )
        .bind(5_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("like_count"), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "comment", "reply"))]
    async fn can_decrement_like_count_on_reply_when_hard_deleting_reply_like(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Like the reply
        let insert_result = sqlx::query(
            r#"
INSERT INTO reply_likes (user_id, reply_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Should increment `like_count` on reply
        let result = sqlx::query(
            r#"
SELECT like_count FROM replies
WHERE id = $1
"#,
        )
        .bind(5_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("like_count"), 1);

        // Delete the reply like
        sqlx::query(
            r#"
DELETE FROM reply_likes
WHERE user_id = $1 AND reply_id = $2
"#,
        )
        .bind(1_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement `like_count` on reply
        let result = sqlx::query(
            r#"
SELECT like_count FROM replies
WHERE id = $1
"#,
        )
        .bind(5_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("like_count"), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "comment", "reply"))]
    async fn should_not_decrement_like_count_on_reply_when_hard_deleting_a_soft_deleted_reply_like(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Like the reply
        sqlx::query(
            r#"
INSERT INTO reply_likes (user_id, reply_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        // Insert one more reply like so that the `like_count` is always >= 1,
        // which would allow us to bypass the `like_count > 1` constraint
        // on the reply when decrementing the `like_count`.
        sqlx::query(
            r#"
INSERT INTO reply_likes (user_id, reply_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        // Should increment `like_count` on reply
        let result = sqlx::query(
            r#"
SELECT like_count FROM replies
WHERE id = $1
"#,
        )
        .bind(5_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("like_count"), 2);

        // Soft-delete the reply like
        sqlx::query(
            r#"
UPDATE reply_likes
SET deleted_at = NOW()
WHERE user_id = $1 AND reply_id = $2
"#,
        )
        .bind(1_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement `like_count` on reply
        let result = sqlx::query(
            r#"
SELECT like_count FROM replies
WHERE id = $1
"#,
        )
        .bind(5_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("like_count"), 1);

        // Delete the reply like
        sqlx::query(
            r#"
DELETE FROM reply_likes
WHERE user_id = $1 AND reply_id = $2
"#,
        )
        .bind(1_i64)
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        // Should not decrement `like_count` on reply any further
        let result = sqlx::query(
            r#"
SELECT like_count FROM replies
WHERE id = $1
"#,
        )
        .bind(5_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("like_count"), 1);

        Ok(())
    }
}
