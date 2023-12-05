#[cfg(test)]
mod tests {
    use sqlx::PgPool;
    use storiny::constants::sql_states::SqlState;
    use uuid::Uuid;

    #[sqlx::test(fixtures("user"))]
    async fn can_insert_an_asset(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
INSERT INTO assets (key, hex, height, width, user_id) 
VALUES ($1, $2, $3, $4, $5)
"#,
        )
        .bind(Uuid::new_v4())
        .bind("000000".to_string())
        .bind(0)
        .bind(0)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_asset_for_soft_deleted_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Soft-delete the user.
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
INSERT INTO assets (key, hex, height, width, user_id) 
VALUES ($1, $2, $3, $4, $5)
"#,
        )
        .bind(Uuid::new_v4())
        .bind("000000".to_string())
        .bind(0)
        .bind(0)
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
            SqlState::EntityUnavailable.to_string(),
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_asset_for_deactivated_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Deactivate the user.
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
INSERT INTO assets (key, hex, height, width, user_id) 
VALUES ($1, $2, $3, $4, $5)
"#,
        )
        .bind(Uuid::new_v4())
        .bind("000000".to_string())
        .bind(0)
        .bind(0)
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
}
