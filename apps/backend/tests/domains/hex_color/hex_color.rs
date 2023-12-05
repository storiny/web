#[cfg(test)]
mod tests {
    use sqlx::PgPool;

    #[sqlx::test(fixtures("hex_color"))]
    async fn can_insert_valid_hex_color(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
INSERT INTO test_domains_hex_color
VALUES ($1)
"#,
        )
        .bind("000000")
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);
        Ok(())
    }

    #[sqlx::test(fixtures("hex_color"))]
    async fn can_reject_invalid_hex_color(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
INSERT INTO test_domains_hex_color
VALUES ($1)
"#,
        )
        .bind("x")
        .execute(&mut *conn)
        .await;

        assert!(matches!(result.unwrap_err(), sqlx::Error::Database(_)));
        Ok(())
    }

    #[sqlx::test(fixtures("hex_color"))]
    async fn can_only_accept_six_character_hex_color(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let three_char_color_result = sqlx::query(
            r#"
INSERT INTO test_domains_hex_color
VALUES ($1)
"#,
        )
        .bind("fff")
        .execute(&mut *conn)
        .await;

        assert!(matches!(
            three_char_color_result.unwrap_err(),
            sqlx::Error::Database(_)
        ));

        let eight_char_color_result = sqlx::query(
            r#"
INSERT INTO test_domains_hex_color
VALUES ($1)
"#,
        )
        .bind("00ffffff")
        .execute(&mut *conn)
        .await;

        assert!(matches!(
            eight_char_color_result.unwrap_err(),
            sqlx::Error::Database(_)
        ));
        Ok(())
    }
}
