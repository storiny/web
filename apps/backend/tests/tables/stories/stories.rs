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
    ///
    /// * `is_published` - Whether to return a published story.
    fn get_default_story(is_published: bool) -> Story {
        Story {
            id: 0,
            title: "Some story".to_string(),
            slug: None,
            description: None,
            splash_id: None,
            splash_hex: None,
            category: StoryCategory::Others,
            license: StoryLicense::Reserved,
            visibility: StoryVisibility::Public,
            age_restriction: StoryAgeRestriction::NotRated,
            user_id: 1i64,
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
            published_at: if is_published {
                Some(OffsetDateTime::now_utc())
            } else {
                None
            },
            edited_at: None,
            deleted_at: None,
        }
    }

    /// Inserts a sample story into the database.
    ///
    /// * `conn` - Pool connection.
    /// * `is_published` - Whether to insert a published story.
    async fn insert_sample_story(
        conn: &mut PoolConnection<Postgres>,
        is_published: bool,
    ) -> Result<PgRow, Error> {
        let story = get_default_story(is_published);
        sqlx::query(
            r#"
            INSERT INTO stories (title, slug, description, splash_id, splash_hex, category, visibility, age_restriction, license, user_id, seo_title, seo_description, canonical_url, preview_image, word_count, read_count, like_count, comment_count, disable_public_revision_history, disable_comments, disable_toc, created_at, first_published_at, published_at, edited_at, deleted_at)
            VALUES ($1, $2, $3, $4, $5, $6::story_category, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
            RETURNING id
            "#,
        )
            .bind(&story.title)
            .bind(&story.slug)
            .bind(&story.description)
            .bind(&story.splash_id)
            .bind(&story.splash_hex)
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

    #[sqlx::test(fixtures("user"))]
    async fn can_insert_a_valid_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = insert_sample_story(&mut conn, false).await?;
        assert!(result.try_get::<i64, _>("id").is_ok());
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
            INSERT INTO comments(content, user_id, story_id)
            VALUES ($1, $2, $3)
            RETURNING id, deleted_at
            "#,
        )
        .bind("Sample content".to_string())
        .bind(1i64)
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
            SET deleted_at = now()
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
            INSERT INTO comments(content, user_id, story_id)
            VALUES ($1, $2, $3)
            RETURNING id, deleted_at
            "#,
        )
        .bind("Sample content".to_string())
        .bind(1i64)
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
            SET published_at = now()
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

    // Story likes

    #[sqlx::test(fixtures("user"))]
    async fn can_cascade_story_soft_delete_to_story_likes(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Like the story
        let insert_result = sqlx::query(
            r#"
            INSERT INTO story_likes(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deleted_at = now()
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
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO story_likes(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
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
            SET published_at = now()
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
        .bind(1i64)
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

    // Story tags

    #[sqlx::test(fixtures("user", "tag"))]
    async fn can_cascade_story_soft_delete_to_story_tags(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a story tag
        let insert_result = sqlx::query(
            r#"
            INSERT INTO story_tags(tag_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(2i64)
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Story tag should be soft-deleted
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM story_tags
            WHERE tag_id = $1 AND story_id = $2
            "#,
        )
        .bind(2i64)
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

        // Story tag should be restored
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM story_tags
            WHERE tag_id = $1 AND story_id = $2
            "#,
        )
        .bind(2i64)
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

    #[sqlx::test(fixtures("user", "tag"))]
    async fn can_soft_delete_story_tags_when_the_story_is_unpublished(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a story tag
        let insert_result = sqlx::query(
            r#"
            INSERT INTO story_tags(tag_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(2i64)
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

        // Story tag should be soft-deleted
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM story_tags
            WHERE tag_id = $1 AND story_id = $2
            "#,
        )
        .bind(2i64)
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
            SET published_at = now()
            WHERE id = $1
            "#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Story tag should be restored
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM story_tags
            WHERE tag_id = $1 AND story_id = $2
            "#,
        )
        .bind(2i64)
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

    // Bookmarks

    #[sqlx::test(fixtures("user"))]
    async fn can_cascade_story_soft_delete_to_bookmarks(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a bookmark
        let insert_result = sqlx::query(
            r#"
            INSERT INTO bookmarks(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deleted_at = now()
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
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO bookmarks(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
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
            SET published_at = now()
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
        .bind(1i64)
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
            INSERT INTO histories(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deleted_at = now()
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
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO histories(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
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
            SET published_at = now()
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
        .bind(1i64)
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
            INSERT INTO notifications(entity_id, entity_type, notifier_id)
            VALUES ($1, $2, $3)
            RETURNING id
            "#,
        )
        .bind(story_id)
        .bind(0)
        .bind(1i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Soft-delete the story
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

        // Notification should be deleted
        let result = sqlx::query(
            r#"
            SELECT EXISTS(
              SELECT 1 FROM notifications
              WHERE entity_id = $1
            )
            "#,
        )
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

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
            INSERT INTO notifications(entity_id, entity_type, notifier_id)
            VALUES ($1, $2, $3)
            RETURNING id
            "#,
        )
        .bind(story_id)
        .bind(0)
        .bind(1i64)
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
            SELECT EXISTS(
              SELECT 1 FROM notifications
              WHERE entity_id = $1
            )
            "#,
        )
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user"))]
    async fn should_not_delete_document_when_the_story_is_soft_deleted(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a document
        let insert_result = sqlx::query(
            r#"
            INSERT INTO documents(key, story_id)
            VALUES ($1, $2)
            "#,
        )
        .bind("sample".to_string())
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Soft-delete the story
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

        // Document should not be deleted
        let result = sqlx::query(
            r#"
            SELECT EXISTS(
              SELECT 1 FROM documents
              WHERE story_id = $1
            )
            "#,
        )
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), true);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn should_not_delete_document_when_the_story_is_unpublished(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a document
        let insert_result = sqlx::query(
            r#"
            INSERT INTO documents(key, story_id)
            VALUES ($1, $2)
            "#,
        )
        .bind("sample".to_string())
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

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
            SELECT EXISTS(
              SELECT 1 FROM documents
              WHERE story_id = $1
            )
            "#,
        )
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), true);

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
            SET published_at = now()
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
        .bind(1i64)
        .fetch_one(&mut *conn)
        .await?;

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

        // Should increment the `story_count`
        let user_result = sqlx::query(
            r#"
            SELECT story_count FROM users
            WHERE id = $1
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
        .fetch_one(&mut *conn)
        .await?;

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

        // Should increment the `story_count` again
        let user_result = sqlx::query(
            r#"
            SELECT story_count FROM users
            WHERE id = $1
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
        .fetch_one(&mut *conn)
        .await?;

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

        // Should increment the `story_count`
        let user_result = sqlx::query(
            r#"
            SELECT story_count FROM users
            WHERE id = $1
            "#,
        )
        .bind(1i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("story_count"), 1);

        // Soft-delete the story
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

        // Should decrement the `story_count`
        let user_result = sqlx::query(
            r#"
            SELECT story_count FROM users
            WHERE id = $1
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
        .fetch_one(&mut *conn)
        .await?;

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

        // Should increment the `story_count` again
        let user_result = sqlx::query(
            r#"
            SELECT story_count FROM users
            WHERE id = $1
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
        .fetch_one(&mut *conn)
        .await?;

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

        // Should increment the `story_count`
        let user_result = sqlx::query(
            r#"
            SELECT story_count FROM users
            WHERE id = $1
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("story_count"), 0);

        // Soft-delete the draft
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

        // Should not decrement `story_count`
        let user_result = sqlx::query(
            r#"
            SELECT story_count FROM users
            WHERE id = $1
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
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
            SET published_at = now()
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
        .bind(1i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("story_count"), 1);

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

        // Should increment the `story_count`
        let user_result = sqlx::query(
            r#"
            SELECT story_count FROM users
            WHERE id = $1
            "#,
        )
        .bind(1i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("story_count"), 2);

        // Soft-delete the story
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

        // Should decrement the `story_count`
        let user_result = sqlx::query(
            r#"
            SELECT story_count FROM users
            WHERE id = $1
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(user_result.get::<i32, _>("story_count"), 1);

        Ok(())
    }

    // Misc

    #[sqlx::test(fixtures("user"))]
    async fn can_reset_read_count_when_soft_deleting_the_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Set initial `read_count`
        let update_result = sqlx::query(
            r#"
            UPDATE stories
            SET read_count = 10
            WHERE id = $1
            RETURNING read_count
            "#,
        )
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(update_result.get::<i64, _>("read_count"), 10);

        // Soft-delete the story
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

        // Should reset the `read_count`
        let result = sqlx::query(
            r#"
            SELECT read_count FROM stories
            WHERE id = $1
            "#,
        )
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i64, _>("read_count"), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_reset_read_count_when_unpublishing_the_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Set initial `read_count`
        let update_result = sqlx::query(
            r#"
            UPDATE stories
            SET read_count = 10
            WHERE id = $1
            RETURNING read_count
            "#,
        )
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(update_result.get::<i64, _>("read_count"), 10);

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

        // Should reset the `read_count`
        let result = sqlx::query(
            r#"
            SELECT read_count FROM stories
            WHERE id = $1
            "#,
        )
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i64, _>("read_count"), 0);

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
            SET edited_at = now()
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(story_id)
        .execute(&mut *conn)
        .await?;

        // Should reset the `published_at`, `edited_at`, and `first_published_at` timestamps
        let result = sqlx::query(
            r#"
            SELECT published_at, edited_at, first_published_at FROM stories
            WHERE id = $1
            "#,
        )
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("published_at")
                .is_none()
        );
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("edited_at")
                .is_none()
        );
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("first_published_at")
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
            SET published_at = now()
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
            SET edited_at = now()
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

        // Should reset the `edited_at` timestamp and skip the `first_published_at` timestamp
        let result = sqlx::query(
            r#"
            SELECT edited_at, first_published_at FROM stories
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
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("first_published_at")
                .is_some()
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
            INSERT INTO comments(content, user_id, story_id)
            VALUES ($1, $2, $3)
            RETURNING id, deleted_at
            "#,
        )
        .bind("Sample content".to_string())
        .bind(1i64)
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
            SET deleted_at = now()
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO comments(content, user_id, story_id)
            VALUES ($1, $2, $3)
            RETURNING id, deleted_at
            "#,
        )
        .bind("Sample content".to_string())
        .bind(1i64)
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
            SET deleted_at = now()
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
            SET deactivated_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO comments(content, user_id, story_id)
            VALUES ($1, $2, $3)
            RETURNING id, deleted_at
            "#,
        )
        .bind("Sample content".to_string())
        .bind(1i64)
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
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
            SET published_at = now()
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
        .bind(1i64)
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
            INSERT INTO comments(content, user_id, story_id)
            VALUES ($1, $2, $3)
            RETURNING id, deleted_at
            "#,
        )
        .bind("Sample content".to_string())
        .bind(1i64)
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
            SET deactivated_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
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
            SET published_at = now()
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
        .bind(1i64)
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

    #[sqlx::test(fixtures("user"))]
    async fn should_not_restore_story_likes_from_deleted_users_when_cascading_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Like the story
        let insert_result = sqlx::query(
            r#"
            INSERT INTO story_likes(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deleted_at = now()
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Story like should be soft-deleted
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM story_likes
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Story like should get restored
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM story_likes
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
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
            INSERT INTO story_likes(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deleted_at = now()
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
            SET deactivated_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Story like should be soft-deleted
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM story_likes
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Story like should get restored
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM story_likes
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
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
            INSERT INTO story_likes(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Story like should be soft-deleted
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM story_likes
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
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
            SET published_at = now()
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
        .bind(1i64)
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
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Story like should get restored
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM story_likes
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
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
            INSERT INTO story_likes(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deactivated_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Story like should be soft-deleted
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM story_likes
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
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
            SET published_at = now()
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
        .bind(1i64)
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
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Story like should get restored
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM story_likes
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
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
            INSERT INTO bookmarks(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deleted_at = now()
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Bookmark should be soft-deleted
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM bookmarks
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Bookmark should get restored
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM bookmarks
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
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
            INSERT INTO bookmarks(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deleted_at = now()
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
            SET deactivated_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Bookmark should be soft-deleted
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM bookmarks
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Bookmark should get restored
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM bookmarks
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
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
            INSERT INTO bookmarks(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Bookmark should be soft-deleted
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM bookmarks
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
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
            SET published_at = now()
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
        .bind(1i64)
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
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Bookmark should get restored
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM bookmarks
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
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
            INSERT INTO bookmarks(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deactivated_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Bookmark should be soft-deleted
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM bookmarks
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
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
            SET published_at = now()
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
        .bind(1i64)
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
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Bookmark should get restored
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM bookmarks
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
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
            INSERT INTO histories(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deleted_at = now()
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // History should be soft-deleted
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM histories
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // History should get restored
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM histories
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
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
            INSERT INTO histories(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deleted_at = now()
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
            SET deactivated_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // History should be soft-deleted
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM histories
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // History should get restored
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM histories
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
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
            INSERT INTO histories(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // History should be soft-deleted
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM histories
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
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
            SET published_at = now()
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
        .bind(1i64)
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
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // History should get restored
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM histories
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
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
            INSERT INTO histories(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deactivated_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // History should be soft-deleted
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM histories
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
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
            SET published_at = now()
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
        .bind(1i64)
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
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // History should get restored
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM histories
            WHERE user_id = $1 AND story_id = $2
            "#,
        )
        .bind(1i64)
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

        // Insert a document
        let insert_result = sqlx::query(
            r#"
            INSERT INTO documents(key, story_id)
            VALUES ($1, $2)
            RETURNING key
            "#,
        )
        .bind("sample".to_string())
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<String, _>("key").is_ok());

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
        .bind(insert_result.get::<String, _>("key"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<Option<i64>, _>("story_id").is_none());

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_comment_on_story_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a comment
        let insert_result = sqlx::query(
            r#"
            INSERT INTO comments(content, user_id, story_id)
            VALUES ($1, $2, $3)
            RETURNING id
            "#,
        )
        .bind("Sample content".to_string())
        .bind(1i64)
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
            SELECT EXISTS(
                SELECT 1 FROM comments
                WHERE id = $1
            )
            "#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_story_like_on_story_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Like the story
        let insert_result = sqlx::query(
            r#"
            INSERT INTO story_likes(user_id, story_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(1i64)
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
            SELECT EXISTS(
                SELECT 1 FROM story_likes
                WHERE user_id = $1 AND story_id = $2
            )
            "#,
        )
        .bind(1i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "tag"))]
    async fn can_delete_story_tag_on_story_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a story tag
        let insert_result = sqlx::query(
            r#"
            INSERT INTO story_tags(tag_id, story_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(2i64)
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
            SELECT EXISTS(
                SELECT 1 FROM story_tags
                WHERE tag_id = $1 AND story_id = $2
            )
            "#,
        )
        .bind(2i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_notification_on_story_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a notification
        let insert_result = sqlx::query(
            r#"
            INSERT INTO notifications(entity_id, entity_type, notifier_id)
            VALUES ($1, $2, $3)
            RETURNING id
            "#,
        )
        .bind(story_id)
        .bind(0)
        .bind(1i64)
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
            SELECT EXISTS(
                SELECT 1 FROM notifications
                WHERE id = $1
            )
            "#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_bookmark_on_story_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a bookmark
        let insert_result = sqlx::query(
            r#"
            INSERT INTO bookmarks(user_id, story_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(1i64)
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
            SELECT EXISTS(
                SELECT 1 FROM bookmarks
                WHERE user_id = $1 AND story_id = $2
            )
            "#,
        )
        .bind(1i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_history_on_story_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story_id = (insert_sample_story(&mut conn, true).await?).get::<i64, _>("id");

        // Insert a history
        let insert_result = sqlx::query(
            r#"
            INSERT INTO histories(user_id, story_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(1i64)
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
            SELECT EXISTS(
                SELECT 1 FROM histories
                WHERE user_id = $1 AND story_id = $2
            )
            "#,
        )
        .bind(1i64)
        .bind(story_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

        Ok(())
    }
}
