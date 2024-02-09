#[cfg(test)]
mod tests {
    use sqlx::{
        PgPool,
        Row,
    };
    use storiny::constants::notification_entity_type::NotificationEntityType;

    #[sqlx::test(fixtures("notify_tag_followers"))]
    async fn can_notify_tag_followers(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        sqlx::query(r#"SELECT public.notify_tag_followers($1, $2)"#)
            .bind(6_i64)
            .bind(NotificationEntityType::StoryAddByTag as i16)
            .execute(&mut *conn)
            .await?;

        // Notifications should be present in the database.
        let result = sqlx::query(
            r#"
SELECT 1 FROM notification_outs n_out
    INNER JOIN notifications n
        ON n.id = n_out.notification_id
        AND n.entity_type = $1
"#,
        )
        .bind(NotificationEntityType::StoryAddByTag as i16)
        .fetch_all(&mut *conn)
        .await?;

        assert_eq!(result.len(), 3);

        Ok(())
    }

    #[sqlx::test(fixtures("notify_tag_followers"))]
    async fn can_handle_private_writer(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Make the writer private and add a friend.
        let result = sqlx::query(
            r#"
WITH updated_user AS (
    UPDATE users
    SET is_private = TRUE
    WHERE id = $1
)
INSERT INTO friends (transmitter_id, receiver_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        sqlx::query(r#"SELECT public.notify_tag_followers($1, $2)"#)
            .bind(6_i64)
            .bind(NotificationEntityType::StoryAddByTag as i16)
            .execute(&mut *conn)
            .await?;

        // Should only insert a single notification for the friend.
        let result = sqlx::query(
            r#"
SELECT notified_id FROM notification_outs n_out
    INNER JOIN notifications n
        ON n.id = n_out.notification_id
        AND n.entity_type = $1
"#,
        )
        .bind(NotificationEntityType::StoryAddByTag as i16)
        .fetch_all(&mut *conn)
        .await?;

        assert_eq!(result.len(), 1);
        assert_eq!(result[0].get::<i64, _>("notified_id"), 3_i64);

        Ok(())
    }
}
