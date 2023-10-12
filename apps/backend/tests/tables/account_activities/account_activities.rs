#[cfg(test)]
mod tests {
    use sqlx::PgPool;

    #[sqlx::test(fixtures("user"))]
    async fn can_insert_an_account_activity(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
            INSERT INTO account_activities(type, user_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(0)
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_account_activity_for_soft_deleted_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Soft-delete the user
        sqlx::query(
            r#"
            UPDATE users
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
            INSERT INTO account_activities(type, user_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(0)
        .bind(1i64)
        .execute(&mut *conn)
        .await;

        // Should reject with `52001` SQLSTATE
        assert_eq!(
            result
                .unwrap_err()
                .into_database_error()
                .unwrap()
                .code()
                .unwrap(),
            "52001"
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_account_activity_for_deactivated_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Deactivate the user
        sqlx::query(
            r#"
            UPDATE users
            SET deactivated_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
            INSERT INTO account_activities(type, user_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(0)
        .bind(1i64)
        .execute(&mut *conn)
        .await;

        // Should reject with `52001` SQLSTATE
        assert_eq!(
            result
                .unwrap_err()
                .into_database_error()
                .unwrap()
                .code()
                .unwrap(),
            "52001"
        );

        Ok(())
    }
}
