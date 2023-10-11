#[cfg(test)]
mod tests {
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_like_a_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
            INSERT INTO story_likes(user_id, story_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(1i64)
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_increment_like_count_on_story_when_inserting_story_like(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Like the story
        let insert_result = sqlx::query(
            r#"
            INSERT INTO story_likes(user_id, story_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(1i64)
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Should increment `like_count` on story
        let result = sqlx::query(
            r#"
            SELECT like_count FROM stories
            WHERE id = $1
            "#,
        )
        .bind(3i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i64, _>("like_count"), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_update_like_count_on_story_when_soft_deleting_and_restoring_story_like(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Like the story
        let insert_result = sqlx::query(
            r#"
            INSERT INTO story_likes(user_id, story_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(1i64)
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Should increment `like_count` on story
        let result = sqlx::query(
            r#"
            SELECT like_count FROM stories
            WHERE id = $1
            "#,
        )
        .bind(3i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i64, _>("like_count"), 1);

        // Soft-delete the story like
        sqlx::query(
            r#"
            UPDATE story_likes
            SET deleted_at = now()
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement `like_count` on story
        let result = sqlx::query(
            r#"
            SELECT like_count FROM stories
            WHERE id = $1
            "#,
        )
        .bind(3i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i64, _>("like_count"), 0);

        // Restore the story like
        sqlx::query(
            r#"
            UPDATE story_likes
            SET deleted_at = NULL
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        // Should increment `like_count` on story again
        let result = sqlx::query(
            r#"
            SELECT like_count FROM stories
            WHERE id = $1
            "#,
        )
        .bind(3i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i64, _>("like_count"), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_decrement_like_count_on_story_when_hard_deleting_story_like(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Like the story
        let insert_result = sqlx::query(
            r#"
            INSERT INTO story_likes(user_id, story_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(1i64)
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Should increment `like_count` on story
        let result = sqlx::query(
            r#"
            SELECT like_count FROM stories
            WHERE id = $1
            "#,
        )
        .bind(3i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i64, _>("like_count"), 1);

        // Delete the story like
        sqlx::query(
            r#"
            DELETE FROM story_likes
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement `like_count` on story
        let result = sqlx::query(
            r#"
            SELECT like_count FROM stories
            WHERE id = $1
            "#,
        )
        .bind(3i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i64, _>("like_count"), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story"))]
    async fn should_not_decrement_like_count_on_story_when_hard_deleting_a_soft_deleted_story_like(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Like the story
        sqlx::query(
            r#"
            INSERT INTO story_likes(user_id, story_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(1i64)
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        // Insert one more story like so that the `like_count` is always >= 1,
        // which would allow us to bypass the `like_count > 1` constraint
        // on the story when decrementing the `like_count`.
        sqlx::query(
            r#"
            INSERT INTO story_likes(user_id, story_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(2i64)
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        // Should increment `like_count` on story
        let result = sqlx::query(
            r#"
            SELECT like_count FROM stories
            WHERE id = $1
            "#,
        )
        .bind(3i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i64, _>("like_count"), 2);

        // Soft-delete the story like
        sqlx::query(
            r#"
            UPDATE story_likes
            SET deleted_at = now()
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement `like_count` on story
        let result = sqlx::query(
            r#"
            SELECT like_count FROM stories
            WHERE id = $1
            "#,
        )
        .bind(3i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i64, _>("like_count"), 1);

        // Delete the story like
        sqlx::query(
            r#"
            DELETE FROM story_likes
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        // Should not decrement `like_count` on story any further
        let result = sqlx::query(
            r#"
            SELECT like_count FROM stories
            WHERE id = $1
            "#,
        )
        .bind(3i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i64, _>("like_count"), 1);

        Ok(())
    }
}
