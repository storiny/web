#[cfg(test)]
mod tests {
    use sqlx::PgPool;
    use storiny::constants::sql_states::SqlState;

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_insert_a_draft_tag(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
INSERT INTO draft_tags(name, story_id)
VALUES ($1, $2)
"#,
        )
        .bind("sample".to_string())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_insert_a_draft_tag_for_soft_deleted_published_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Publish and soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET
    first_published_at = NOW(),
    deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO draft_tags(name, story_id)
VALUES ($1, $2)
"#,
        )
        .bind("sample".to_string())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_insert_a_draft_tag_for_unpublished_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set `first_published_at` on the story
        sqlx::query(
            r#"
UPDATE stories
SET
    first_published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO draft_tags(name, story_id)
VALUES ($1, $2)
"#,
        )
        .bind("sample".to_string())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_reject_draft_tag_for_published_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Publish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO draft_tags(name, story_id)
VALUES ($1, $2)
"#,
        )
        .bind("sample".to_string())
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
}
