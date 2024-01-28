#[cfg(test)]
mod tests {
    use sqlx::PgPool;
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
}
