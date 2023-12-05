#[cfg(test)]
mod tests {
    use sqlx::PgPool;

    #[sqlx::test(fixtures("user"))]
    async fn can_insert_a_user_status(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
INSERT INTO user_statuses (user_id, text, emoji)
VALUES ($1, $2, $3)
"#,
        )
        .bind(1_i64)
        .bind("Some status text")
        .bind("1f90c")
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }
}
