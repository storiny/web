#[cfg(test)]
mod tests {
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test(fixtures("user", "story", "tag"))]
    async fn can_insert_a_story_tag(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
            INSERT INTO story_tags(tag_id, story_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(4i64)
        .bind(2i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "tag"))]
    async fn can_increment_story_count_on_tag_when_inserting_story_tag(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Insert a story tag
        let insert_result = sqlx::query(
            r#"
            INSERT INTO story_tags(tag_id, story_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(4i64)
        .bind(2i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Should increment `story_count` on tag
        let result = sqlx::query(
            r#"
            SELECT story_count FROM tags
            WHERE id = $1
            "#,
        )
        .bind(4i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("story_count"), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "tag"))]
    async fn can_decrement_story_count_on_tag_when_deleting_story_tag(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Insert a story tag
        let insert_result = sqlx::query(
            r#"
            INSERT INTO story_tags(tag_id, story_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(4i64)
        .bind(2i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Insert one more story tag as the tag would get deleted
        // when the `story_count` reaches 0
        sqlx::query(
            r#"
            INSERT INTO story_tags(tag_id, story_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(4i64)
        .bind(3i64)
        .execute(&mut *conn)
        .await?;

        // Should increment `story_count` on tag
        let result = sqlx::query(
            r#"
            SELECT story_count FROM tags
            WHERE id = $1
            "#,
        )
        .bind(4i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("story_count"), 2);

        // Delete the story tag
        sqlx::query(
            r#"
            DELETE FROM story_tags
            WHERE tag_id = $1 AND story_id = $2
            "#,
        )
        .bind(4i64)
        .bind(2i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement `story_count` on tag
        let result = sqlx::query(
            r#"
            SELECT story_count FROM tags
            WHERE id = $1
            "#,
        )
        .bind(4i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("story_count"), 1);

        Ok(())
    }
}
