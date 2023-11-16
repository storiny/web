#[cfg(test)]
mod tests {
    use sqlx::PgPool;
    use uuid::Uuid;

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_insert_a_document(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
            INSERT INTO documents(key, story_id) 
            VALUES ($1, $2)
            "#,
        )
        .bind(Uuid::new_v4())
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }
}
