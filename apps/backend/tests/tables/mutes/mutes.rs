#[cfg(test)]
mod tests {
    use sqlx::PgPool;
    use storiny::constants::sql_states::SqlState;

    #[sqlx::test(fixtures("user"))]
    async fn can_insert_a_mute(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
INSERT INTO mutes (muter_id, muted_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_mute_on_overlap(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Mute a user with overlapping IDs
        let result = sqlx::query(
            r#"
INSERT INTO mutes (muter_id, muted_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
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
            SqlState::RelationOverlap.to_string()
        );

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_mute_for_soft_deleted_muter_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Soft-delete the muter user
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
INSERT INTO mutes (muter_id, muted_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
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

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_mute_for_deactivated_muter_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Deactivate the muter user
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
INSERT INTO mutes (muter_id, muted_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
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

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_mute_for_soft_deleted_muted_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Soft-delete the muted user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO mutes (muter_id, muted_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
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

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_mute_for_deactivated_muted_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Deactivate the muted user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO mutes (muter_id, muted_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
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
