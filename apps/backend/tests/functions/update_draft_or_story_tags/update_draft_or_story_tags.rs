#[cfg(test)]
mod tests {
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test(fixtures("draft"))]
    async fn can_update_tags_for_a_draft(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set initial tags for the draft.
        let result = sqlx::query(
            r#"
INSERT INTO draft_tags(name, story_id)
VALUES ($1, $3), ($2, $3)
"#,
        )
        .bind("tag-0")
        .bind("tag-1")
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 2);

        let result = sqlx::query(
            r#"
SELECT name FROM draft_tags
WHERE story_id = $1
ORDER BY name
"#,
        )
        .bind(2_i64)
        .fetch_all(&mut *conn)
        .await?;

        assert_eq!(result.len(), 2);
        assert_eq!(result[0].get::<String, _>("name"), "tag-0");
        assert_eq!(result[1].get::<String, _>("name"), "tag-1");

        // Update the tags.
        sqlx::query(r#"SELECT public.update_draft_or_story_tags($1, $2, $3)"#)
            .bind(2_i64)
            .bind(1_i64)
            .bind(vec!["tag-1", "tag-2", "tag-3"])
            .execute(&mut *conn)
            .await?;

        // Should insert the tags into `draft_tags`.
        let result = sqlx::query(
            r#"
SELECT name FROM draft_tags
WHERE story_id = $1
ORDER BY name
"#,
        )
        .bind(2_i64)
        .fetch_all(&mut *conn)
        .await?;

        assert_eq!(result.len(), 3);
        assert_eq!(result[0].get::<String, _>("name"), "tag-1");
        assert_eq!(result[1].get::<String, _>("name"), "tag-2");
        assert_eq!(result[2].get::<String, _>("name"), "tag-3");

        Ok(())
    }

    #[sqlx::test(fixtures("draft"))]
    async fn can_remove_all_the_tags_for_a_draft(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set initial tags for the draft.
        let result = sqlx::query(
            r#"
INSERT INTO draft_tags(name, story_id)
VALUES ($1, $3), ($2, $3)
"#,
        )
        .bind("tag-1")
        .bind("tag-2")
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 2);

        sqlx::query(r#"SELECT public.update_draft_or_story_tags($1, $2, $3)"#)
            .bind(2_i64)
            .bind(1_i64)
            .bind(Vec::new() as Vec<String>)
            .execute(&mut *conn)
            .await?;

        // Should remove all the tags.
        let result = sqlx::query(
            r#"
SELECT name FROM draft_tags
WHERE story_id = $1
ORDER BY name
"#,
        )
        .bind(2_i64)
        .fetch_all(&mut *conn)
        .await?;

        assert_eq!(result.len(), 0);

        Ok(())
    }

    //

    #[sqlx::test(fixtures("story"))]
    async fn can_update_tags_for_a_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set initial tags for the story.
        let result = sqlx::query(
            r#"
INSERT INTO story_tags (tag_id, story_id)
VALUES ($1, $3), ($2, $3)
"#,
        )
        .bind(3_i64)
        .bind(4_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 2);

        let result = sqlx::query(
            r#"
SELECT t.name FROM story_tags st
    INNER JOIN tags t
        ON st.tag_id = t.id
WHERE st.story_id = $1
ORDER BY t.name
"#,
        )
        .bind(2_i64)
        .fetch_all(&mut *conn)
        .await?;

        assert_eq!(result.len(), 2);
        assert_eq!(result[0].get::<String, _>("name"), "tag-0");
        assert_eq!(result[1].get::<String, _>("name"), "tag-1");

        // Update the tags.
        sqlx::query(r#"SELECT public.update_draft_or_story_tags($1, $2, $3)"#)
            .bind(2_i64)
            .bind(1_i64)
            .bind(vec!["tag-1", "tag-2", "tag-3"])
            .execute(&mut *conn)
            .await?;

        // Should insert the tags into `story_tags`.
        let result = sqlx::query(
            r#"
SELECT t.name FROM story_tags st
    INNER JOIN tags t
        ON st.tag_id = t.id
WHERE st.story_id = $1
ORDER BY t.name
"#,
        )
        .bind(2_i64)
        .fetch_all(&mut *conn)
        .await?;

        assert_eq!(result.len(), 3);
        assert_eq!(result[0].get::<String, _>("name"), "tag-1");
        assert_eq!(result[1].get::<String, _>("name"), "tag-2");
        assert_eq!(result[2].get::<String, _>("name"), "tag-3");

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_remove_all_the_tags_for_a_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set initial tags for the story.
        let result = sqlx::query(
            r#"
INSERT INTO story_tags (tag_id, story_id)
VALUES ($1, $3), ($2, $3)
"#,
        )
        .bind(3_i64)
        .bind(4_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 2);

        sqlx::query(r#"SELECT public.update_draft_or_story_tags($1, $2, $3)"#)
            .bind(2_i64)
            .bind(1_i64)
            .bind(Vec::new() as Vec<String>)
            .execute(&mut *conn)
            .await?;

        // Should remove all the tags.
        let result = sqlx::query(
            r#"
SELECT t.name FROM story_tags st
    INNER JOIN tags t
        ON st.tag_id = t.id
WHERE st.story_id = $1
ORDER BY t.name
"#,
        )
        .bind(2_i64)
        .fetch_all(&mut *conn)
        .await?;

        assert_eq!(result.len(), 0);

        Ok(())
    }
}
