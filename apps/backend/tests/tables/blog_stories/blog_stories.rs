#[cfg(test)]
mod tests {
    use sqlx::PgPool;
    use storiny::constants::sql_states::SqlState;

    #[sqlx::test(fixtures("user", "story", "blog"))]
    async fn can_insert_a_blog_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Add the user as an editor.
        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (blog_id, user_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(3_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Insert the blog story.
        let result = sqlx::query(
            r#"
INSERT INTO blog_stories (blog_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user", "story", "blog"))]
    async fn can_reject_blog_story_for_soft_deleted_blog(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Add the user as an editor.
        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (blog_id, user_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(3_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Soft-delete the blog
        sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO blog_stories (blog_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(4_i64)
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

    #[sqlx::test(fixtures("user", "story", "blog"))]
    async fn can_reject_blog_story_for_soft_deleted_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Add the user as an editor.
        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (blog_id, user_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(3_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO blog_stories (blog_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(4_i64)
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

    #[sqlx::test(fixtures("user", "story", "blog"))]
    async fn can_reject_blog_story_for_a_locked_blog(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Add the user as an editor.
        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (blog_id, user_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(3_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Lock the blog
        sqlx::query(
            r#"
UPDATE blogs
SET is_active = FALSE
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO blog_stories (blog_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(4_i64)
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
            SqlState::BlogLocked.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "blog"))]
    async fn can_reject_blog_story_from_an_unknown_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
INSERT INTO blog_stories (blog_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(4_i64)
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
            SqlState::IllegalBlogStory.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "blog"))]
    async fn can_accept_blog_story_from_the_owner_of_the_blog(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Change the owner of the blog.
        let result = sqlx::query(
            r#"
UPDATE blogs
SET user_id = $1
WHERE id = $2
"#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let result = sqlx::query(
            r#"
INSERT INTO blog_stories (blog_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "blog"))]
    async fn can_accept_blog_story_from_an_editor_of_the_blog(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Add the user as a non-accepted editor.
        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (blog_id, user_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Try adding the blog story.
        let result = sqlx::query(
            r#"
INSERT INTO blog_stories (blog_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(4_i64)
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
            SqlState::IllegalBlogStory.to_string()
        );

        // Accept the blog editor invite.
        let result = sqlx::query(
            r#"
UPDATE blog_editors
SET accepted_at = NOW()
WHERE user_id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let result = sqlx::query(
            r#"
INSERT INTO blog_stories (blog_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story", "blog"))]
    async fn can_accept_blog_story_from_a_writer_of_the_blog(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Add the user as a non-accepted writer.
        let result = sqlx::query(
            r#"
WITH blog AS (
    SELECT user_id FROM blogs
    WHERE id = $1
)
INSERT INTO blog_writers (blog_id, transmitter_id, receiver_id)
VALUES ($1, (SELECT user_id FROM blog), $2)
"#,
        )
        .bind(3_i64)
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Try adding the blog story.
        let result = sqlx::query(
            r#"
INSERT INTO blog_stories (blog_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(4_i64)
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
            SqlState::IllegalBlogStory.to_string()
        );

        // Accept the blog writer invite.
        let result = sqlx::query(
            r#"
UPDATE blog_writers
SET accepted_at = NOW()
WHERE receiver_id = $1
"#,
        )
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let result = sqlx::query(
            r#"
INSERT INTO blog_stories (blog_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }
}
