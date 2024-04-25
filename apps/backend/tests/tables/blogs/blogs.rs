#[cfg(test)]
mod tests {
    use nanoid::nanoid;
    use sqlx::{
        pool::PoolConnection,
        postgres::PgRow,
        Error,
        PgPool,
        Postgres,
        Row,
    };
    use storiny::constants::{
        sql_states::SqlState,
        token::TOKEN_LENGTH,
    };
    use time::OffsetDateTime;
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
    async fn can_insert_a_valid_blog(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = insert_sample_blog(&mut conn).await?;
        assert!(result.try_get::<i64, _>("id").is_ok());
        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_insert_home_lsb_item_on_blog_insert(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = insert_sample_blog(&mut conn).await?;

        // Should insert a home left-sidebar item for the new blog
        let result = sqlx::query(
            r#"
SELECT name, target FROM blog_lsb_items
WHERE blog_id = $1
"#,
        )
        .bind(result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<String, _>("name"), "Home".to_string());
        assert_eq!(result.get::<String, _>("target"), "/".to_string());

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_handle_valid_slugs(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let cases: Vec<&str> = vec!["abcd", "ab_cd", "ab-cd", "0abcd", "ab0cd", "abcd0"];

        for case in cases {
            let result = sqlx::query(
                r#"
    INSERT INTO blogs (name, slug, user_id)
    VALUES ($1, $2, $3)
    "#,
            )
            .bind("Sample blog".to_string())
            .bind(&case.to_string())
            .bind(1_i64)
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);
        }

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_invalid_slugs(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let cases: Vec<&str> = vec!["", "ABCD", "a", "abcd#", "abcD", "000000"];

        for case in cases {
            let result = sqlx::query(
                r#"
    INSERT INTO blogs (name, slug, user_id)
    VALUES ($1, $2, $3)
    "#,
            )
            .bind("Sample blog".to_string())
            .bind(&case.to_string())
            .bind(1_i64)
            .execute(&mut *conn)
            .await;

            assert!(matches!(result.unwrap_err(), sqlx::Error::Database(_)));
        }

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_blog_for_soft_deleted_blog_owner(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Soft-delete the blog owner
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
INSERT INTO blogs (user_id, name, slug)
VALUES ($1, $2, $3)
"#,
        )
        .bind(1_i64)
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
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
    async fn can_reject_blog_for_deactivated_blog_owner(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Deactivate the story writer
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
INSERT INTO blogs (user_id, name, slug)
VALUES ($1, $2, $3)
"#,
        )
        .bind(1_i64)
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
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

    // Editors

    #[sqlx::test(fixtures("user"))]
    async fn can_cascade_blog_soft_delete_to_editors(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");

        // Insert an editor
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
RETURNING id, deleted_at
"#,
        )
        .bind(2_i64)
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

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

        // Editor should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_editors
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the blog
        sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        // Editor should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_editors
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn should_not_restore_editors_from_deleted_users_when_cascading_blog(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");

        // Insert an editor
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
RETURNING id, deleted_at
"#,
        )
        .bind(2_i64)
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

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

        // Soft-delete the user
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

        // Editor should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_editors
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the blog
        sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        // Editor should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_editors
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Editor should get restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_editors
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn should_not_restore_editors_from_deactivated_users_when_cascading_blog(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");

        // Insert an editor
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
RETURNING id, deleted_at
"#,
        )
        .bind(2_i64)
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

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

        // Deactivate the user
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

        // Editor should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_editors
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the blog
        sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        // Editor should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_editors
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Activate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Editor should get restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_editors
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    // Writers

    #[sqlx::test(fixtures("user"))]
    async fn can_cascade_blog_soft_delete_to_writers(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");

        // Insert a writer
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_writers (receiver_id, transmitter_id, blog_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

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

        // Writer should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_writers
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the blog
        sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        // Writer should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_writers
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn should_not_restore_writers_from_deleted_users_when_cascading_blog(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");

        // Insert a writer
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_writers (receiver_id, transmitter_id, blog_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

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

        // Soft-delete the user
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

        // Writer should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_writers
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the blog
        sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        // Writer should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_writers
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Writer should get restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_writers
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn should_not_restore_writers_from_deactivated_users_when_cascading_blog(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");

        // Insert a writer
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_writers (receiver_id, transmitter_id, blog_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

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

        // Deactivate the user
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

        // Writer should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_writers
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the blog
        sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        // Writer should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_writers
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Activate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Writer should get restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_writers
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    // Stories

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_cascade_blog_soft_delete_to_stories(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");

        // Add the story to the blog.
        let result = sqlx::query(
            r#"
INSERT INTO blog_stories (blog_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(blog_id)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

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

        // Blog story should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_stories
WHERE blog_id = $1 AND story_id = $2
"#,
        )
        .bind(blog_id)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the blog
        sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        // Blog story should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_stories
WHERE blog_id = $1 AND story_id = $2
"#,
        )
        .bind(blog_id)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story"))]
    async fn should_not_restore_blog_stories_from_deleted_stories_when_cascading_blog(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");

        // Add the story to the blog.
        let result = sqlx::query(
            r#"
INSERT INTO blog_stories (blog_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(blog_id)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

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

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Blog story should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_stories
WHERE blog_id = $1 AND story_id = $2
"#,
        )
        .bind(blog_id)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the blog
        sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        // Blog story should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_stories
WHERE blog_id = $1 AND story_id = $2
"#,
        )
        .bind(blog_id)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Blog story should get restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_stories
WHERE blog_id = $1 AND story_id = $2
"#,
        )
        .bind(blog_id)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    // Followers

    #[sqlx::test(fixtures("user"))]
    async fn can_cascade_blog_soft_delete_to_followers(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");

        // Insert a follower
        let result = sqlx::query(
            r#"
INSERT INTO blog_followers (user_id, blog_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(2_i64)
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

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

        // Follower relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_followers
WHERE blog_id = $1 AND user_id = $2
"#,
        )
        .bind(blog_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the blog
        sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        // Follower relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_followers
WHERE blog_id = $1 AND user_id = $2
"#,
        )
        .bind(blog_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn should_not_restore_followers_from_deleted_users_when_cascading_blog(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");

        // Insert a follower
        let result = sqlx::query(
            r#"
INSERT INTO blog_followers (user_id, blog_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(2_i64)
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

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

        // Soft-delete the user
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

        // Follower relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_followers
WHERE blog_id = $1 AND user_id = $2
"#,
        )
        .bind(blog_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the blog
        sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        // Follower relation should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_followers
WHERE blog_id = $1 AND user_id = $2
"#,
        )
        .bind(blog_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Follower relation should get restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_followers
WHERE blog_id = $1 AND user_id = $2
"#,
        )
        .bind(blog_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn should_not_restore_followers_from_deactivated_users_when_cascading_blog(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");

        // Insert a follower
        let result = sqlx::query(
            r#"
INSERT INTO blog_followers (user_id, blog_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(2_i64)
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

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

        // Deactivate the user
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

        // Follower relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_followers
WHERE blog_id = $1 AND user_id = $2
"#,
        )
        .bind(blog_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the blog
        sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        // Follower relation should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_followers
WHERE blog_id = $1 AND user_id = $2
"#,
        )
        .bind(blog_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Activate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Follower relation should get restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_followers
WHERE blog_id = $1 AND user_id = $2
"#,
        )
        .bind(blog_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    // Hard deletes

    #[sqlx::test(fixtures("user"))]
    async fn can_soft_delete_blog_when_user_id_is_null(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");

        let result = sqlx::query(
            r#"
SELECT deleted_at, user_id FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        // Should be present initially.
        assert!(result.get::<Option<i64>, _>("user_id").is_some());
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Set the `user_id` to NULL
        let result = sqlx::query(
            r#"
UPDATE blogs
SET user_id = NULL
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let result = sqlx::query(
            r#"
SELECT deleted_at, user_id FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        // Should soft-delete the blog.
        assert!(result.get::<Option<i64>, _>("user_id").is_none());
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_set_blog_logo_id_as_null_on_asset_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");

        // Insert an asset
        let insert_result = sqlx::query(
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

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Set `logo_id` and `logo_hex` on the blog
        let update_result = sqlx::query(
            r#"
WITH asset AS (
    SELECT key, hex FROM assets
    WHERE id = $1
)
UPDATE blogs
SET
    logo_id = (SELECT key FROM asset),
    logo_hex = (SELECT hex FROM asset)
WHERE id = $2
RETURNING logo_id, logo_hex
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(update_result.get::<Option<Uuid>, _>("logo_id").is_some());
        assert!(update_result.get::<Option<String>, _>("logo_hex").is_some());

        // Delete the asset
        sqlx::query(
            r#"
DELETE FROM assets
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .execute(&mut *conn)
        .await?;

        // `logo_id` and `logo_hex` should be NULL
        let update_result = sqlx::query(
            r#"
SELECT
    logo_id,
    logo_hex
FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(update_result.get::<Option<Uuid>, _>("logo_id").is_none());
        assert!(update_result.get::<Option<String>, _>("logo_hex").is_none());

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_set_blog_banner_id_as_null_on_asset_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");

        // Insert an asset
        let insert_result = sqlx::query(
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

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Set `banner_id` and `banner_hex` on the blog
        let update_result = sqlx::query(
            r#"
WITH asset AS (
    SELECT key, hex FROM assets
    WHERE id = $1
)
UPDATE blogs
SET
    banner_id = (SELECT key FROM asset),
    banner_hex = (SELECT hex FROM asset)
WHERE id = $2
RETURNING banner_id, banner_hex
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(update_result.get::<Option<Uuid>, _>("banner_id").is_some());
        assert!(
            update_result
                .get::<Option<String>, _>("banner_hex")
                .is_some()
        );

        // Delete the asset
        sqlx::query(
            r#"
DELETE FROM assets
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .execute(&mut *conn)
        .await?;

        // `banner_id` and `banner_hex` should be NULL
        let update_result = sqlx::query(
            r#"
SELECT
    banner_id,
    banner_hex
FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(update_result.get::<Option<Uuid>, _>("banner_id").is_none());
        assert!(
            update_result
                .get::<Option<String>, _>("banner_hex")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_set_blog_newsletter_splash_id_as_null_on_asset_hard_delete(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");

        // Insert an asset
        let insert_result = sqlx::query(
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

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Set `newsletter_splash_id` and `newsletter_splash_hex` on the blog
        let update_result = sqlx::query(
            r#"
WITH asset AS (
    SELECT key, hex FROM assets
    WHERE id = $1
)
UPDATE blogs
SET
    newsletter_splash_id = (SELECT key FROM asset),
    newsletter_splash_hex = (SELECT hex FROM asset)
WHERE id = $2
RETURNING newsletter_splash_id, newsletter_splash_hex
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            update_result
                .get::<Option<Uuid>, _>("newsletter_splash_id")
                .is_some()
        );
        assert!(
            update_result
                .get::<Option<String>, _>("newsletter_splash_hex")
                .is_some()
        );

        // Delete the asset
        sqlx::query(
            r#"
DELETE FROM assets
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .execute(&mut *conn)
        .await?;

        // `newsletter_splash_id` and `newsletter_splash_hex` should be NULL
        let update_result = sqlx::query(
            r#"
SELECT
    newsletter_splash_id,
    newsletter_splash_hex
FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            update_result
                .get::<Option<Uuid>, _>("newsletter_splash_id")
                .is_none()
        );
        assert!(
            update_result
                .get::<Option<String>, _>("newsletter_splash_hex")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_set_preview_image_as_null_on_asset_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");

        // Insert an asset
        let insert_result = sqlx::query(
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

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Set `preview_image` on the blog
        let update_result = sqlx::query(
            r#"
WITH asset AS (
    SELECT key FROM assets
    WHERE id = $1
)
UPDATE blogs
SET
    preview_image = (SELECT key FROM asset)
WHERE id = $2
RETURNING preview_image
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            update_result
                .get::<Option<Uuid>, _>("preview_image")
                .is_some()
        );

        // Delete the asset
        sqlx::query(
            r#"
DELETE FROM assets
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .execute(&mut *conn)
        .await?;

        // `preview_image` should be NULL
        let update_result = sqlx::query(
            r#"
SELECT preview_image
FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            update_result
                .get::<Option<Uuid>, _>("preview_image")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_set_favicon_as_null_on_asset_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");

        // Insert an asset
        let insert_result = sqlx::query(
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

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Set `favicon` on the blog
        let update_result = sqlx::query(
            r#"
WITH asset AS (
    SELECT key FROM assets
    WHERE id = $1
)
UPDATE blogs
SET
    favicon = (SELECT key FROM asset)
WHERE id = $2
RETURNING favicon
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(update_result.get::<Option<Uuid>, _>("favicon").is_some());

        // Delete the asset
        sqlx::query(
            r#"
DELETE FROM assets
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .execute(&mut *conn)
        .await?;

        // `favicon` should be NULL
        let update_result = sqlx::query(
            r#"
SELECT favicon
FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(update_result.get::<Option<Uuid>, _>("favicon").is_none());

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_set_mark_light_as_null_on_asset_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");

        // Insert an asset
        let insert_result = sqlx::query(
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

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Set `mark_light` on the blog
        let update_result = sqlx::query(
            r#"
WITH asset AS (
    SELECT key FROM assets
    WHERE id = $1
)
UPDATE blogs
SET
    mark_light = (SELECT key FROM asset)
WHERE id = $2
RETURNING mark_light
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(update_result.get::<Option<Uuid>, _>("mark_light").is_some());

        // Delete the asset
        sqlx::query(
            r#"
DELETE FROM assets
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .execute(&mut *conn)
        .await?;

        // `mark_light` should be NULL
        let update_result = sqlx::query(
            r#"
SELECT mark_light
FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(update_result.get::<Option<Uuid>, _>("mark_light").is_none());

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_set_mark_dark_as_null_on_asset_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");

        // Insert an asset
        let insert_result = sqlx::query(
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

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Set `mark_dark` on the blog
        let update_result = sqlx::query(
            r#"
WITH asset AS (
    SELECT key FROM assets
    WHERE id = $1
)
UPDATE blogs
SET
    mark_dark = (SELECT key FROM asset)
WHERE id = $2
RETURNING mark_dark
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(update_result.get::<Option<Uuid>, _>("mark_dark").is_some());

        // Delete the asset
        sqlx::query(
            r#"
DELETE FROM assets
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .execute(&mut *conn)
        .await?;

        // `mark_dark` should be NULL
        let update_result = sqlx::query(
            r#"
SELECT mark_dark
FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(update_result.get::<Option<Uuid>, _>("mark_dark").is_none());

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_editor_on_blog_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");

        // Insert an editor
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
RETURNING id
"#,
        )
        .bind(2_i64)
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Delete the blog
        sqlx::query(
            r#"
DELETE FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        // Editor should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM blog_editors
    WHERE id = $1
)
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_writer_on_blog_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");

        // Insert a writer
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_writers (receiver_id, transmitter_id, blog_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind(2_i64)
        .bind(1_i64)
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Delete the blog
        sqlx::query(
            r#"
DELETE FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        // Writer should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM blog_writers
    WHERE id = $1
)
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_follower_on_blog_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");

        // Insert a follower
        let result = sqlx::query(
            r#"
INSERT INTO blog_followers (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Delete the blog
        sqlx::query(
            r#"
DELETE FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        // Follower relation should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM blog_followers
    WHERE user_id = $1 AND blog_id = $2
)
"#,
        )
        .bind(2_i64)
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_delete_blog_story_on_blog_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");

        // Add the story to the blog.
        let result = sqlx::query(
            r#"
INSERT INTO blog_stories (blog_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(blog_id)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Delete the blog
        sqlx::query(
            r#"
DELETE FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        // Blog story relation should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM blog_stories
    WHERE story_id = $1 AND blog_id = $2
)
"#,
        )
        .bind(3_i64)
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_lsb_items_on_blog_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");

        // Insert an item
        let result = sqlx::query(
            r#"
INSERT INTO blog_lsb_items (name, target, priority, blog_id)
VALUES ($1, $2, $3, $4)
"#,
        )
        .bind("test_item".to_string())
        .bind("https://storiny.com".to_string())
        .bind(2_i16)
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Delete the blog
        sqlx::query(
            r#"
DELETE FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        // Item should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM blog_lsb_items
    WHERE name = $1
)
"#,
        )
        .bind("test_item".to_string())
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_rsb_items_on_blog_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");

        // Insert an item
        let result = sqlx::query(
            r#"
INSERT INTO blog_rsb_items (primary_text, target, priority, blog_id)
VALUES ($1, $2, $3, $4)
"#,
        )
        .bind("test_item".to_string())
        .bind("https://storiny.com".to_string())
        .bind(1_i16)
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Delete the blog
        sqlx::query(
            r#"
DELETE FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        // Item should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM blog_rsb_items
    WHERE primary_text = $1
)
"#,
        )
        .bind("test_item".to_string())
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_subscribers_on_blog_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");

        // Insert a subscriber.
        let result = sqlx::query(
            r#"
INSERT INTO subscribers (blog_id, email)
VALUES ($1, $2)
"#,
        )
        .bind(blog_id)
        .bind("example@storiny.com".to_string())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Delete the blog
        sqlx::query(
            r#"
DELETE FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        // Subscriber should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM subscribers
    WHERE blog_id = $1
)
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_newsletter_tokens_on_blog_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let blog_id = (insert_sample_blog(&mut conn).await?).get::<i64, _>("id");
        let token_id = nanoid!(TOKEN_LENGTH);

        // Insert a subscriber.
        let result = sqlx::query(
            r#"
INSERT INTO newsletter_tokens (id, blog_id, email, expires_at)
VALUES ($1, $2, $3, NOW())
"#,
        )
        .bind(token_id)
        .bind(blog_id)
        .bind("example@storiny.com".to_string())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Delete the blog
        sqlx::query(
            r#"
DELETE FROM blogs
WHERE id = $1
"#,
        )
        .bind(blog_id)
        .execute(&mut *conn)
        .await?;

        // Token should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM newsletter_tokens
    WHERE blog_id = $1
)
"#,
        )
        .bind(blog_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }
}
