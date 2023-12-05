#[cfg(test)]
mod tests {
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test]
    async fn can_insert_a_valid_report(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
INSERT INTO reports (entity_id, type, reason)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind(1_i64)
        .bind("report_type")
        .bind("Sample reason".to_string())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.try_get::<i64, _>("id").is_ok());

        Ok(())
    }
}
