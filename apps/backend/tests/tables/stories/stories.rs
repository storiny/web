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
    use storiny::{
        models::story::{
            Story,
            StoryCategory,
        },
        story_def::v1::{
            StoryAgeRestriction,
            StoryLicense,
            StoryVisibility,
        },
    };
    use time::OffsetDateTime;

    /// Returns a sample story
    fn get_default_story() -> Story {
        Story {
            id: 0,
            title: "Some story".to_string(),
            slug: None,
            description: None,
            splash_id: None,
            splash_hex: None,
            doc_key: "some_key".to_string(),
            category: StoryCategory::Others,
            license: StoryLicense::Reserved,
            visibility: StoryVisibility::Public,
            age_restriction: StoryAgeRestriction::NotRated,
            user_id: 0,
            seo_title: None,
            seo_description: None,
            canonical_url: None,
            preview_image: None,
            word_count: 0,
            read_count: 0,
            like_count: 0,
            comment_count: 0,
            disable_public_revision_history: false,
            disable_comments: false,
            disable_toc: false,
            created_at: OffsetDateTime::now_utc(),
            first_published_at: None,
            published_at: None,
            edited_at: None,
            deleted_at: None,
        }
    }

    /// Inserts a sample story into the database.
    ///
    /// * `conn` - Pool connection.
    async fn insert_sample_story(conn: &mut PoolConnection<Postgres>) -> Result<PgRow, Error> {
        let story = get_default_story();
        sqlx::query(
            r#"
INSERT INTO stories (title, slug, description, splash_id, splash_hex, doc_key, category, visibility, age_restriction, license, user_id, seo_title, seo_description, canonical_url, preview_image, word_count, read_count, like_count, comment_count, disable_public_revision_history, disable_comments, disable_toc, created_at, first_published_at, published_at, edited_at, deleted_at)
VALUES ($1, $2, $3, $4, $5, $6, $7::story_category, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
RETURNING id
               "#,
        )
            .bind(&story.title)
            .bind(&story.slug)
            .bind(&story.description)
            .bind(&story.splash_id)
            .bind(&story.splash_hex)
            .bind(&story.doc_key)
            .bind(&story.category.to_string())
            .bind(&(story.visibility as i16))
            .bind(&(story.age_restriction as i16))
            .bind(&(story.license as i16))
            .bind(&story.user_id)
            .bind(&story.seo_title)
            .bind(&story.seo_description)
            .bind(&story.canonical_url)
            .bind(&story.preview_image)
            .bind(&story.word_count)
            .bind(&story.read_count)
            .bind(&story.like_count)
            .bind(&story.comment_count)
            .bind(&story.disable_public_revision_history)
            .bind(&story.disable_comments)
            .bind(&story.disable_toc)
            .bind(&story.created_at)
            .bind(&story.first_published_at)
            .bind(&story.published_at)
            .bind(&story.edited_at)
            .bind(&story.deleted_at)
            .fetch_one(&mut **conn)
            .await
    }

    /// Returns the writer of the sample story.
    ///
    /// * `conn` - Pool connection.
    async fn get_story_writer(conn: &mut PoolConnection<Postgres>) -> Result<PgRow, Error> {
        sqlx::query(
            r#"
SELECT * FROM users
WHERE id = 0
                "#,
        )
        .fetch_one(&mut **conn)
        .await
    }

    #[sqlx::test(fixtures("stories"))]
    async fn can_insert_a_valid_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = insert_sample_story(&mut conn).await?;
        assert!(result.try_get::<i64, _>("id").is_ok());
        Ok(())
    }

    #[sqlx::test(fixtures("stories"))]
    async fn can_delete_story_when_the_user_is_deleted(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = insert_sample_story(&mut conn).await?;
        let story_id = result.get::<i64, _>("id");

        // Delete the user
        sqlx::query(
            r#"
DELETE FROM users
WHERE id = 0
                "#,
        )
        .execute(&mut *conn)
        .await?;

        let story_result = sqlx::query(
            r#"
SELECT * FROM stories
WHERE id = $1
                "#,
        )
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await;

        assert!(story_result.is_err());
        Ok(())
    }

    #[sqlx::test(fixtures("stories"))]
    async fn can_update_story_count_counter_cache(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = insert_sample_story(&mut conn).await?;
        let story_id = result.get::<i64, _>("id");

        // Should not increment story count as it is still a draft
        let user_result = get_story_writer(&mut conn).await?;
        assert_eq!(user_result.get::<i32, _>("story_count"), 0);

        // Publish the draft
        sqlx::query(
            r#"
UPDATE stories
SET published_at = now()
WHERE id = $1
                "#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        let user_result = get_story_writer(&mut conn).await?;
        assert_eq!(user_result.get::<i32, _>("story_count"), 1);

        // Unpublish the draft
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

        let user_result = get_story_writer(&mut conn).await?;
        assert_eq!(user_result.get::<i32, _>("story_count"), 0);

        // Publish the draft again
        sqlx::query(
            r#"
UPDATE stories
SET published_at = now()
WHERE id = $1
                "#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        let user_result = get_story_writer(&mut conn).await?;
        assert_eq!(user_result.get::<i32, _>("story_count"), 1);

        // Soft delete the draft
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = now()
WHERE id = $1
                "#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        let user_result = get_story_writer(&mut conn).await?;
        assert_eq!(user_result.get::<i32, _>("story_count"), 0);

        // Recover the draft
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

        let user_result = get_story_writer(&mut conn).await?;
        assert_eq!(user_result.get::<i32, _>("story_count"), 1);

        // Publish a soft-deleted draft
        sqlx::query(
            r#"
UPDATE stories
SET
    deleted_at = now(),
    published_at = now()
WHERE id = $1
                "#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        let user_result = get_story_writer(&mut conn).await?;
        assert_eq!(user_result.get::<i32, _>("story_count"), 1);

        Ok(())
    }
}
