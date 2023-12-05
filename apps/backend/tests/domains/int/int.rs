#[cfg(test)]
mod tests {
    use sqlx::PgPool;

    #[sqlx::test(fixtures("int"))]
    async fn can_insert_valid_uint_value(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
INSERT INTO test_domains_uint
VALUES ($1, $2)
"#,
        )
        .bind(1234i32)
        .bind(1234_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);
        Ok(())
    }

    #[sqlx::test(fixtures("int"))]
    async fn can_reject_signed_values(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let signed_int32_result = sqlx::query(
            r#"
INSERT INTO test_domains_uint
VALUES ($1)
"#,
        )
        .bind(-1i32)
        .execute(&mut *conn)
        .await;

        assert!(matches!(
            signed_int32_result.unwrap_err(),
            sqlx::Error::Database(_)
        ));

        let signed_int64_result = sqlx::query(
            r#"
INSERT INTO test_domains_uint
VALUES (DEFAULT, $1)
"#,
        )
        .bind(-1_i64)
        .execute(&mut *conn)
        .await;

        assert!(matches!(
            signed_int64_result.unwrap_err(),
            sqlx::Error::Database(_)
        ));
        Ok(())
    }
}
