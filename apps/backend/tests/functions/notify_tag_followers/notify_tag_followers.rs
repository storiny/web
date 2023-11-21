#[cfg(test)]
mod tests {
    use sqlx::PgPool;
    use storiny::models::notification::NotificationEntityType;

    #[sqlx::test(fixtures("notify_tag_followers"))]
    async fn can_notify_tag_followers(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Call the function
        sqlx::query(r#"SELECT public.notify_tag_followers($1, $2)"#)
            .bind(5_i64)
            .bind(NotificationEntityType::StoryAddByTag as i16)
            .execute(&mut *conn)
            .await?;

        // Notifications should be present in the database
        let result = sqlx::query(
            r#"
            WITH notification AS (
                SELECT id FROM notifications
                WHERE entity_id = $1 AND entity_type = $2
            )
            SELECT 1 FROM notification_outs
            WHERE notification_id = (SELECT id FROM notification)
            "#,
        )
        .bind(6_i64)
        .bind(NotificationEntityType::StoryAddByTag as i16)
        .fetch_all(&mut *conn)
        .await?;

        assert_eq!(result.len(), 2);

        Ok(())
    }
}
