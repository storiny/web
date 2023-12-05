#[cfg(test)]
mod tests {
    use sqlx::{
        PgPool,
        Row,
    };
    use storiny::constants::sql_states::SqlState;

    #[sqlx::test(fixtures("user", "story", "comment"))]
    async fn can_like_a_comment(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
INSERT INTO comment_likes (user_id, comment_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "comment"))]
    async fn can_reject_comment_like_for_soft_deleted_comment(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Soft-delete the comment.
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
INSERT INTO comment_likes (user_id, comment_id)
VALUES ($1, $2)
"#,
        )
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
    async fn can_reject_comment_like_for_soft_deleted_user(pool: PgPool) -> sqlx::Result<()> {
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
INSERT INTO comment_likes (user_id, comment_id)
VALUES ($1, $2)
"#,
        )
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
    async fn can_reject_comment_like_for_deactivated_user(pool: PgPool) -> sqlx::Result<()> {
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
INSERT INTO comment_likes (user_id, comment_id)
VALUES ($1, $2)
"#,
        )
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
    async fn can_increment_like_count_on_comment_when_inserting_comment_like(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Like the comment.
        let insert_result = sqlx::query(
            r#"
INSERT INTO comment_likes (user_id, comment_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Should increment `like_count` on comment
        let result = sqlx::query(
            r#"
SELECT like_count FROM comments
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("like_count"), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "comment"))]
    async fn can_update_like_count_on_comment_when_soft_deleting_and_restoring_comment_like(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Like the comment.
        let insert_result = sqlx::query(
            r#"
INSERT INTO comment_likes (user_id, comment_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Should increment `like_count` on comment
        let result = sqlx::query(
            r#"
SELECT like_count FROM comments
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("like_count"), 1);

        // Soft-delete the comment like.
        sqlx::query(
            r#"
UPDATE comment_likes
SET deleted_at = NOW()
WHERE user_id = $1 AND comment_id = $2
"#,
        )
        .bind(1_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement `like_count` on comment.
        let result = sqlx::query(
            r#"
SELECT like_count FROM comments
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("like_count"), 0);

        // Restore the comment like.
        sqlx::query(
            r#"
UPDATE comment_likes
SET deleted_at = NULL
WHERE user_id = $1 AND comment_id = $2
"#,
        )
        .bind(1_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        // Should increment `like_count` on comment again.
        let result = sqlx::query(
            r#"
SELECT like_count FROM comments
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("like_count"), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "comment"))]
    async fn can_decrement_like_count_on_comment_when_hard_deleting_comment_like(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Like the comment.
        let insert_result = sqlx::query(
            r#"
INSERT INTO comment_likes (user_id, comment_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Should increment `like_count` on comment.
        let result = sqlx::query(
            r#"
SELECT like_count FROM comments
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("like_count"), 1);

        // Delete the comment like.
        sqlx::query(
            r#"
DELETE FROM comment_likes
WHERE user_id = $1 AND comment_id = $2
"#,
        )
        .bind(1_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement `like_count` on comment.
        let result = sqlx::query(
            r#"
SELECT like_count FROM comments
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("like_count"), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "comment"))]
    async fn should_not_decrement_like_count_on_comment_when_hard_deleting_a_soft_deleted_comment_like(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Like the comment.
        sqlx::query(
            r#"
INSERT INTO comment_likes (user_id, comment_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        // Insert one more comment like so that the `like_count` is always >= 1,
        // which would allow us to bypass the `like_count > 1` constraint
        // on the comment when decrementing the `like_count`.
        sqlx::query(
            r#"
INSERT INTO comment_likes (user_id, comment_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        // Should increment `like_count` on comment.
        let result = sqlx::query(
            r#"
SELECT like_count FROM comments
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("like_count"), 2);

        // Soft-delete the comment like.
        sqlx::query(
            r#"
UPDATE comment_likes
SET deleted_at = NOW()
WHERE user_id = $1 AND comment_id = $2
"#,
        )
        .bind(1_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement `like_count` on comment.
        let result = sqlx::query(
            r#"
SELECT like_count FROM comments
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("like_count"), 1);

        // Delete the comment like.
        sqlx::query(
            r#"
DELETE FROM comment_likes
WHERE user_id = $1 AND comment_id = $2
"#,
        )
        .bind(1_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        // Should not decrement `like_count` on comment any further.
        let result = sqlx::query(
            r#"
SELECT like_count FROM comments
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("like_count"), 1);

        Ok(())
    }
}
