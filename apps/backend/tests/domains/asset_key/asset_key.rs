#[cfg(test)]
mod tests {
    use sqlx::PgPool;

    #[sqlx::test(fixtures("asset-key"))]
    async fn can_insert_valid_asset_key(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
            INSERT INTO test_domains_asset_key
            VALUES ($1)
            "#,
        )
        .bind("some_key")
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);
        Ok(())
    }

    #[sqlx::test(fixtures("asset-key"))]
    async fn can_reject_overflowing_asset_key(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
            INSERT INTO test_domains_asset_key
            VALUES ($1)
            "#,
        )
        .bind("x".repeat(130))
        .execute(&mut *conn)
        .await;

        assert!(matches!(result.unwrap_err(), sqlx::Error::Database(_)));
        Ok(())
    }
}
