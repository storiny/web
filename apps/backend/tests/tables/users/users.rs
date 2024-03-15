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

    /// Inserts a sample user into the database.
    ///
    /// * `conn` - Pool connection.
    async fn insert_sample_user(conn: &mut PoolConnection<Postgres>) -> Result<PgRow, Error> {
        sqlx::query(
            r#"
INSERT INTO users (name, username, email)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Sample user".to_string())
        .bind("random_user".to_string()) // `sample_user` is used by `story` fixture
        .bind("random.user@example.com".to_string()) // `sample.user@example.com` is used by `story` fixture
        .fetch_one(&mut **conn)
        .await
    }

    #[sqlx::test]
    async fn can_insert_a_valid_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = insert_sample_user(&mut conn).await?;
        assert!(result.try_get::<i64, _>("id").is_ok());
        Ok(())
    }

    #[sqlx::test]
    async fn can_initialize_notification_settings_on_user_insert(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = insert_sample_user(&mut conn).await?;
        assert!(result.try_get::<i64, _>("id").is_ok());

        // Should insert notification settings for the new user
        let notification_settings_result = sqlx::query(
            r#"
SELECT * FROM notification_settings
WHERE user_id = $1
"#,
        )
        .bind(result.get::<i64, _>("id"))
        .fetch_all(&mut *conn)
        .await?;

        assert_eq!(notification_settings_result.len(), 1);

        Ok(())
    }

    #[sqlx::test]
    async fn can_insert_account_creation_activity_on_user_insert(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = insert_sample_user(&mut conn).await?;
        assert!(result.try_get::<i64, _>("id").is_ok());

        // Should insert account creation activity (type=1) for the new user
        let notification_settings_result = sqlx::query(
            r#"
SELECT * FROM account_activities
WHERE user_id = $1 AND type = 1
"#,
        )
        .bind(result.get::<i64, _>("id"))
        .fetch_all(&mut *conn)
        .await?;

        assert_eq!(notification_settings_result.len(), 1);

        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_valid_usernames(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let cases: Vec<&str> = vec!["abcd", "ab_cd", "0abcd", "ab0cd", "abcd0"];

        for case in cases {
            let mut email = "sample.user@example.com".to_string();
            email.push_str(case);

            let result = sqlx::query(
                r#"
    INSERT INTO users (name, username, email)
    VALUES ($1, $2, $3)
    RETURNING id
    "#,
            )
            .bind("Sample user".to_string())
            .bind(&case.to_string())
            .bind(email)
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);
        }

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_invalid_usernames(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let cases: Vec<&str> = vec!["", "ABCD", "a", "abcd#", "abcD"];

        for case in cases {
            let result = sqlx::query(
                r#"
    INSERT INTO users (name, username, email)
    VALUES ($1, $2, $3)
    RETURNING id
    "#,
            )
            .bind("Sample user".to_string())
            .bind(&case.to_string())
            .bind("sample.user@example.com")
            .execute(&mut *conn)
            .await;

            assert!(matches!(result.unwrap_err(), sqlx::Error::Database(_)));
        }

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_updating_username_on_a_cooldown_period(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = insert_sample_user(&mut conn).await?;
        let user_id = result.get::<i64, _>("id");

        // Update the `username_modified_at` column
        sqlx::query(
            r#"
UPDATE users
SET username_modified_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Try updating the username
        let result = sqlx::query(
            r#"
UPDATE users
SET
    username = $2,
    username_modified_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .bind("new_username".to_string())
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
            SqlState::UsernameCooldown.to_string()
        );

        Ok(())
    }

    // Blogs

    #[sqlx::test]
    async fn can_cascade_user_soft_delete_to_blogs(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a blog
        let insert_result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blog should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blogs
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blog should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blogs
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

    #[sqlx::test]
    async fn can_soft_delete_and_restore_blogs_on_user_deactivation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a blog
        let insert_result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample content".to_string())
        .bind("sample-content".to_string())
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blog should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blogs
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blog should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blogs
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

    #[sqlx::test]
    async fn can_cascade_user_soft_delete_to_stories(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a story
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (user_id)
VALUES ($1)
RETURNING id, deleted_at
"#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Story should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM stories
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Story should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM stories
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

    #[sqlx::test]
    async fn can_soft_delete_and_restore_stories_on_user_deactivation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a story
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (user_id)
VALUES ($1)
RETURNING id, deleted_at
"#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Story should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM stories
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Story should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM stories
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

    #[sqlx::test]
    async fn should_not_recover_stories_deleted_by_user_when_recovering_the_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a story
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (user_id, is_deleted_by_user)
VALUES ($1, TRUE)
RETURNING id, deleted_at, is_deleted_by_user
"#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );
        assert!(
            insert_result
                .get::<Option<bool>, _>("is_deleted_by_user")
                .unwrap()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Story should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM stories
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Story should not be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM stories
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

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_recover_stories_deleted_by_user_when_reactivating_the_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a story
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (user_id, is_deleted_by_user)
VALUES ($1, TRUE)
RETURNING id, deleted_at, is_deleted_by_user
"#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );
        assert!(
            insert_result
                .get::<Option<bool>, _>("is_deleted_by_user")
                .unwrap()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Story should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM stories
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

        // Reactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Story should not be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM stories
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

        Ok(())
    }

    // Comments

    #[sqlx::test(fixtures("story"))]
    async fn can_cascade_user_soft_delete_to_comments(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a comment
        let insert_result = sqlx::query(
            r#"
INSERT INTO comments (content, user_id, story_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample content".to_string())
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Comment should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comments
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Comment should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comments
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

    #[sqlx::test(fixtures("story"))]
    async fn can_soft_delete_and_restore_comments_on_user_deactivation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a comment
        let insert_result = sqlx::query(
            r#"
INSERT INTO comments (content, user_id, story_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample content".to_string())
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Comment should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comments
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Comment should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comments
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

    // Replies

    #[sqlx::test(fixtures("story", "comment"))]
    async fn can_cascade_user_soft_delete_to_replies(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a reply
        let insert_result = sqlx::query(
            r#"
INSERT INTO replies (content, user_id, comment_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample content".to_string())
        .bind(user_id)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Reply should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM replies
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Reply should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM replies
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

    #[sqlx::test(fixtures("story", "comment"))]
    async fn can_soft_delete_and_restore_replies_on_user_deactivation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a reply
        let insert_result = sqlx::query(
            r#"
INSERT INTO replies (content, user_id, comment_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample content".to_string())
        .bind(user_id)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Reply should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM replies
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Reply should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM replies
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

    // Blog editors

    #[sqlx::test(fixtures("blog"))]
    async fn can_cascade_user_soft_delete_to_blog_editors(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Add an editor
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_editors (blog_id, user_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blog editor relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_editors
WHERE blog_id = $1 AND user_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blog editor relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_editors
WHERE blog_id = $1 AND user_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("blog"))]
    async fn can_soft_delete_and_restore_blog_editors_on_user_deactivation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Add an editor
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_editors (blog_id, user_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blog editor relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_editors
WHERE blog_id = $1 AND user_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blog editor relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_editors
WHERE blog_id = $1 AND user_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    // Blog writers

    #[sqlx::test(fixtures("blog"))]
    async fn can_cascade_user_soft_delete_to_blog_writers(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Add a writer
        let insert_result = sqlx::query(
            r#"
WITH blog AS (
    SELECT user_id FROM blogs
    WHERE id = $1
)
INSERT INTO blog_writers (blog_id, receiver_id, transmitter_id)
VALUES ($1, $2, (SELECT user_id FROM blog))
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blog writer relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_writers
WHERE blog_id = $1 AND receiver_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blog writer relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_writers
WHERE blog_id = $1 AND receiver_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("blog"))]
    async fn can_soft_delete_and_restore_blog_writers_on_user_deactivation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Add a writer
        let insert_result = sqlx::query(
            r#"
WITH blog AS (
    SELECT user_id FROM blogs
    WHERE id = $1
)
INSERT INTO blog_writers (blog_id, receiver_id, transmitter_id)
VALUES ($1, $2, (SELECT user_id FROM blog))
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blog writer relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_writers
WHERE blog_id = $1 AND receiver_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blog writer relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_writers
WHERE blog_id = $1 AND receiver_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("blog"))]
    async fn should_not_cascade_user_soft_delete_to_blog_writers_from_a_transmitter(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Send a writer invite
        let insert_result = sqlx::query(
            r#"
WITH inserted_editor AS (
    INSERT INTO blog_editors (blog_id, user_id, accepted_at)
    VALUES ($1, $2, NOW())
), receiver AS (
    INSERT INTO users (name, username, email)
    VALUES ('Writer', 'writer', 'writer@example.com')
    RETURNING id
)
INSERT INTO blog_writers (blog_id, receiver_id, transmitter_id)
VALUES ($1, (SELECT id FROM receiver), $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the transmitter
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blog writer relation should not be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_writers
WHERE blog_id = $1 AND transmitter_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("blog"))]
    async fn should_not_soft_delete_blog_writers_on_transmitter_deactivation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Send a writer invite
        let insert_result = sqlx::query(
            r#"
WITH inserted_editor AS (
    INSERT INTO blog_editors (blog_id, user_id, accepted_at)
    VALUES ($1, $2, NOW())
), receiver AS (
    INSERT INTO users (name, username, email)
    VALUES ('Writer', 'writer', 'writer@example.com')
    RETURNING id
)
INSERT INTO blog_writers (blog_id, receiver_id, transmitter_id)
VALUES ($1, (SELECT id FROM receiver), $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the transmitter
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blog writer relation should not be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_writers
WHERE blog_id = $1 AND transmitter_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    // Followed blogs

    #[sqlx::test(fixtures("blog"))]
    async fn can_cascade_user_soft_delete_to_followed_blogs(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Follow a blog
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_followers (blog_id, user_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Followed blog relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_followers
WHERE blog_id = $1 AND user_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Followed blog relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_followers
WHERE blog_id = $1 AND user_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("blog"))]
    async fn can_soft_delete_and_restore_followed_blogs_on_user_deactivation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Follow a blog
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_followers (blog_id, user_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Followed blog relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_followers
WHERE blog_id = $1 AND user_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Followed blog relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_followers
WHERE blog_id = $1 AND user_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    // Followed tags

    #[sqlx::test(fixtures("tag"))]
    async fn can_cascade_user_soft_delete_to_followed_tags(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Follow a tag
        let insert_result = sqlx::query(
            r#"
INSERT INTO tag_followers (tag_id, user_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Followed tag relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM tag_followers
WHERE tag_id = $1 AND user_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Followed tag relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM tag_followers
WHERE tag_id = $1 AND user_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("tag"))]
    async fn can_soft_delete_and_restore_followed_tags_on_user_deactivation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Follow a tag
        let insert_result = sqlx::query(
            r#"
INSERT INTO tag_followers (tag_id, user_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Followed tag relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM tag_followers
WHERE tag_id = $1 AND user_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Followed tag relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM tag_followers
WHERE tag_id = $1 AND user_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    // Relations

    #[sqlx::test(fixtures("user"))]
    async fn can_cascade_user_soft_delete_to_followed_relations(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Follow a user
        let insert_result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Followed relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE follower_id = $1 AND followed_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Followed relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE follower_id = $1 AND followed_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
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
    async fn can_soft_delete_and_restore_followed_relations_on_user_deactivation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Follow a user
        let insert_result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Followed relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE follower_id = $1 AND followed_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Followed relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE follower_id = $1 AND followed_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
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
    async fn can_cascade_user_soft_delete_to_follower_relations(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Add a follower
        let insert_result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Follower relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE follower_id = $1 AND followed_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Follower relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE follower_id = $1 AND followed_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
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
    async fn can_soft_delete_and_restore_follower_relations_on_user_deactivation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Add a follower
        let insert_result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Follower relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE follower_id = $1 AND followed_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Follower relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE follower_id = $1 AND followed_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    // Friends

    #[sqlx::test(fixtures("user"))]
    async fn can_cascade_user_soft_delete_to_transmitted_friends(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Send a friend request
        let insert_result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Friend relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Friend relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
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
    async fn can_soft_delete_and_restore_transmitted_friends_on_user_deactivation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Send a friend request
        let insert_result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Friend relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Friend relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
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
    async fn can_cascade_user_soft_delete_to_received_friends(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Receive a friend request
        let insert_result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Friend relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Friend relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
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
    async fn can_soft_delete_and_restore_received_friends_on_user_deactivation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Receive a friend request
        let insert_result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Friend relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Friend relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    // Story contributors

    #[sqlx::test(fixtures("story"))]
    async fn can_cascade_user_soft_delete_to_story_contributors(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Contribute to a story
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Story contributor should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_contributors
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Story contributors should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_contributors
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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

    #[sqlx::test(fixtures("story"))]
    async fn can_soft_delete_and_restore_story_contributors_on_user_deactivation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Contribute to a story
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Story contributor should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_contributors
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Story contributor should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_contributors
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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

    // Story likes

    #[sqlx::test(fixtures("story"))]
    async fn can_cascade_user_soft_delete_to_story_likes(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Like a story
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Story like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Story like should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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

    #[sqlx::test(fixtures("story"))]
    async fn can_soft_delete_and_restore_story_likes_on_user_deactivation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Like a story
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Story like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Story like should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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

    // Comment likes

    #[sqlx::test(fixtures("story", "comment"))]
    async fn can_cascade_user_soft_delete_to_comment_likes(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Like a comment
        let insert_result = sqlx::query(
            r#"
INSERT INTO comment_likes (user_id, comment_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Comment like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comment_likes
WHERE user_id = $1 AND comment_id = $2
"#,
        )
        .bind(user_id)
        .bind(3_i64)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Comment like should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comment_likes
WHERE user_id = $1 AND comment_id = $2
"#,
        )
        .bind(user_id)
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

    #[sqlx::test(fixtures("story", "comment"))]
    async fn can_soft_delete_and_restore_comment_likes_on_user_deactivation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Like a comment
        let insert_result = sqlx::query(
            r#"
INSERT INTO comment_likes (user_id, comment_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Comment like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comment_likes
WHERE user_id = $1 AND comment_id = $2
"#,
        )
        .bind(user_id)
        .bind(3_i64)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Comment like should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comment_likes
WHERE user_id = $1 AND comment_id = $2
"#,
        )
        .bind(user_id)
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

    // Reply likes

    #[sqlx::test(fixtures("story", "comment", "reply"))]
    async fn can_cascade_user_soft_delete_to_reply_likes(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Like a reply
        let insert_result = sqlx::query(
            r#"
INSERT INTO reply_likes (user_id, reply_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Reply like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM reply_likes
WHERE user_id = $1 AND reply_id = $2
"#,
        )
        .bind(user_id)
        .bind(4_i64)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Reply like should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM reply_likes
WHERE user_id = $1 AND reply_id = $2
"#,
        )
        .bind(user_id)
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("story", "comment", "reply"))]
    async fn can_soft_delete_and_restore_reply_likes_on_user_deactivation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Like a reply
        let insert_result = sqlx::query(
            r#"
INSERT INTO reply_likes (user_id, reply_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Reply like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM reply_likes
WHERE user_id = $1 AND reply_id = $2
"#,
        )
        .bind(user_id)
        .bind(4_i64)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Reply like should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM reply_likes
WHERE user_id = $1 AND reply_id = $2
"#,
        )
        .bind(user_id)
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    // Bookmarks

    #[sqlx::test(fixtures("story"))]
    async fn can_cascade_user_soft_delete_to_bookmarks(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a bookmark
        let insert_result = sqlx::query(
            r#"
INSERT INTO bookmarks (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Bookmark should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM bookmarks
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Bookmark should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM bookmarks
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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

    #[sqlx::test(fixtures("story"))]
    async fn can_soft_delete_and_restore_bookmarks_on_user_deactivation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a bookmark
        let insert_result = sqlx::query(
            r#"
INSERT INTO bookmarks (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Bookmark should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM bookmarks
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Bookmark should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM bookmarks
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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

    // Histories

    #[sqlx::test(fixtures("story"))]
    async fn can_cascade_user_soft_delete_to_histories(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a history
        let insert_result = sqlx::query(
            r#"
INSERT INTO histories (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // History should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM histories
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // History should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM histories
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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

    #[sqlx::test(fixtures("story"))]
    async fn can_soft_delete_and_restore_histories_on_user_deactivation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a history
        let insert_result = sqlx::query(
            r#"
INSERT INTO histories (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // History should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM histories
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // History should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM histories
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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

    // Blocks

    #[sqlx::test(fixtures("user"))]
    async fn can_cascade_user_soft_delete_to_blocked_relations(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Get blocked by a user
        let insert_result = sqlx::query(
            r#"
INSERT INTO blocks (blocker_id, blocked_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the current user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blocked relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blocks
WHERE blocker_id = $1 AND blocked_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the current user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blocked relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blocks
WHERE blocker_id = $1 AND blocked_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
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
    async fn can_soft_delete_and_restore_blocked_relations_on_user_deactivation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Get blocked by a user
        let insert_result = sqlx::query(
            r#"
INSERT INTO blocks (blocker_id, blocked_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the current user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blocked relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blocks
WHERE blocker_id = $1 AND blocked_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Activate the current user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blocked relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blocks
WHERE blocker_id = $1 AND blocked_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
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
    async fn can_cascade_user_soft_delete_to_blocker_relations(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Block a user
        let insert_result = sqlx::query(
            r#"
INSERT INTO blocks (blocker_id, blocked_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the current user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blocker relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blocks
WHERE blocker_id = $1 AND blocked_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the current user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blocker relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blocks
WHERE blocker_id = $1 AND blocked_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
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
    async fn can_soft_delete_and_restore_blocker_relations_on_user_deactivation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Block a user
        let insert_result = sqlx::query(
            r#"
INSERT INTO blocks (blocker_id, blocked_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the current user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blocker relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blocks
WHERE blocker_id = $1 AND blocked_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Activate the current user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blocker relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blocks
WHERE blocker_id = $1 AND blocked_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    // Mutes

    #[sqlx::test(fixtures("user"))]
    async fn can_cascade_user_soft_delete_to_muted_relations(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Get muted by a user
        let insert_result = sqlx::query(
            r#"
INSERT INTO mutes (muter_id, muted_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the current user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Muted relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM mutes
WHERE muter_id = $1 AND muted_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the current user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Muted relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM mutes
WHERE muter_id = $1 AND muted_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
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
    async fn can_soft_delete_and_restore_muted_relations_on_user_deactivation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Get muted by a user
        let insert_result = sqlx::query(
            r#"
INSERT INTO mutes (muter_id, muted_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the current user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Muted relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM mutes
WHERE muter_id = $1 AND muted_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Activate the current user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Muted relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM mutes
WHERE muter_id = $1 AND muted_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
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
    async fn can_cascade_user_soft_delete_to_muter_relations(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Mute a user
        let insert_result = sqlx::query(
            r#"
INSERT INTO mutes (muter_id, muted_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the current user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Muter relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM mutes
WHERE muter_id = $1 AND muted_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the current user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Muter relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM mutes
WHERE muter_id = $1 AND muted_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
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
    async fn can_soft_delete_and_restore_muter_relations_on_user_deactivation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Mute a user
        let insert_result = sqlx::query(
            r#"
INSERT INTO mutes (muter_id, muted_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the current user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Muter relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM mutes
WHERE muter_id = $1 AND muted_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Activate the current user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Muter relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM mutes
WHERE muter_id = $1 AND muted_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    // Notifications

    #[sqlx::test]
    async fn can_delete_transmitted_notifications_on_user_soft_delete(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Transmit a notification
        let insert_result = sqlx::query(
            r#"
INSERT INTO notifications (entity_id, entity_type, notifier_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind(1_i64)
        .bind(0)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Transmitted notification should be deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
  SELECT 1 FROM notifications
  WHERE notifier_id = $1
)
"#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_delete_transmitted_notifications_on_user_deactivation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Transmit a notification
        let insert_result = sqlx::query(
            r#"
INSERT INTO notifications (entity_id, entity_type, notifier_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind(1_i64)
        .bind(0)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Transmitted notification should be deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
  SELECT 1 FROM notifications
  WHERE notifier_id = $1
)
"#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user", "notification"))]
    async fn can_delete_received_notifications_on_user_soft_delete(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Receive a notification
        let insert_result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Received notification should be deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
  SELECT 1 FROM notification_outs
  WHERE notified_id = $1
)
"#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user", "notification"))]
    async fn can_delete_received_notifications_on_user_deactivation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Receive a notification
        let insert_result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Received notification should be deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
  SELECT 1 FROM notification_outs
  WHERE notified_id = $1
)
"#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_notifications_with_user_id_as_entity_id_on_user_soft_delete(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Transmit a notification
        let insert_result = sqlx::query(
            r#"
INSERT INTO notifications (entity_id, entity_type, notifier_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind(user_id)
        .bind(0)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Notification should be deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
  SELECT 1 FROM notifications
  WHERE notifier_id = $1
)
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_notifications_with_user_id_as_entity_id_on_user_deactivation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Transmit a notification
        let insert_result = sqlx::query(
            r#"
INSERT INTO notifications (entity_id, entity_type, notifier_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind(user_id)
        .bind(0)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Notification should be deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
  SELECT 1 FROM notifications
  WHERE notifier_id = $1
)
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    // Tokens

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_token_on_user_soft_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let token_id = nanoid!(TOKEN_LENGTH);

        // Insert a token
        let insert_result = sqlx::query(
            r#"
INSERT INTO tokens (id, type, user_id, expires_at)
VALUES ($1, $2, $3, NOW())
RETURNING id
"#,
        )
        .bind(&token_id)
        .bind(0_i16)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Soft-delete the user
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

        // Token should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
  SELECT 1 FROM tokens
  WHERE id = $1
)
"#,
        )
        .bind(&token_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    // Misc

    #[sqlx::test]
    async fn should_not_delete_assets_when_user_is_soft_deleted(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

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
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Asset should not be deleted
        let result = sqlx::query(
            r#"
SELECT user_id FROM assets
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<Option<i64>, _>("user_id"), Some(user_id));

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_delete_assets_when_user_is_deactivated(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

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
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Asset should not be deleted
        let result = sqlx::query(
            r#"
SELECT user_id FROM assets
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<Option<i64>, _>("user_id"), Some(user_id));

        Ok(())
    }

    //

    #[sqlx::test(fixtures("blog"))]
    async fn should_not_restore_blog_editors_from_deleted_blogs_when_cascading_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Add an editor
        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
RETURNING id, deleted_at
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;
        let relation_id = result.get::<i64, _>("id");

        // Blog editor should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Soft-delete the blog
        sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Blog editor should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_editors
WHERE id = $1
"#,
        )
        .bind(relation_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blog editor should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_editors
WHERE id = $1
"#,
        )
        .bind(relation_id)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Blog editor should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_editors
WHERE id = $1
"#,
        )
        .bind(relation_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("blog"))]
    async fn should_not_restore_blog_editors_from_deleted_blogs_when_activating_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Add an editor
        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
RETURNING id, deleted_at
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;
        let relation_id = result.get::<i64, _>("id");

        // Blog editor should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Soft-delete the blog
        sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Blog editor should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_editors
WHERE id = $1
"#,
        )
        .bind(relation_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blog editor should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_editors
WHERE id = $1
"#,
        )
        .bind(relation_id)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Blog editor should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_editors
WHERE id = $1
"#,
        )
        .bind(relation_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    //

    #[sqlx::test(fixtures("blog"))]
    async fn should_not_restore_blog_writers_from_deleted_blogs_when_cascading_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Add a writer
        let result = sqlx::query(
            r#"
WITH blog AS (
    SELECT user_id FROM blogs
    WHERE id = $1
)
INSERT INTO blog_writers (blog_id, receiver_id, transmitter_id)
VALUES ($1, $2, (SELECT user_id FROM blog))
RETURNING id, deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;
        let relation_id = result.get::<i64, _>("id");

        // Blog writer should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Soft-delete the blog
        sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Blog writer should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_writers
WHERE id = $1
"#,
        )
        .bind(relation_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blog writer should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_writers
WHERE id = $1
"#,
        )
        .bind(relation_id)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Blog writer should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_writers
WHERE id = $1
"#,
        )
        .bind(relation_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("blog"))]
    async fn should_not_restore_blog_writers_from_deleted_blogs_when_activating_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Add a writer
        let result = sqlx::query(
            r#"
WITH blog AS (
    SELECT user_id FROM blogs
    WHERE id = $1
)
INSERT INTO blog_writers (blog_id, receiver_id, transmitter_id)
VALUES ($1, $2, (SELECT user_id FROM blog))
RETURNING id, deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;
        let relation_id = result.get::<i64, _>("id");

        // Blog writer should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Soft-delete the blog
        sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Blog writer should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_writers
WHERE id = $1
"#,
        )
        .bind(relation_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Reactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blog writer should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_writers
WHERE id = $1
"#,
        )
        .bind(relation_id)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Blog writer should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_writers
WHERE id = $1
"#,
        )
        .bind(relation_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    //

    #[sqlx::test(fixtures("story"))]
    async fn should_not_restore_comments_from_deleted_stories_when_cascading_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a comment
        let result = sqlx::query(
            r#"
INSERT INTO comments (content, user_id, story_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample content")
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;
        let comment_id = result.get::<i64, _>("id");

        // Comment should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
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
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Comment should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comments
WHERE id = $1
"#,
        )
        .bind(comment_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Comment should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comments
WHERE id = $1
"#,
        )
        .bind(comment_id)
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
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Comment should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comments
WHERE id = $1
"#,
        )
        .bind(comment_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn should_not_restore_comments_from_deleted_stories_when_activating_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a comment
        let result = sqlx::query(
            r#"
INSERT INTO comments (content, user_id, story_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample content")
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;
        let comment_id = result.get::<i64, _>("id");

        // Comment should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
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
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Comment should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comments
WHERE id = $1
"#,
        )
        .bind(comment_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Comment should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comments
WHERE id = $1
"#,
        )
        .bind(comment_id)
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
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Comment should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comments
WHERE id = $1
"#,
        )
        .bind(comment_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    //

    #[sqlx::test(fixtures("story", "comment"))]
    async fn should_not_restore_replies_from_deleted_comments_when_cascading_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a reply
        let result = sqlx::query(
            r#"
INSERT INTO replies (content, user_id, comment_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample content")
        .bind(user_id)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;
        let reply_id = result.get::<i64, _>("id");

        // Reply should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Soft-delete the comment
        sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Reply should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM replies
WHERE id = $1
"#,
        )
        .bind(reply_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Reply should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM replies
WHERE id = $1
"#,
        )
        .bind(reply_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the comment
        sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Reply should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM replies
WHERE id = $1
"#,
        )
        .bind(reply_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("story", "comment"))]
    async fn should_not_restore_replies_from_deleted_comments_when_activating_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a reply
        let result = sqlx::query(
            r#"
INSERT INTO replies (content, user_id, comment_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample content")
        .bind(user_id)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;
        let reply_id = result.get::<i64, _>("id");

        // Reply should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Soft-delete the comment
        sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Reply should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM replies
WHERE id = $1
"#,
        )
        .bind(reply_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Reply should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM replies
WHERE id = $1
"#,
        )
        .bind(reply_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the comment
        sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Reply should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM replies
WHERE id = $1
"#,
        )
        .bind(reply_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user"))]
    async fn should_not_restore_followed_relation_having_deleted_followed_user_when_cascading_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Follow a user
        let result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Followed relation should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the current user and the followed user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id IN ($1, $2)
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Followed relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE followed_id = $1 AND follower_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the current user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Followed relation should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE followed_id = $1 AND follower_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the followed user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Followed relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE followed_id = $1 AND follower_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
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
    async fn should_not_restore_followed_relation_having_deleted_followed_user_when_activating_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Follow a user
        let result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Followed relation should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the current user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Soft-delete the followed user
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

        // Followed relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE followed_id = $1 AND follower_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Activate the current user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Followed relation should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE followed_id = $1 AND follower_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the followed user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Followed relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE followed_id = $1 AND follower_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
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
    async fn should_not_restore_followed_relation_having_deactivated_followed_user_when_cascading_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Follow a user
        let result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Followed relation should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the current user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Deactivate the followed user
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

        // Followed relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE followed_id = $1 AND follower_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the current user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Followed relation should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE followed_id = $1 AND follower_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Activate the followed user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Followed relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE followed_id = $1 AND follower_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
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
    async fn should_not_restore_followed_relation_having_deactivated_followed_user_when_activating_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Follow a user
        let result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Followed relation should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the current user and the followed user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id IN ($1, $2)
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Followed relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE followed_id = $1 AND follower_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Activate the current user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Followed relation should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE followed_id = $1 AND follower_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Activate the followed user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Followed relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE followed_id = $1 AND follower_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user"))]
    async fn should_not_restore_follower_relation_having_deleted_follower_user_when_cascading_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Add a follower
        let result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        // Follower relation should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the current user and the follower user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id IN ($1, $2)
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Follower relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE followed_id = $1 AND follower_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the current user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Follower relation should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE followed_id = $1 AND follower_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the follower user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Follower relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE followed_id = $1 AND follower_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
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
    async fn should_not_restore_follower_relation_having_deleted_follower_user_when_activating_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Add a follower
        let result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        // Follower relation should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the current user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Soft-delete the follower user
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

        // Follower relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE followed_id = $1 AND follower_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Activate the current user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Follower relation should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE followed_id = $1 AND follower_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the follower user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Follower relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE followed_id = $1 AND follower_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
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
    async fn should_not_restore_follower_relation_having_deactivated_follower_user_when_cascading_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Add a follower
        let result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        // Follower relation should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the current user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Deactivate the follower user
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

        // Follower relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE followed_id = $1 AND follower_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the current user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Follower relation should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE followed_id = $1 AND follower_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Activate the follower user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Follower relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE followed_id = $1 AND follower_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
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
    async fn should_not_restore_follower_relation_having_deactivated_follower_user_when_activating_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Add a follower
        let result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        // Follower relation should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the current user and the follower user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id IN ($1, $2)
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Follower relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE followed_id = $1 AND follower_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Activate the current user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Follower relation should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE followed_id = $1 AND follower_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Activate the follower user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Follower relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM relations
WHERE followed_id = $1 AND follower_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user"))]
    async fn should_not_restore_friend_relation_having_deleted_transmitter_user_when_cascading_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Receive a friend request
        let result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        // Friend relation should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the current user and the transmitter user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id IN ($1, $2)
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Friend relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the current user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Friend relation should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the transmitter user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Friend relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
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
    async fn should_not_restore_friend_relation_having_deleted_transmitter_user_when_activating_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Receive a friend request
        let result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        // Friend relation should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the current user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Soft-delete the transmitter user
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

        // Friend relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Activate the current user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Friend relation should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the transmitter user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Friend relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
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
    async fn should_not_restore_friend_relation_having_deactivated_transmitter_user_when_cascading_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Receive a friend request
        let result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        // Friend relation should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the current user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Deactivate the transmitter user
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

        // Friend relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the current user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Friend relation should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Activate the transmitter user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Friend relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
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
    async fn should_not_restore_friend_relation_having_deactivated_transmitter_user_when_activating_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Receive a friend request
        let result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        // Friend relation should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the current user and the transmitter user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id IN ($1, $2)
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Friend relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Activate the current user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Friend relation should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Activate the transmitter user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Friend relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user"))]
    async fn should_not_restore_friend_relation_having_deleted_receiver_user_when_cascading_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Send a friend request
        let result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Friend relation should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the current user and the receiver user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id IN ($1, $2)
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Friend relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the receiver user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Friend relation should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the receiver user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Friend relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
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
    async fn should_not_restore_friend_relation_having_deleted_receiver_user_when_activating_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Send a friend request
        let result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Friend relation should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the current user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Soft-delete the receiver user
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

        // Friend relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Activate the current user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Friend relation should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the receiver user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Friend relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
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
    async fn should_not_restore_friend_relation_having_deactivated_receiver_user_when_cascading_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Send a friend request
        let result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Friend relation should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the current user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Deactivate the receiver user
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

        // Friend relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the current user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Friend relation should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Activate the receiver user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Friend relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
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
    async fn should_not_restore_friend_relation_having_deactivated_receiver_user_when_activating_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Send a friend request
        let result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Friend relation should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the current user and the receiver user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id IN ($1, $2)
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Friend relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Activate the current user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Friend relation should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Activate the receiver user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Friend relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM friends
WHERE transmitter_id = $1 AND receiver_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    //

    #[sqlx::test(fixtures("story"))]
    async fn should_not_restore_story_contributor_having_deleted_story_when_cascading_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Contribute to a story
        let result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Story contributer should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
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
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Story contributer should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_contributors
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Story contributer should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_contributors
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
        .bind(2_i64)
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
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Story contributer should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_contributors
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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

    #[sqlx::test(fixtures("story"))]
    async fn should_not_restore_story_contributor_having_deleted_story_when_activating_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Contribute to a story
        let result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Story contributer should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
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
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Story contributer should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_contributors
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Story contributer should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_contributors
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
        .bind(2_i64)
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
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Story contributer should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_contributors
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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

    //

    #[sqlx::test(fixtures("blog"))]
    async fn should_not_restore_blog_followers_from_deleted_blogs_when_cascading_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Follow a blog
        let result = sqlx::query(
            r#"
INSERT INTO blog_followers (user_id, blog_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Blog follower relation should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Soft-delete the blog
        sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Blog follower relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_followers
WHERE user_id = $1 AND blog_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blog follower relation should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_followers
WHERE user_id = $1 AND blog_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Blog follower relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_followers
WHERE user_id = $1 AND blog_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("blog"))]
    async fn should_not_restore_blog_followers_from_deleted_blogs_when_activating_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Follow a blog
        let result = sqlx::query(
            r#"
INSERT INTO blog_followers (user_id, blog_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Blog follower relation should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Soft-delete the blog
        sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Blog follower relation should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_followers
WHERE user_id = $1 AND blog_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blog follower relation should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_followers
WHERE user_id = $1 AND blog_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Blog follower relation should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_followers
WHERE user_id = $1 AND blog_id = $2
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    //

    #[sqlx::test(fixtures("story"))]
    async fn should_not_restore_story_like_having_deleted_story_when_cascading_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Like a story
        let result = sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Story like should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
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
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Story like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Story like should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
        .bind(2_i64)
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
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Story like should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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

    #[sqlx::test(fixtures("story"))]
    async fn should_not_restore_story_like_having_deleted_story_when_activating_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Like a story
        let result = sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Story like should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
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
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Story like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Story like should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
        .bind(2_i64)
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
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Story like should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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

    //

    #[sqlx::test(fixtures("story", "comment"))]
    async fn should_not_restore_comment_like_having_deleted_comment_when_cascading_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Like a comment
        let result = sqlx::query(
            r#"
INSERT INTO comment_likes (user_id, comment_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Comment like should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Soft-delete the comment
        sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Comment like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comment_likes
WHERE user_id = $1 AND comment_id = $2
"#,
        )
        .bind(user_id)
        .bind(3_i64)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Comment like should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comment_likes
WHERE user_id = $1 AND comment_id = $2
"#,
        )
        .bind(user_id)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the comment
        sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Comment like should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comment_likes
WHERE user_id = $1 AND comment_id = $2
"#,
        )
        .bind(user_id)
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

    #[sqlx::test(fixtures("story", "comment"))]
    async fn should_not_restore_comment_like_having_deleted_comment_when_activating_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Like a comment
        let result = sqlx::query(
            r#"
INSERT INTO comment_likes (user_id, comment_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Comment like should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Soft-delete the comment
        sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Comment like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comment_likes
WHERE user_id = $1 AND comment_id = $2
"#,
        )
        .bind(user_id)
        .bind(3_i64)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Comment like should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comment_likes
WHERE user_id = $1 AND comment_id = $2
"#,
        )
        .bind(user_id)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the comment
        sqlx::query(
            r#"
UPDATE comments
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Comment like should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comment_likes
WHERE user_id = $1 AND comment_id = $2
"#,
        )
        .bind(user_id)
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

    //

    #[sqlx::test(fixtures("story", "comment", "reply"))]
    async fn should_not_restore_reply_like_having_deleted_reply_when_cascading_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Like a reply
        let result = sqlx::query(
            r#"
INSERT INTO reply_likes (user_id, reply_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Reply like should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Soft-delete the reply
        sqlx::query(
            r#"
UPDATE replies
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        // Reply like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM reply_likes
WHERE user_id = $1 AND reply_id = $2
"#,
        )
        .bind(user_id)
        .bind(4_i64)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Reply like should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM reply_likes
WHERE user_id = $1 AND reply_id = $2
"#,
        )
        .bind(user_id)
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the reply
        sqlx::query(
            r#"
UPDATE replies
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        // Reply like should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM reply_likes
WHERE user_id = $1 AND reply_id = $2
"#,
        )
        .bind(user_id)
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("story", "comment", "reply"))]
    async fn should_not_restore_reply_like_having_deleted_reply_when_activating_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Like a reply
        let result = sqlx::query(
            r#"
INSERT INTO reply_likes (user_id, reply_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Reply like should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Soft-delete the reply
        sqlx::query(
            r#"
UPDATE replies
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        // Reply like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM reply_likes
WHERE user_id = $1 AND reply_id = $2
"#,
        )
        .bind(user_id)
        .bind(4_i64)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Reply like should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM reply_likes
WHERE user_id = $1 AND reply_id = $2
"#,
        )
        .bind(user_id)
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Restore the reply
        sqlx::query(
            r#"
UPDATE replies
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        // Reply like should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM reply_likes
WHERE user_id = $1 AND reply_id = $2
"#,
        )
        .bind(user_id)
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    //

    #[sqlx::test(fixtures("story"))]
    async fn should_not_restore_bookmarks_from_deleted_stories_when_cascading_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a bookmark
        let result = sqlx::query(
            r#"
INSERT INTO bookmarks (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Bookmark should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
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
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Bookmark should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM bookmarks
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Bookmark should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM bookmarks
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
        .bind(2_i64)
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
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Bookmark should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM bookmarks
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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

    #[sqlx::test(fixtures("story"))]
    async fn should_not_restore_bookmarks_from_deleted_stories_when_activating_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a bookmark
        let result = sqlx::query(
            r#"
INSERT INTO bookmarks (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Bookmark should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
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
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Bookmark should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM bookmarks
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Bookmark should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM bookmarks
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
        .bind(2_i64)
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
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // Bookmark should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM bookmarks
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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

    //

    #[sqlx::test(fixtures("story"))]
    async fn should_not_restore_histories_from_deleted_stories_when_cascading_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a history
        let result = sqlx::query(
            r#"
INSERT INTO histories (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        // History should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
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
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // History should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM histories
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // History should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM histories
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
        .bind(2_i64)
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
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // History should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM histories
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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

    #[sqlx::test(fixtures("story"))]
    async fn should_not_restore_histories_from_deleted_stories_when_activating_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a history
        let result = sqlx::query(
            r#"
INSERT INTO histories (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        // History should not be deleted initially
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
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
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // History should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM histories
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // History should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM histories
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
        .bind(2_i64)
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
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        // History should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM histories
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
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

    //

    #[sqlx::test]
    async fn can_restore_self_followed_blogs_from_self_blogs_when_cascading_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Create a blog
        let blog_result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        // Follow the blog
        let follow_result = sqlx::query(
            r#"
INSERT INTO blog_followers (user_id, blog_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(blog_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        // Blog follower should not be deleted initially
        assert!(
            follow_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blog follower should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_followers
WHERE user_id = $1 AND blog_id = $2
"#,
        )
        .bind(user_id)
        .bind(blog_result.get::<i64, _>("id"))
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blog follower should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_followers
WHERE user_id = $1 AND blog_id = $2
"#,
        )
        .bind(user_id)
        .bind(blog_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_restore_self_followed_blogs_from_self_blogs_when_activating_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Create a blog
        let blog_result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        // Follow the blog
        let follow_result = sqlx::query(
            r#"
INSERT INTO blog_followers (user_id, blog_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(blog_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        // Blog follower should not be deleted initially
        assert!(
            follow_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blog follower should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_followers
WHERE user_id = $1 AND blog_id = $2
"#,
        )
        .bind(user_id)
        .bind(blog_result.get::<i64, _>("id"))
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blog follower should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_followers
WHERE user_id = $1 AND blog_id = $2
"#,
        )
        .bind(user_id)
        .bind(blog_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    //

    #[sqlx::test]
    async fn can_restore_self_comments_from_self_stories_when_cascading_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a story
        let story_result = sqlx::query(
            r#"
INSERT INTO stories (user_id, published_at)
VALUES ($1, NOW())
RETURNING id, deleted_at
"#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        // Insert a comment
        let comment_result = sqlx::query(
            r#"
INSERT INTO comments (content, user_id, story_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample content".to_string())
        .bind(user_id)
        .bind(story_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        // Comment should not be deleted initially
        assert!(
            comment_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Comment should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comments
WHERE id = $1
"#,
        )
        .bind(comment_result.get::<i64, _>("id"))
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Comment should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comments
WHERE id = $1
"#,
        )
        .bind(comment_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_restore_self_comments_from_self_stories_when_activating_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a story
        let story_result = sqlx::query(
            r#"
INSERT INTO stories (user_id, published_at)
VALUES ($1, NOW())
RETURNING id, deleted_at
"#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        // Insert a comment
        let comment_result = sqlx::query(
            r#"
INSERT INTO comments (content, user_id, story_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample content".to_string())
        .bind(user_id)
        .bind(story_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        // Comment should not be deleted initially
        assert!(
            comment_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Comment should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comments
WHERE id = $1
"#,
        )
        .bind(comment_result.get::<i64, _>("id"))
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Comment should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comments
WHERE id = $1
"#,
        )
        .bind(comment_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    //

    #[sqlx::test(fixtures("story"))]
    async fn can_restore_self_replies_from_self_comments_when_cascading_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a comment
        let comment_result = sqlx::query(
            r#"
INSERT INTO comments (content, user_id, story_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample content".to_string())
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Insert a reply
        let reply_result = sqlx::query(
            r#"
INSERT INTO replies (content, user_id, comment_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample content".to_string())
        .bind(user_id)
        .bind(comment_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        // Reply should not be deleted initially
        assert!(
            reply_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Reply should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM replies
WHERE id = $1
"#,
        )
        .bind(reply_result.get::<i64, _>("id"))
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Reply should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM replies
WHERE id = $1
"#,
        )
        .bind(reply_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_restore_self_replies_from_self_comments_when_activating_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a comment
        let comment_result = sqlx::query(
            r#"
INSERT INTO comments (content, user_id, story_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample content".to_string())
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Insert a reply
        let reply_result = sqlx::query(
            r#"
INSERT INTO replies (content, user_id, comment_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample content".to_string())
        .bind(user_id)
        .bind(comment_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        // Reply should not be deleted initially
        assert!(
            reply_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Reply should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM replies
WHERE id = $1
"#,
        )
        .bind(reply_result.get::<i64, _>("id"))
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Reply should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM replies
WHERE id = $1
"#,
        )
        .bind(reply_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    //

    #[sqlx::test]
    async fn can_restore_self_story_likes_from_self_stories_when_cascading_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a story
        let story_result = sqlx::query(
            r#"
INSERT INTO stories (user_id, published_at)
VALUES ($1, NOW())
RETURNING id, deleted_at
"#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        // Like the story
        let story_like_result = sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(story_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        // Story like should not be deleted initially
        assert!(
            story_like_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Story like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
        .bind(story_result.get::<i64, _>("id"))
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Story like should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
        .bind(story_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_restore_self_story_likes_from_self_stories_when_activating_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a story
        let story_result = sqlx::query(
            r#"
INSERT INTO stories (user_id, published_at)
VALUES ($1, NOW())
RETURNING id, deleted_at
"#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        // Like the story
        let story_like_result = sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(story_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        // Story like should not be deleted initially
        assert!(
            story_like_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Story like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
        .bind(story_result.get::<i64, _>("id"))
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Story like should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(user_id)
        .bind(story_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    //

    #[sqlx::test(fixtures("story"))]
    async fn can_restore_self_comment_likes_from_self_comments_when_cascading_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a comment
        let comment_result = sqlx::query(
            r#"
INSERT INTO comments (content, user_id, story_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample content".to_string())
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Like the comment
        let comment_like_result = sqlx::query(
            r#"
INSERT INTO comment_likes (user_id, comment_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(comment_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        // Comment like should not be deleted initially
        assert!(
            comment_like_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Comment like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comment_likes
WHERE user_id = $1 AND comment_id = $2
"#,
        )
        .bind(user_id)
        .bind(comment_result.get::<i64, _>("id"))
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Comment like should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comment_likes
WHERE user_id = $1 AND comment_id = $2
"#,
        )
        .bind(user_id)
        .bind(comment_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_restore_self_comment_likes_from_self_comments_when_activating_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a comment
        let comment_result = sqlx::query(
            r#"
INSERT INTO comments (content, user_id, story_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample content".to_string())
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Like the comment
        let comment_like_result = sqlx::query(
            r#"
INSERT INTO comment_likes (user_id, comment_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(comment_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        // Comment like should not be deleted initially
        assert!(
            comment_like_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Comment like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comment_likes
WHERE user_id = $1 AND comment_id = $2
"#,
        )
        .bind(user_id)
        .bind(comment_result.get::<i64, _>("id"))
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Comment like should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM comment_likes
WHERE user_id = $1 AND comment_id = $2
"#,
        )
        .bind(user_id)
        .bind(comment_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    //

    #[sqlx::test(fixtures("story", "comment"))]
    async fn can_restore_self_reply_likes_from_self_replies_when_cascading_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a reply
        let reply_result = sqlx::query(
            r#"
INSERT INTO replies (content, user_id, comment_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample content".to_string())
        .bind(user_id)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Like the reply
        let reply_like_result = sqlx::query(
            r#"
INSERT INTO reply_likes (user_id, reply_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(reply_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        // Reply like should not be deleted initially
        assert!(
            reply_like_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the user
        sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Reply like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM reply_likes
WHERE user_id = $1 AND reply_id = $2
"#,
        )
        .bind(user_id)
        .bind(reply_result.get::<i64, _>("id"))
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Reply like should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM reply_likes
WHERE user_id = $1 AND reply_id = $2
"#,
        )
        .bind(user_id)
        .bind(reply_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("story", "comment"))]
    async fn can_restore_self_reply_likes_from_self_replies_when_activating_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a reply
        let reply_result = sqlx::query(
            r#"
INSERT INTO replies (content, user_id, comment_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample content".to_string())
        .bind(user_id)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Like the reply
        let reply_like_result = sqlx::query(
            r#"
INSERT INTO reply_likes (user_id, reply_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(user_id)
        .bind(reply_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        // Reply like should not be deleted initially
        assert!(
            reply_like_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Deactivate the user
        sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Reply like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM reply_likes
WHERE user_id = $1 AND reply_id = $2
"#,
        )
        .bind(user_id)
        .bind(reply_result.get::<i64, _>("id"))
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
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Reply like should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM reply_likes
WHERE user_id = $1 AND reply_id = $2
"#,
        )
        .bind(user_id)
        .bind(reply_result.get::<i64, _>("id"))
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

    #[sqlx::test]
    async fn can_delete_story_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a story
        let insert_result = sqlx::query(
            r#"
INSERT INTO stories (user_id)
VALUES ($1)
RETURNING id
"#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Delete the user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Story should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM stories
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

    #[sqlx::test(fixtures("story"))]
    async fn can_delete_comment_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a comment
        let insert_result = sqlx::query(
            r#"
INSERT INTO comments (content, user_id, story_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Sample content".to_string())
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Delete the user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Comment should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM comments
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

    #[sqlx::test(fixtures("story", "comment"))]
    async fn can_delete_reply_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a reply
        let insert_result = sqlx::query(
            r#"
INSERT INTO replies (content, user_id, comment_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Sample content".to_string())
        .bind(user_id)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Delete the user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Reply should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM replies
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
    async fn can_delete_followed_relation_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Follow a user
        let insert_result = sqlx::query(
            r#"
INSERT INTO relations (followed_id, follower_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the current user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Followed relation should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM relations
    WHERE followed_id = $1 AND follower_id = $2
)
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_follower_relation_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Add a follower
        let insert_result = sqlx::query(
            r#"
INSERT INTO relations (followed_id, follower_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the current user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Follower relation should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM relations
    WHERE followed_id = $1 AND follower_id = $2
)
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_transmitted_friend_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Send a friend request
        let insert_result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the current user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Friend relation should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM friends
    WHERE transmitter_id = $1 AND receiver_id = $2
)
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_received_friend_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Receive a friend request
        let insert_result = sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the current user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Friend relation should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM friends
    WHERE transmitter_id = $1 AND receiver_id = $2
)
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_set_asset_user_id_as_null_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

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
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Delete the current user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // `user_id` should be NULL on the asset
        let result = sqlx::query(
            r#"
SELECT user_id FROM assets
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<Option<i64>, _>("user_id").is_none());

        Ok(())
    }

    #[sqlx::test]
    async fn can_set_blog_user_id_as_null_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a blog
        let insert_result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Delete the current user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // `user_id` should be NULL on the blog
        let result = sqlx::query(
            r#"
SELECT user_id FROM blogs
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<Option<i64>, _>("user_id").is_none());

        Ok(())
    }

    #[sqlx::test(fixtures("blog"))]
    async fn can_set_blog_writer_transmitter_id_as_null_on_transmitter_hard_delete(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Send a writer invite
        let insert_result = sqlx::query(
            r#"
WITH inserted_editor AS (
    INSERT INTO blog_editors (blog_id, user_id, accepted_at)
    VALUES ($1, $2, NOW())
), receiver AS (
    INSERT INTO users (name, username, email)
    VALUES ('Writer', 'writer', 'writer@example.com')
    RETURNING id
)
INSERT INTO blog_writers (blog_id, receiver_id, transmitter_id)
VALUES ($1, (SELECT id FROM receiver), $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Delete the transmitter
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blog writer relation should not be deleted
        let result = sqlx::query(
            r#"
SELECT transmitter_id FROM blog_writers
WHERE blog_id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<Option<i64>, _>("transmitter_id").is_none());

        Ok(())
    }

    #[sqlx::test]
    async fn can_set_user_avatar_id_as_null_on_asset_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

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
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Set `avatar_id` and `avatar_hex` on the user
        let update_result = sqlx::query(
            r#"
WITH asset AS (
    SELECT key, hex FROM assets
    WHERE id = $1
)
UPDATE users
SET
    avatar_id = (SELECT key FROM asset),
    avatar_hex = (SELECT hex FROM asset)
WHERE id = $2
RETURNING avatar_id, avatar_hex
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(update_result.get::<Option<Uuid>, _>("avatar_id").is_some());
        assert!(
            update_result
                .get::<Option<String>, _>("avatar_hex")
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

        // `avatar_id` and `avatar_hex` should be NULL
        let update_result = sqlx::query(
            r#"
SELECT
    avatar_id,
    avatar_hex
FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(update_result.get::<Option<Uuid>, _>("avatar_id").is_none());
        assert!(
            update_result
                .get::<Option<String>, _>("avatar_hex")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_set_user_banner_id_as_null_on_asset_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

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
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Set `banner_id` and `banner_hex` on the user
        let update_result = sqlx::query(
            r#"
WITH asset AS (
    SELECT key, hex FROM assets
    WHERE id = $1
)
UPDATE users
SET
    banner_id = (SELECT key FROM asset),
    banner_hex = (SELECT hex FROM asset)
WHERE id = $2
RETURNING banner_id, banner_hex
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .bind(user_id)
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
FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
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

    #[sqlx::test(fixtures("story"))]
    async fn can_delete_story_contributor_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Contribute to a story
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the current user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Story contributor should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM story_contributors
    WHERE user_id = $1 AND story_id = $2
)
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_delete_story_like_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Like a story
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the current user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Story like should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM story_likes
    WHERE user_id = $1 AND story_id = $2
)
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("story", "comment"))]
    async fn can_delete_comment_like_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Like a comment
        let insert_result = sqlx::query(
            r#"
INSERT INTO comment_likes (user_id, comment_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the current user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Comment like should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM comment_likes
    WHERE user_id = $1 AND comment_id = $2
)
"#,
        )
        .bind(user_id)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("story", "comment", "reply"))]
    async fn can_delete_reply_like_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Like a reply
        let insert_result = sqlx::query(
            r#"
INSERT INTO reply_likes (user_id, reply_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the current user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Reply like should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM reply_likes
    WHERE user_id = $1 AND reply_id = $2
)
"#,
        )
        .bind(user_id)
        .bind(4_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_delete_bookmark_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a bookmark
        let insert_result = sqlx::query(
            r#"
INSERT INTO bookmarks (user_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the current user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Bookmark should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM bookmarks
    WHERE user_id = $1 AND story_id = $2
)
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_delete_history_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a history
        let insert_result = sqlx::query(
            r#"
INSERT INTO histories (user_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the current user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // History should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM histories
    WHERE user_id = $1 AND story_id = $2
)
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("tag"))]
    async fn can_delete_followed_tag_relation_on_user_hard_delete(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Follow a tag
        let insert_result = sqlx::query(
            r#"
INSERT INTO tag_followers (tag_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the current user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Followed tag relation should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM tag_followers
    WHERE tag_id = $1 AND user_id = $2
)
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("blog"))]
    async fn can_delete_followed_blog_relation_on_user_hard_delete(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Follow a blog
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_followers (blog_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the current user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Followed blog relation should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM blog_followers
    WHERE blog_id = $1 AND user_id = $2
)
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("blog"))]
    async fn can_delete_blog_editor_relation_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Add an editor
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_editors (blog_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the current user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blog editor should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM blog_editors
    WHERE blog_id = $1 AND user_id = $2
)
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("blog"))]
    async fn can_delete_blog_writer_relation_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Add a writer
        let insert_result = sqlx::query(
            r#"
WITH blog AS (
    SELECT user_id FROM blogs
    WHERE id = $1
)
INSERT INTO blog_writers (blog_id, receiver_id, transmitter_id)
VALUES ($1, $2, (SELECT user_id FROM blog))
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the current user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blog writer should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM blog_writers
    WHERE blog_id = $1 AND receiver_id = $2
)
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_blocked_relation_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Get blocked by a user
        let insert_result = sqlx::query(
            r#"
INSERT INTO blocks (blocker_id, blocked_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the current user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blocked relation should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM blocks
    WHERE blocker_id = $1 AND blocked_id = $2
)
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_blocker_relation_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Block a user
        let insert_result = sqlx::query(
            r#"
INSERT INTO blocks (blocker_id, blocked_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the current user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Blocker relation should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM blocks
    WHERE blocker_id = $1 AND blocked_id = $2
)
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_muted_relation_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Get muted by a user
        let insert_result = sqlx::query(
            r#"
INSERT INTO mutes (muter_id, muted_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the current user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Muted relation should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM mutes
    WHERE muter_id = $1 AND muted_id = $2
)
"#,
        )
        .bind(1_i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_muter_relation_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Mute a user
        let insert_result = sqlx::query(
            r#"
INSERT INTO mutes (muter_id, muted_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the current user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Muter relation should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM mutes
    WHERE muter_id = $1 AND muted_id = $2
)
"#,
        )
        .bind(user_id)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_token_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let token_id = nanoid!(TOKEN_LENGTH);

        // Insert a token
        let insert_result = sqlx::query(
            r#"
INSERT INTO tokens (id, type, user_id, expires_at)
VALUES ($1, $2, $3, NOW())
RETURNING id
"#,
        )
        .bind(&token_id)
        .bind(0_i16)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Token should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
  SELECT 1 FROM tokens
  WHERE id = $1
)
"#,
        )
        .bind(&token_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_delete_transmitted_notifications_on_user_hard_delete(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Transmit a notification
        let insert_result = sqlx::query(
            r#"
INSERT INTO notifications (entity_id, entity_type, notifier_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind(1_i64)
        .bind(0)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Delete the user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Transmitted notification should be deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
  SELECT 1 FROM notifications
  WHERE notifier_id = $1
)
"#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user", "notification"))]
    async fn can_delete_received_notifications_on_user_hard_delete(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Receive a notification
        let insert_result = sqlx::query(
            r#"
INSERT INTO notification_outs (notified_id, notification_id)
VALUES ($1, $2)
"#,
        )
        .bind(user_id)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Received notification should be deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
  SELECT 1 FROM notification_outs
  WHERE notified_id = $1
)
"#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_notifications_with_user_id_as_entity_id_on_user_hard_delete(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Transmit a notification
        let insert_result = sqlx::query(
            r#"
INSERT INTO notifications (entity_id, entity_type, notifier_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind(user_id)
        .bind(0)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Delete the user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Notification should be deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
  SELECT 1 FROM notifications
  WHERE notifier_id = $1
)
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_delete_notification_settings_on_user_hard_delete(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Delete the current user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Notification settings should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM notification_settings
    WHERE user_id = $1
)
"#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_delete_connections_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a connection
        let insert_result = sqlx::query(
            r#"
INSERT INTO connections (provider, provider_identifier, display_name, user_id)
VALUES (0, 'sample', 'sample', $1)
RETURNING id
"#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Delete the current user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Connection should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM connections
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

    #[sqlx::test]
    async fn can_delete_account_activities_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert an activity
        let insert_result = sqlx::query(
            r#"
INSERT INTO account_activities(type, user_id)
VALUES (0, $1)
RETURNING id 
"#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Delete the current user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Activity should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM account_activities
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

    #[sqlx::test]
    async fn can_delete_mfa_recovery_codes_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a recovery code
        let insert_result = sqlx::query(
            r#"
INSERT INTO mfa_recovery_codes(code, user_id)
VALUES ($1, $2)
"#,
        )
        .bind("0".repeat(12))
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the current user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = $1
"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Recovery code should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM mfa_recovery_codes
    WHERE code = $1
)
"#,
        )
        .bind("0".repeat(12))
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }
}
