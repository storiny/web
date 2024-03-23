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
    use time::OffsetDateTime;
    use uuid::Uuid;

    /// Inserts a sample story into the database.
    ///
    /// * `conn` - Pool connection.
    /// * `is_published` - Whether to insert a published story.
    async fn insert_sample_story(
        conn: &mut PoolConnection<Postgres>,
        is_published: bool,
    ) -> Result<PgRow, Error> {
        sqlx::query(
            r#"
INSERT INTO stories (user_id, published_at, first_published_at)
VALUES ($1, $2, $2)
RETURNING id
"#,
        )
        .bind(1_i64)
        .bind(if is_published {
            Some(OffsetDateTime::now_utc())
        } else {
            None
        })
        .fetch_one(&mut **conn)
        .await
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_insert_a_valid_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = insert_sample_story(&mut conn, false).await?;
        assert!(result.try_get::<i64, _>("id").is_ok());
        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_insert_document_on_story_insert(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = insert_sample_story(&mut conn, false).await?;

        // Should insert a document for the new story
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM documents
    WHERE story_id = $1
)
"#,
        )
        .bind(result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_story_for_soft_deleted_story_writer(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Soft-delete the story writer
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
INSERT INTO stories (user_id)
VALUES ($1)
"#,
        )
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

    #[sqlx::test(fixtures("user"))]
    async fn can_reject_story_for_deactivated_story_writer(pool: PgPool) -> sqlx::Result<()> {
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
INSERT INTO stories (user_id)
VALUES ($1)
"#,
        )
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

    // Comments

    #[sqlx::test(fixtures("user"))]
    async fn can_cascade_story_soft_delete_to_comments(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a comment
        let insert_result = sqlx::query(
            r#"
INSERT INTO comments (content, user_id, story_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample content".to_string())
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
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

        // Restore the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
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

    #[sqlx::test(fixtures("user"))]
    async fn can_soft_delete_comments_when_the_story_is_unpublished(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a comment
        let insert_result = sqlx::query(
            r#"
INSERT INTO comments (content, user_id, story_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample content".to_string())
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Unpublish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
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

        // Republish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
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

    // Blog stories

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_cascade_story_soft_delete_to_blog_stories(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Add the story to the blog.
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_stories (blog_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(3_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Blog story should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_stories
WHERE blog_id = $1 AND story_id = $2
"#,
        )
        .bind(3_i64)
        .bind(story_id)
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
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Blog story should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_stories
WHERE blog_id = $1 AND story_id = $2
"#,
        )
        .bind(3_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog"))]
    async fn should_not_soft_delete_blog_stories_when_the_story_is_unpublished(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Add the story to the blog.
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_stories (blog_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(3_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Unpublish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Blog story should not be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_stories
WHERE blog_id = $1 AND story_id = $2
"#,
        )
        .bind(3_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_set_accepted_at_field_to_null_when_the_story_is_unpublished(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Add the story to the blog.
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_stories (blog_id, story_id, accepted_at)
VALUES ($1, $2, NOW())
RETURNING accepted_at
"#,
        )
        .bind(3_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("accepted_at")
                .is_some()
        );

        // Unpublish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // `accepted_at` should be NULL
        let result = sqlx::query(
            r#"
SELECT accepted_at FROM blog_stories
WHERE blog_id = $1 AND story_id = $2
"#,
        )
        .bind(3_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("accepted_at")
                .is_none()
        );

        Ok(())
    }

    // Story contributors

    #[sqlx::test(fixtures("user"))]
    async fn can_cascade_story_soft_delete_to_story_contributors(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Contribute to the story
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(4_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Story contributor should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_contributors
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(4_i64)
        .bind(story_id)
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
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Story contributor should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_contributors
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(4_i64)
        .bind(story_id)
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
    async fn should_not_soft_delete_story_contributors_when_the_story_is_unpublished(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Contribute to the story
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(4_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Unpublish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Story contributor should not be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_contributors
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(4_i64)
        .bind(story_id)
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

    #[sqlx::test(fixtures("user"))]
    async fn can_cascade_story_soft_delete_to_story_likes(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Like the story
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Story like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Story like should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
    async fn can_soft_delete_story_likes_when_the_story_is_unpublished(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Like the story
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Unpublish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Story like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Republish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Story like should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        Ok(())
    }

    // Story reads

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_story_reads_when_the_story_is_soft_deleted(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Read the story
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_reads (country_code, story_id)
VALUES ($1, $2)
RETURNING id
"#,
        )
        .bind("XX")
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Story read should be deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM story_reads
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
    async fn can_delete_story_reads_when_the_story_is_unpublished(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Read the story
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_reads (country_code, story_id)
VALUES ($1, $2)
RETURNING id
"#,
        )
        .bind("XX")
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Unpublish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Story read should be deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM story_reads
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

    // Story/draft tags

    #[sqlx::test(fixtures("user", "tag"))]
    async fn can_convert_story_tags_to_draft_tags_when_the_story_is_soft_deleted(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert some story tags
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_tags (tag_id, story_id)
VALUES ($2, $1), ($3, $1)
"#,
        )
        .bind(story_id)
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Draft tags should get inserted
        let result = sqlx::query(
            r#"
SELECT name FROM draft_tags
WHERE story_id = $1
ORDER BY
    name
"#,
        )
        .bind(story_id)
        .fetch_all(&mut *conn)
        .await?;

        assert_eq!(result[0].get::<String, _>("name"), "one");
        assert_eq!(result[1].get::<String, _>("name"), "two");

        // Story tag should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM story_tags
    WHERE tag_id IN ($1, $2) AND story_id = $2
)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        // Tag with 0 story count should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM tags
    WHERE name = $1
)
"#,
        )
        .bind("two".to_string())
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user", "tag"))]
    async fn can_convert_story_tags_to_draft_tags_when_the_story_is_unpublished(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert some story tags
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_tags (tag_id, story_id)
VALUES ($2, $1), ($3, $1)
"#,
        )
        .bind(story_id)
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Unpublish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Draft tags should get inserted
        let result = sqlx::query(
            r#"
SELECT name FROM draft_tags
WHERE story_id = $1
ORDER BY
    name
"#,
        )
        .bind(story_id)
        .fetch_all(&mut *conn)
        .await?;

        assert_eq!(result[0].get::<String, _>("name"), "one");
        assert_eq!(result[1].get::<String, _>("name"), "two");

        // Story tag should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM story_tags
    WHERE tag_id IN ($1, $2) AND story_id = $2
)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        // Tag with 0 story count should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM tags
    WHERE name = $1
)
"#,
        )
        .bind("two".to_string())
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user", "tag"))]
    async fn can_convert_draft_tags_to_story_tags_when_the_story_is_restored(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Insert some draft tags
        let insert_result = sqlx::query(
            r#"
INSERT INTO draft_tags(name, story_id)
VALUES ($2, $1), ($3, $1)
"#,
        )
        .bind(story_id)
        .bind("one".to_string()) // Existing tag
        .bind("new".to_string()) // Should create a new tag
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Restore the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Story tags and tags should get inserted
        let result = sqlx::query(
            r#"
SELECT
    t.name
FROM story_tags st
    INNER JOIN tags t
        ON st.tag_id = t.id
WHERE st.story_id = $1
ORDER BY
    t.name
"#,
        )
        .bind(story_id)
        .fetch_all(&mut *conn)
        .await?;

        assert_eq!(result[0].get::<String, _>("name"), "new"); // New tag
        assert_eq!(result[1].get::<String, _>("name"), "one"); // Existing

        Ok(())
    }

    #[sqlx::test(fixtures("user", "tag"))]
    async fn can_convert_draft_tags_to_story_tags_when_the_story_is_published(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, false).await?).get::<i64, _>("id");

        // Insert some draft tags
        let insert_result = sqlx::query(
            r#"
INSERT INTO draft_tags(name, story_id)
VALUES ($2, $1), ($3, $1)
"#,
        )
        .bind(story_id)
        .bind("one".to_string()) // Existing tag
        .bind("new".to_string()) // Should create a new tag
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        // Publish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Story tags and tags should get inserted
        let result = sqlx::query(
            r#"
SELECT
    t.name
FROM story_tags st
    INNER JOIN tags t
        ON st.tag_id = t.id
WHERE st.story_id = $1
ORDER BY
    t.name
"#,
        )
        .bind(story_id)
        .fetch_all(&mut *conn)
        .await?;

        assert_eq!(result[0].get::<String, _>("name"), "new"); // New tag
        assert_eq!(result[1].get::<String, _>("name"), "one"); // Existing

        Ok(())
    }

    // Bookmarks

    #[sqlx::test(fixtures("user"))]
    async fn can_cascade_story_soft_delete_to_bookmarks(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a bookmark
        let insert_result = sqlx::query(
            r#"
INSERT INTO bookmarks (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Bookmark should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM bookmarks
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Bookmark should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM bookmarks
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
    async fn can_soft_delete_bookmarks_when_the_story_is_unpublished(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a bookmark
        let insert_result = sqlx::query(
            r#"
INSERT INTO bookmarks (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Unpublish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Bookmark should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM bookmarks
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Republish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Bookmark should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM bookmarks
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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

    #[sqlx::test(fixtures("user"))]
    async fn can_cascade_story_soft_delete_to_histories(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a history
        let insert_result = sqlx::query(
            r#"
INSERT INTO histories (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // History should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM histories
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // History should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM histories
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
    async fn can_soft_delete_histories_when_the_story_is_unpublished(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a history
        let insert_result = sqlx::query(
            r#"
INSERT INTO histories (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Unpublish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // History should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM histories
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Republish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // History should be restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM histories
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_notifications_when_the_story_is_soft_deleted(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a notification
        let insert_result = sqlx::query(
            r#"
INSERT INTO notifications (entity_id, entity_type, notifier_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind(story_id)
        .bind(0)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Notification should be deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
  SELECT 1 FROM notifications
  WHERE entity_id = $1
)
"#,
        )
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_notifications_when_the_story_is_unpublished(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a notification
        let insert_result = sqlx::query(
            r#"
INSERT INTO notifications (entity_id, entity_type, notifier_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind(story_id)
        .bind(0)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Unpublish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Notification should be deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
  SELECT 1 FROM notifications
  WHERE entity_id = $1
)
"#,
        )
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user"))]
    async fn can_set_editable_document_story_id_as_null_when_soft_deleting_the_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Update the document
        let update_result = sqlx::query(
            r#"
UPDATE documents
SET
    key = $1,
    is_editable = TRUE
WHERE story_id = $2
RETURNING key
"#,
        )
        .bind(Uuid::new_v4())
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(update_result.try_get::<Uuid, _>("key").is_ok());

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Should set `story_id` to `NULL` on the document
        let result = sqlx::query(
            r#"
SELECT story_id FROM documents
WHERE key = $1
"#,
        )
        .bind(update_result.get::<Uuid, _>("key"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<Option<i64>, _>("story_id").is_none());

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_set_editable_document_story_id_as_null_when_unpublishing_the_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Update the document
        let update_result = sqlx::query(
            r#"
UPDATE documents
SET
    key = $1,
    is_editable = TRUE
WHERE story_id = $2
RETURNING key
"#,
        )
        .bind(Uuid::new_v4())
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(update_result.try_get::<Uuid, _>("key").is_ok());

        // Unpublish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Should set `story_id` to `NULL` on the document
        let result = sqlx::query(
            r#"
SELECT story_id FROM documents
WHERE key = $1
"#,
        )
        .bind(update_result.get::<Uuid, _>("key"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<Option<i64>, _>("story_id").is_none());

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn should_not_delete_document_when_the_story_is_soft_deleted(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Document should not be deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
  SELECT 1 FROM documents
  WHERE story_id = $1
)
"#,
        )
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn should_not_delete_document_when_the_story_is_unpublished(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Unpublish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Document should not be deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
  SELECT 1 FROM documents
  WHERE story_id = $1
)
"#,
        )
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("exists"));

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user"))]
    async fn can_set_first_published_at_when_publishing_the_story_for_this_first_time(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = insert_sample_story(&mut conn, false).await?;
        let story_id = result.get::<i64, _>("id");

        // Should be `NULL` initially
        let update_result = sqlx::query(
            r#"
SELECT first_published_at FROM stories
WHERE id = $1
"#,
        )
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            update_result
                .get::<Option<OffsetDateTime>, _>("first_published_at")
                .is_none()
        );

        // Publish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Should update `first_published_at`
        let result = sqlx::query(
            r#"
SELECT first_published_at FROM stories
WHERE id = $1
"#,
        )
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("first_published_at")
                .is_some()
        );

        Ok(())
    }

    // `story_count` counter cache

    #[sqlx::test(fixtures("user"))]
    async fn can_update_story_count_on_user_when_publishing_and_unpublishing_the_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = insert_sample_story(&mut conn, false).await?;
        let story_id = result.get::<i64, _>("id");

        // Should not increment the `story_count` as it is still a draft
        let user_result = sqlx::query(
            r#"
SELECT story_count FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("story_count"), 0);

        // Publish the draft
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Should increment the `story_count`
        let user_result = sqlx::query(
            r#"
SELECT story_count FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("story_count"), 1);

        // Unpublish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Should decrement the `story_count`
        let user_result = sqlx::query(
            r#"
SELECT story_count FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("story_count"), 0);

        // Publish the draft again
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Should increment the `story_count` again
        let user_result = sqlx::query(
            r#"
SELECT story_count FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("story_count"), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_update_story_count_on_user_when_soft_deleting_and_restoring_the_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, false).await?).get::<i64, _>("id");

        // Should not increment the `story_count` as it is still a draft
        let user_result = sqlx::query(
            r#"
SELECT story_count FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("story_count"), 0);

        // Publish the draft
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Should increment the `story_count`
        let user_result = sqlx::query(
            r#"
SELECT story_count FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("story_count"), 1);

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW(), published_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Should decrement the `story_count`
        let user_result = sqlx::query(
            r#"
SELECT story_count FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("story_count"), 0);

        // Restore the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Should not update `story_count` (as the story is not published yet)
        let user_result = sqlx::query(
            r#"
SELECT story_count FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("story_count"), 0);

        // Publish the draft again
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Should increment the `story_count` again
        let user_result = sqlx::query(
            r#"
SELECT story_count FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("story_count"), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_update_story_count_on_user_when_hard_deleting_the_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, false).await?).get::<i64, _>("id");

        // Should not increment the `story_count` as it is still a draft
        let user_result = sqlx::query(
            r#"
SELECT story_count FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("story_count"), 0);

        // Publish the draft
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Should increment the `story_count`
        let user_result = sqlx::query(
            r#"
SELECT story_count FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("story_count"), 1);

        // Delete the story
        sqlx::query(
            r#"
DELETE FROM stories
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Should decrement the `story_count`
        let user_result = sqlx::query(
            r#"
SELECT story_count FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("story_count"), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn should_not_update_story_count_on_user_for_unpublished_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, false).await?).get::<i64, _>("id");

        // Should not increment the `story_count` for a draft
        let user_result = sqlx::query(
            r#"
SELECT story_count FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("story_count"), 0);

        // Soft-delete the draft
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Should not decrement `story_count`
        let user_result = sqlx::query(
            r#"
SELECT story_count FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("story_count"), 0);

        // Restore the draft
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Should not increment the `story_count`
        let user_result = sqlx::query(
            r#"
SELECT story_count FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("story_count"), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn should_not_update_story_count_on_user_when_hard_deleting_a_soft_deleted_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, false).await?).get::<i64, _>("id");

        // Insert one more story so that the `story_count` is always >= 1,
        // which would allow us to bypass the `story_count > 1` constraint
        // on the user when decrementing the `story_count`.
        let second_story_id = (insert_sample_story(&mut conn, false).await?).get::<i64, _>("id");
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(second_story_id)
        .execute(&mut *conn)
        .await?;

        // Should not increment the `story_count` as it is still a draft
        let user_result = sqlx::query(
            r#"
SELECT story_count FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("story_count"), 1);

        // Publish the draft
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Should increment the `story_count`
        let user_result = sqlx::query(
            r#"
SELECT story_count FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("story_count"), 2);

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Should decrement the `story_count`
        let user_result = sqlx::query(
            r#"
SELECT story_count FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("story_count"), 1);

        // Delete the story
        sqlx::query(
            r#"
DELETE FROM stories
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Should not decrement the `story_count` any further
        let user_result = sqlx::query(
            r#"
SELECT story_count FROM users
WHERE id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("story_count"), 1);

        Ok(())
    }

    // Misc

    #[sqlx::test(fixtures("user"))]
    async fn can_reset_view_count_and_read_count_when_soft_deleting_the_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Set initial `view_count` and `read_count`
        let update_result = sqlx::query(
            r#"
UPDATE stories
SET 
    view_count = 10,
    read_count = 10
WHERE id = $1
RETURNING
    view_count,
    read_count
"#,
        )
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(update_result.get::<i64, _>("view_count"), 10);
        assert_eq!(update_result.get::<i32, _>("read_count"), 10);

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Should reset the `view_count` and the `read_count`
        let result = sqlx::query(
            r#"
SELECT
    view_count,
    read_count
FROM stories
WHERE id = $1
"#,
        )
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i64, _>("view_count"), 0);
        assert_eq!(result.get::<i32, _>("read_count"), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_reset_view_count_and_read_count_when_unpublishing_the_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Set initial `view_count` and `read_count`
        let update_result = sqlx::query(
            r#"
UPDATE stories
SET 
    view_count = 10,
    read_count = 10
WHERE id = $1
RETURNING
    view_count,
    read_count
"#,
        )
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(update_result.get::<i64, _>("view_count"), 10);
        assert_eq!(update_result.get::<i32, _>("read_count"), 10);

        // Unpublish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Should reset the `view_count` and the `read_count`
        let result = sqlx::query(
            r#"
SELECT
    view_count,
    read_count
FROM stories
WHERE id = $1
"#,
        )
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i64, _>("view_count"), 0);
        assert_eq!(result.get::<i32, _>("read_count"), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_reset_timestamps_when_soft_deleting_the_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Set initial `edited_at`
        let update_result = sqlx::query(
            r#"
UPDATE stories
SET edited_at = NOW()
WHERE id = $1
RETURNING edited_at
"#,
        )
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            update_result
                .get::<Option<OffsetDateTime>, _>("edited_at")
                .is_some()
        );

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Should reset the `edited_at` timestamp
        let result = sqlx::query(
            r#"
SELECT edited_at FROM stories
WHERE id = $1
"#,
        )
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("edited_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_reset_timestamps_when_unpublishing_the_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, false).await?).get::<i64, _>("id");

        // Publish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Set initial `edited_at`
        let update_result = sqlx::query(
            r#"
UPDATE stories
SET edited_at = NOW()
WHERE id = $1
RETURNING edited_at
"#,
        )
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            update_result
                .get::<Option<OffsetDateTime>, _>("edited_at")
                .is_some()
        );

        // Unpublish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Should reset the `edited_at` timestamp
        let result = sqlx::query(
            r#"
SELECT edited_at FROM stories
WHERE id = $1
"#,
        )
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("edited_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_reset_is_deleted_by_user_when_recovering_the_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Soft-delete the story
        let update_result = sqlx::query(
            r#"
UPDATE stories
SET
    deleted_at = NOW(),
    is_deleted_by_user = TRUE
WHERE id = $1
RETURNING is_deleted_by_user
"#,
        )
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            update_result
                .get::<Option<bool>, _>("is_deleted_by_user")
                .unwrap()
        );

        // Recover the story
        let result = sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should reset the `is_deleted_by_user` flag
        let result = sqlx::query(
            r#"
SELECT is_deleted_by_user FROM stories
WHERE id = $1
"#,
        )
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<bool>, _>("is_deleted_by_user")
                .is_none()
        );

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user"))]
    async fn should_not_restore_comments_from_deleted_users_when_cascading_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a comment
        let insert_result = sqlx::query(
            r#"
INSERT INTO comments (content, user_id, story_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample content".to_string())
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
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
        .bind(1_i64)
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

        // Restore the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Comment should still be soft-deleted
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Comment should get restored
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

    #[sqlx::test(fixtures("user"))]
    async fn should_not_restore_comments_from_deactivated_users_when_cascading_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a comment
        let insert_result = sqlx::query(
            r#"
INSERT INTO comments (content, user_id, story_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample content".to_string())
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
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
        .bind(1_i64)
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

        // Restore the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Comment should still be soft-deleted
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Comment should get restored
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

    #[sqlx::test(fixtures("user"))]
    async fn should_not_restore_comments_from_deleted_users_when_republishing_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a comment
        let insert_result = sqlx::query(
            r#"
INSERT INTO comments (content, user_id, story_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample content".to_string())
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Unpublish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
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
        .bind(1_i64)
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

        // Republish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Comment should still be soft-deleted
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Comment should get restored
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

    #[sqlx::test(fixtures("user"))]
    async fn should_not_restore_comments_from_deactivated_users_when_republishing_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a comment
        let insert_result = sqlx::query(
            r#"
INSERT INTO comments (content, user_id, story_id)
VALUES ($1, $2, $3)
RETURNING id, deleted_at
"#,
        )
        .bind("Sample content".to_string())
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Unpublish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
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
        .bind(1_i64)
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

        // Republish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Comment should still be soft-deleted
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Comment should get restored
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

    //

    #[sqlx::test(fixtures("user", "blog"))]
    async fn should_not_restore_blog_stories_from_deleted_blogs_when_cascading_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Add the story to the blog.
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_stories (blog_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(3_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
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
        .bind(3_i64)
        .bind(story_id)
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
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Blog story should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM blog_stories
WHERE blog_id = $1 AND story_id = $2
"#,
        )
        .bind(3_i64)
        .bind(story_id)
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
        .bind(3_i64)
        .bind(story_id)
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
    async fn should_not_restore_story_contributors_from_deleted_users_when_cascading_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Contribute to the story
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(4_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
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
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        // Story contributor should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_contributors
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(4_i64)
        .bind(story_id)
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
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Story contributor should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_contributors
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(4_i64)
        .bind(story_id)
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
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        // Story contributor should get restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_contributors
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(4_i64)
        .bind(story_id)
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
    async fn should_not_restore_story_contributors_from_deactivated_users_when_cascading_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Contribute to the story
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(4_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
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
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        // Story contributor should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_contributors
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(4_i64)
        .bind(story_id)
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
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Story contributor should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_contributors
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(4_i64)
        .bind(story_id)
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
        .bind(4_i64)
        .execute(&mut *conn)
        .await?;

        // Story contributor should get restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_contributors
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(4_i64)
        .bind(story_id)
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
    async fn should_not_restore_story_likes_from_deleted_users_when_cascading_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Like the story
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Story like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Story like should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Story like should get restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
    async fn should_not_restore_story_likes_from_deactivated_users_when_cascading_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Like the story
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Story like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Story like should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Story like should get restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
    async fn should_not_restore_story_likes_from_deleted_users_when_republishing_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Like the story
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Unpublish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Story like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Republish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Story like should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Story like should get restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
    async fn should_not_restore_story_likes_from_deactivated_users_when_republishing_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Like the story
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Unpublish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Story like should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Republish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Story like should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Story like should get restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM story_likes
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
    async fn should_not_restore_bookmarks_from_deleted_users_when_cascading_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a bookmark
        let insert_result = sqlx::query(
            r#"
INSERT INTO bookmarks (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Bookmark should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM bookmarks
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Bookmark should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM bookmarks
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Bookmark should get restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM bookmarks
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
    async fn should_not_restore_bookmarks_from_deactivated_users_when_cascading_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a bookmark
        let insert_result = sqlx::query(
            r#"
INSERT INTO bookmarks (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Bookmark should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM bookmarks
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Bookmark should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM bookmarks
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Bookmark should get restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM bookmarks
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
    async fn should_not_restore_bookmarks_from_deleted_users_when_republishing_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a bookmark
        let insert_result = sqlx::query(
            r#"
INSERT INTO bookmarks (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Unpublish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Bookmark should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM bookmarks
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Republish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Bookmark should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM bookmarks
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Bookmark should get restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM bookmarks
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
    async fn should_not_restore_bookmarks_from_deactivated_users_when_republishing_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a bookmark
        let insert_result = sqlx::query(
            r#"
INSERT INTO bookmarks (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Unpublish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Bookmark should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM bookmarks
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Republish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Bookmark should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM bookmarks
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // Bookmark should get restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM bookmarks
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
    async fn should_not_restore_histories_from_deleted_users_when_cascading_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a history
        let insert_result = sqlx::query(
            r#"
INSERT INTO histories (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // History should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM histories
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // History should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM histories
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // History should get restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM histories
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
    async fn should_not_restore_histories_from_deactivated_users_when_cascading_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a history
        let insert_result = sqlx::query(
            r#"
INSERT INTO histories (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // History should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM histories
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // History should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM histories
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // History should get restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM histories
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
    async fn should_not_restore_histories_from_deleted_users_when_republishing_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a history
        let insert_result = sqlx::query(
            r#"
INSERT INTO histories (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Unpublish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // History should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM histories
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Republish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // History should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM histories
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // History should get restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM histories
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
    async fn should_not_restore_histories_from_deactivated_users_when_republishing_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a history
        let insert_result = sqlx::query(
            r#"
INSERT INTO histories (user_id, story_id)
VALUES ($1, $2)
RETURNING deleted_at
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none()
        );

        // Unpublish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(story_id)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // History should be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM histories
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_some()
        );

        // Republish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // History should still be soft-deleted
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM histories
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        // History should get restored
        let result = sqlx::query(
            r#"
SELECT deleted_at FROM histories
WHERE user_id = $1 AND story_id = $2
"#,
        )
        .bind(1_i64)
        .bind(story_id)
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
    async fn can_set_document_story_id_as_null_on_story_hard_delete(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Update the document
        let update_result = sqlx::query(
            r#"
UPDATE documents
SET key = $1
WHERE story_id = $2
RETURNING key
"#,
        )
        .bind(Uuid::new_v4())
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(update_result.try_get::<Uuid, _>("key").is_ok());

        // Delete the story
        sqlx::query(
            r#"
DELETE FROM stories
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Should set `story_id` to `NULL` on the document
        let result = sqlx::query(
            r#"
SELECT story_id FROM documents
WHERE key = $1
"#,
        )
        .bind(update_result.get::<Uuid, _>("key"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<Option<i64>, _>("story_id").is_none());

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_set_story_splash_id_as_null_on_asset_hard_delete(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

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

        // Set `splash_id` and `splash_hex` on the story
        let update_result = sqlx::query(
            r#"
WITH asset AS (
    SELECT key, hex FROM assets
    WHERE id = $1
)
UPDATE stories
SET
    splash_id = (SELECT key FROM asset),
    splash_hex = (SELECT hex FROM asset)
WHERE id = $2
RETURNING splash_id, splash_hex
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(update_result.get::<Option<Uuid>, _>("splash_id").is_some());
        assert!(
            update_result
                .get::<Option<String>, _>("splash_hex")
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

        // `splash_id` and `splash_hex` should be NULL
        let update_result = sqlx::query(
            r#"
SELECT
    splash_id,
    splash_hex
FROM stories
WHERE id = $1
"#,
        )
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(update_result.get::<Option<Uuid>, _>("splash_id").is_none());
        assert!(
            update_result
                .get::<Option<String>, _>("splash_hex")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_set_preview_image_as_null_on_asset_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

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

        // Set `preview_image` on the story
        let update_result = sqlx::query(
            r#"
WITH asset AS (
    SELECT key FROM assets
    WHERE id = $1
)
UPDATE stories
SET
    preview_image = (SELECT key FROM asset)
WHERE id = $2
RETURNING preview_image
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .bind(story_id)
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
FROM stories
WHERE id = $1
"#,
        )
        .bind(story_id)
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
    async fn can_delete_comment_on_story_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a comment
        let insert_result = sqlx::query(
            r#"
INSERT INTO comments (content, user_id, story_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind("Sample content".to_string())
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Delete the story
        sqlx::query(
            r#"
DELETE FROM stories
WHERE id = $1
"#,
        )
        .bind(story_id)
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

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_delete_blog_story_on_story_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Add the story to the blog.
        let insert_result = sqlx::query(
            r#"
INSERT INTO blog_stories (blog_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(3_i64)
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the story
        sqlx::query(
            r#"
DELETE FROM stories
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Blog story should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM blog_stories
    WHERE blog_id = $1 AND story_id = $2
)
"#,
        )
        .bind(3_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_story_contributor_on_story_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Contribute to the story
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_contributors (user_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(4_i64)
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the story
        sqlx::query(
            r#"
DELETE FROM stories
WHERE id = $1
"#,
        )
        .bind(story_id)
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
        .bind(4_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_story_like_on_story_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Like the story
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_likes (user_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the story
        sqlx::query(
            r#"
DELETE FROM stories
WHERE id = $1
"#,
        )
        .bind(story_id)
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
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user", "tag"))]
    async fn can_delete_story_tag_on_story_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a story tag
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_tags (tag_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the story
        sqlx::query(
            r#"
DELETE FROM stories
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Story tag should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM story_tags
    WHERE tag_id = $1 AND story_id = $2
)
"#,
        )
        .bind(2_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_draft_tag_on_story_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, false).await?).get::<i64, _>("id");

        // Insert a draft tag
        let insert_result = sqlx::query(
            r#"
INSERT INTO draft_tags(name, story_id)
VALUES ($1, $2)
"#,
        )
        .bind("one")
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the story
        sqlx::query(
            r#"
DELETE FROM stories
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Draft tag should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM draft_tags
    WHERE name = $1
)
"#,
        )
        .bind("one")
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_notification_on_story_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a notification
        let insert_result = sqlx::query(
            r#"
INSERT INTO notifications (entity_id, entity_type, notifier_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind(story_id)
        .bind(0)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Delete the story
        sqlx::query(
            r#"
DELETE FROM stories
WHERE id = $1
"#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Notification should get deleted
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM notifications
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
    async fn can_delete_bookmark_on_story_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a bookmark
        let insert_result = sqlx::query(
            r#"
INSERT INTO bookmarks (user_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the story
        sqlx::query(
            r#"
DELETE FROM stories
WHERE id = $1
"#,
        )
        .bind(story_id)
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
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_history_on_story_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a history
        let insert_result = sqlx::query(
            r#"
INSERT INTO histories (user_id, story_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Delete the story
        sqlx::query(
            r#"
DELETE FROM stories
WHERE id = $1
"#,
        )
        .bind(story_id)
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
        .bind(1_i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }
}
