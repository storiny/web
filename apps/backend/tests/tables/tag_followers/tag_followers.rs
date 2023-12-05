#[cfg(test)]
mod tests {
    use sqlx::{
        PgPool,
        Row,
    };
    use storiny::constants::sql_states::SqlState;

    #[sqlx::test(fixtures("user", "tag"))]
    async fn can_insert_a_tag_follower(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
INSERT INTO tag_followers (tag_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user", "tag"))]
    async fn can_reject_tag_follower_for_soft_deleted_user(pool: PgPool) -> sqlx::Result<()> {
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
INSERT INTO tag_followers (tag_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
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

    #[sqlx::test(fixtures("user", "tag"))]
    async fn can_reject_tag_follower_for_deactivated_user(pool: PgPool) -> sqlx::Result<()> {
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
INSERT INTO tag_followers (tag_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
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

    #[sqlx::test(fixtures("user", "tag"))]
    async fn can_increment_follower_count_on_tag_when_inserting_tag_follower(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Follow the tag
        let insert_result = sqlx::query(
            r#"
INSERT INTO tag_followers (user_id, tag_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Should increment `follower_count` on tag
        let result = sqlx::query(
            r#"
SELECT follower_count FROM tags
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("follower_count"), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "tag"))]
    async fn can_update_follower_count_on_tag_when_soft_deleting_and_restoring_tag_follower(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Follow the tag
        let insert_result = sqlx::query(
            r#"
INSERT INTO tag_followers (user_id, tag_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Should increment `follower_count` on tag
        let result = sqlx::query(
            r#"
SELECT follower_count FROM tags
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("follower_count"), 1);

        // Soft-delete the tag follower relation
        sqlx::query(
            r#"
UPDATE tag_followers
SET deleted_at = NOW()
WHERE user_id = $1 AND tag_id = $2
"#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement `follower_count` on tag
        let result = sqlx::query(
            r#"
SELECT follower_count FROM tags
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("follower_count"), 0);

        // Restore the tag follower relation
        sqlx::query(
            r#"
UPDATE tag_followers
SET deleted_at = NULL
WHERE user_id = $1 AND tag_id = $2
"#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should increment `follower_count` on tag again
        let result = sqlx::query(
            r#"
SELECT follower_count FROM tags
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("follower_count"), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "tag"))]
    async fn can_decrement_follower_count_on_tag_when_hard_deleting_tag_follower(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Follow the tag
        let insert_result = sqlx::query(
            r#"
INSERT INTO tag_followers (user_id, tag_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Should increment `follower_count` on tag
        let result = sqlx::query(
            r#"
SELECT follower_count FROM tags
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("follower_count"), 1);

        // Delete the tag follower relation
        sqlx::query(
            r#"
DELETE FROM tag_followers
WHERE user_id = $1 AND tag_id = $2
"#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement `follower_count` on tag
        let result = sqlx::query(
            r#"
SELECT follower_count FROM tags
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("follower_count"), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "tag"))]
    async fn should_not_decrement_follower_count_on_tag_when_hard_deleting_a_soft_deleted_tag_follower(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Follow the tag
        sqlx::query(
            r#"
INSERT INTO tag_followers (user_id, tag_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Insert one more tag follower so that the `follower_count` is always >= 1,
        // which would allow us to bypass the `follower_count > 1` constraint
        // on the tag when decrementing the `follower_count`.
        sqlx::query(
            r#"
INSERT INTO tag_followers (user_id, tag_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should increment `follower_count` on tag
        let result = sqlx::query(
            r#"
SELECT follower_count FROM tags
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("follower_count"), 2);

        // Soft-delete the tag follower relation
        sqlx::query(
            r#"
UPDATE tag_followers
SET deleted_at = NOW()
WHERE user_id = $1 AND tag_id = $2
"#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement `follower_count` on tag
        let result = sqlx::query(
            r#"
SELECT follower_count FROM tags
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("follower_count"), 1);

        // Delete the tag follower relation
        sqlx::query(
            r#"
DELETE FROM tag_followers
WHERE user_id = $1 AND tag_id = $2
"#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should not decrement `follower_count` on tag any further
        let result = sqlx::query(
            r#"
SELECT follower_count FROM tags
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("follower_count"), 1);

        Ok(())
    }
}
