#[cfg(test)]
mod tests {
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test(fixtures("asset-key"))]
    async fn can_insert_valid_asset_key(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        let result = sqlx::query("INSERT INTO test_domains_asset_key VALUES ('some_key');")
            .execute(&mut *conn)
            .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }
}
