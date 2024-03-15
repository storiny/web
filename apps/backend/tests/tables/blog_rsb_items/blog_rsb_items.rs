#[cfg(test)]
mod tests {
    use sqlx::{
        pool::PoolConnection,
        postgres::PgRow,
        Error,
        PgPool,
        Postgres,
        Row,
    };
    use storiny::constants::sql_states::SqlState;
    use uuid::Uuid;

    /// Inserts a sample blog into the database.
    ///
    /// * `conn` - Pool connection.
    async fn insert_sample_blog(conn: &mut PoolConnection<Postgres>) -> Result<PgRow, Error> {
        sqlx::query(
            r#"
INSERT INTO blogs (user_id, name, slug)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind(1_i64)
        .bind("Test blog".to_string())
        .bind("test-blog".to_string())
        .fetch_one(&mut **conn)
        .await
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_rsb_item_for_soft_deleted_blog(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");

        // Soft-delete the blog
        sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO blog_rsb_items (primary_text, target, priority, blog_id)
VALUES ($1, $2, $3, $4)
"#,
        )
        .bind("Sample item".to_string())
        .bind("https://storiny.com".to_string())
        .bind(1_i16)
        .bind(blog_id)
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

    // Hard deletes

    #[sqlx::test(fixtures("user"))]
    async fn can_set_icon_as_null_on_asset_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");

        // Insert an asset
        let result = sqlx::query(
            r#"
INSERT INTO assets (key, hex, height, width, user_id)
VALUES ($1, $2, $3, $4, $5)
RETURNING id
"#,
        )
        .bind(Uuid::new_v4())
        .bind("000000".to_string())
        .bind(0)
        .bind(0)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;
        let asset_id = result.get::<i64, _>("id");

        // Insert item with icon.
        let result = sqlx::query(
            r#"
WITH asset AS (
    SELECT key FROM assets
    WHERE id = $5
)
INSERT INTO blog_rsb_items (primary_text, target, icon, priority, blog_id)
VALUES ($1, $2, (SELECT key FROM asset), $3, $4)
RETURNING id, icon
"#,
        )
        .bind("Sample item".to_string())
        .bind("https://storiny.com".to_string())
        .bind(1_i16)
        .bind(blog_id)
        .bind(asset_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<Option<Uuid>, _>("icon").is_some());

        // Delete the asset
        sqlx::query(
            r#"
DELETE FROM assets
WHERE id = $1
"#,
        )
        .bind(asset_id)
        .execute(&mut *conn)
        .await?;

        // `icon` should be NULL
        let result = sqlx::query(
            r#"
SELECT icon
FROM blog_rsb_items
WHERE id = $1
"#,
        )
        .bind(result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<Option<Uuid>, _>("icon").is_none());

        Ok(())
    }
}
