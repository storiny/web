#[cfg(test)]
mod tests {
    use sqlx::PgPool;
    use storiny::constants::sql_states::SqlState;

    #[sqlx::test(fixtures("user"))]
    async fn can_insert_a_notification(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
INSERT INTO notifications (entity_type, entity_id, notifier_id) 
VALUES ($1, $2, $3)
"#,
        )
        .bind(0)
        .bind(1_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_notification_for_soft_deleted_notifier_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Soft-delete the notifier user
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
INSERT INTO notifications (entity_type, entity_id, notifier_id) 
VALUES ($1, $2, $3)
"#,
        )
        .bind(0)
        .bind(1_i64)
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

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_notification_for_deactivated_notifier_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Deactivate the notifier user
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
INSERT INTO notifications (entity_type, entity_id, notifier_id) 
VALUES ($1, $2, $3)
"#,
        )
        .bind(0)
        .bind(1_i64)
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

    //

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_notification_outs_on_notification_hard_delete(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Insert the notification.
        let result = sqlx::query(
            r#"
WITH inserted_notification AS (
    INSERT INTO notifications (entity_type, entity_id, notifier_id) 
    VALUES ($1, $2, $3)
    RETURNING id
)
INSERT INTO notification_outs (notified_id, notification_id) 
VALUES ($3, (SELECT id FROM inserted_notification))
"#,
        )
        .bind(0)
        .bind(1_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Notification out should be present in the database.
        let result = sqlx::query(
            r#"
SELECT 1 FROM notification_outs
WHERE notified_id = $1
"#,
        )
        .bind(1_i64)
        .fetch_all(&mut *conn)
        .await?;

        assert_eq!(result.len(), 1);

        // Delete the notification.
        let result = sqlx::query(
            r#"
DELETE FROM notifications
WHERE entity_id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Notification out should get deleted.
        let result = sqlx::query(
            r#"
SELECT 1 FROM notification_outs
WHERE notified_id = $1
"#,
        )
        .bind(1_i64)
        .fetch_all(&mut *conn)
        .await?;

        assert!(result.is_empty());

        Ok(())
    }
}
