#[cfg(test)]
mod tests {
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test]
    async fn can_truncate_a_long_string(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
SELECT public.truncate_str('a long string', 4) as str
"#,
        )
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<String, _>("str"), "a lo…".to_string());
        Ok(())
    }

    #[sqlx::test]
    async fn should_not_truncate_a_short_string(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
SELECT public.truncate_str('a short string', 64) as str
"#,
        )
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<String, _>("str"), "a short string".to_string());
        Ok(())
    }
}
