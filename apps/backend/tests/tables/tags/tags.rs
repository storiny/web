#[cfg(test)]
mod tests {
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test]
    async fn can_insert_a_valid_tag(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
INSERT INTO tags (name)
VALUES ($1)
"#,
        )
        .bind("some-tag".to_string())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);
        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_valid_tag_names(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let cases: Vec<&str> = vec!["abcd", "ab-cd", "0abcd", "ab0cd", "abcd0"];

        for case in cases {
            let result = sqlx::query(
                r#"
INSERT INTO tags (name)
VALUES ($1)
"#,
            )
            .bind(case.to_string())
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);
        }

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_invalid_tag_names(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let cases: Vec<&str> = vec!["", "ABCD", "a@", "abcd#", "abcD", "ab_cd"];

        for case in cases {
            let result = sqlx::query(
                r#"
INSERT INTO tags (name)
VALUES ($1)
"#,
            )
            .bind(case.to_string())
            .execute(&mut *conn)
            .await;

            assert!(matches!(result.unwrap_err(), sqlx::Error::Database(_)));
        }

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_delete_tag_when_story_count_reaches_zero(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
INSERT INTO tags (name)
VALUES ($1)
RETURNING id
"#,
        )
        .bind("some-tag".to_string())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.try_get::<i64, _>("id").is_ok());

        // Insert a story tag
        sqlx::query(
            r#"
INSERT INTO story_tags (tag_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(result.get::<i64, _>("id"))
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Delete the story tag
        sqlx::query(
            r#"
DELETE FROM story_tags
WHERE tag_id = $1 AND story_id = $2
"#,
        )
        .bind(result.get::<i64, _>("id"))
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Tag should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM tags
    WHERE id = $1
)
"#,
        )
        .bind(result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_delete_story_tag_when_the_tag_is_deleted(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
INSERT INTO tags (name)
VALUES ($1)
RETURNING id
"#,
        )
        .bind("some-tag".to_string())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.try_get::<i64, _>("id").is_ok());

        // Insert a story tag
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_tags (tag_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(result.get::<i64, _>("id"))
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the tag
        sqlx::query(
            r#"
DELETE FROM tags
WHERE id = $1
"#,
        )
        .bind(result.get::<i64, _>("id"))
        .execute(&mut *conn)
        .await?;

        // Story tag should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM story_tags
    WHERE tag_id = $1 AND story_id = $2
)
"#,
        )
        .bind(result.get::<i64, _>("id"))
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_tag_follower_when_the_tag_is_deleted(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
INSERT INTO tags (name)
VALUES ($1)
RETURNING id
"#,
        )
        .bind("some-tag".to_string())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.try_get::<i64, _>("id").is_ok());

        // Insert a tag follower
        let insert_result = sqlx::query(
            r#"
INSERT INTO tag_followers (tag_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(result.get::<i64, _>("id"))
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the tag
        sqlx::query(
            r#"
DELETE FROM tags
WHERE id = $1
"#,
        )
        .bind(result.get::<i64, _>("id"))
        .execute(&mut *conn)
        .await?;

        // Tag follower should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM tag_followers
    WHERE tag_id = $1 AND user_id = $2
)
"#,
        )
        .bind(result.get::<i64, _>("id"))
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }
}
