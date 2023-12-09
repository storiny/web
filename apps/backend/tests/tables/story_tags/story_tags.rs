#[cfg(test)]
mod tests {
    use sqlx::{
        PgPool,
        Row,
    };
    use storiny::constants::sql_states::SqlState;

    #[sqlx::test(fixtures("user", "story", "tag"))]
    async fn can_insert_a_story_tag(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
INSERT INTO story_tags (tag_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(4_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "tag"))]
    async fn can_reject_story_tag_for_soft_deleted_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO story_tags (tag_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(4_i64)
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

    #[sqlx::test(fixtures("user", "story", "tag"))]
    async fn can_reject_story_tag_for_unpublished_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Unpublish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO story_tags (tag_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(4_i64)
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

    #[sqlx::test(fixtures("user", "story", "tag"))]
    async fn can_increment_story_count_on_tag_when_inserting_story_tag(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Insert a story tag
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_tags (tag_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(4_i64)
        .bind(2_i64)
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
        .bind(4_i64)
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
INSERT INTO story_tags (tag_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(4_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Insert one more story tag as the tag would get deleted
        // when the `story_count` reaches 0
        sqlx::query(
            r#"
INSERT INTO story_tags (tag_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(4_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should increment `story_count` on tag
        let result = sqlx::query(
            r#"
SELECT story_count FROM tags
WHERE id = $1
"#,
        )
        .bind(4_i64)
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
        .bind(4_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement `story_count` on tag
        let result = sqlx::query(
            r#"
SELECT story_count FROM tags
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("story_count"), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "tag"))]
    async fn can_delete_notification_on_story_tag_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Insert a story tag
        let story_tag_result = sqlx::query(
            r#"
INSERT INTO story_tags (tag_id, story_id)
VALUES ($1, $2)
RETURNING id
"#,
        )
        .bind(4_i64)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(story_tag_result.try_get::<i64, _>("id").is_ok());
        let story_tag_id = story_tag_result.get::<i64, _>("id");

        // Insert a notification
        let notification_result = sqlx::query(
            r#"
INSERT INTO notifications (entity_id, entity_type, notifier_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind(story_tag_id)
        .bind(0)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(notification_result.try_get::<i64, _>("id").is_ok());

        // Delete the story tag
        sqlx::query(
            r#"
DELETE FROM story_tags
WHERE id = $1
"#,
        )
        .bind(story_tag_id)
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
        .bind(notification_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }
}
