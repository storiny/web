#[cfg(test)]
mod tests {
    use sqlx::PgPool;

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_insert_a_bookmark(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
            INSERT INTO bookmarks(user_id, story_id) 
            VALUES ($1, $2)
            "#,
        )
        .bind(1i64)
        .bind(2i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_reject_bookmark_for_soft_deleted_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Soft-delete the story
        sqlx::query(
            r#"
            UPDATE stories
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(2i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
            INSERT INTO bookmarks(user_id, story_id) 
            VALUES ($1, $2)
            "#,
        )
        .bind(1i64)
        .bind(2i64)
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

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_reject_bookmark_for_unpublished_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Unpublish the story
        sqlx::query(
            r#"
            UPDATE stories
            SET published_at = NULL
            WHERE id = $1
            "#,
        )
        .bind(2i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
            INSERT INTO bookmarks(user_id, story_id) 
            VALUES ($1, $2)
            "#,
        )
        .bind(1i64)
        .bind(2i64)
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

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_reject_bookmark_for_soft_deleted_user(pool: PgPool) -> sqlx::Result<()> {
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
            INSERT INTO bookmarks(user_id, story_id) 
            VALUES ($1, $2)
            "#,
        )
        .bind(1i64)
        .bind(2i64)
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

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_reject_bookmark_for_deactivated_user(pool: PgPool) -> sqlx::Result<()> {
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
            INSERT INTO bookmarks(user_id, story_id) 
            VALUES ($1, $2)
            "#,
        )
        .bind(1i64)
        .bind(2i64)
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
