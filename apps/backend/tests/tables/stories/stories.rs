#[cfg(test)]
mod tests {
    use sqlx::PgPool;
    use storiny::{
        models::story::{
            Story,
            StoryCategory,
        },
        proto::story_def_v1::{
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

    #[sqlx::test(fixtures("stories"))]
    async fn can_insert_a_valid_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let story = get_default_story();
        let result = sqlx::query(
            r#"
INSERT INTO stories (title, slug, description, splash_id, splash_hex, doc_key, category, visibility, age_restriction, license, user_id, seo_title, seo_description, canonical_url, preview_image, word_count, read_count, like_count, comment_count, disable_public_revision_history, disable_comments, disable_toc, created_at, first_published_at, published_at, edited_at, deleted_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
               "#,
        )
            .bind(&story.title)
            .bind(&story.slug)
            .bind(&story.description)
            .bind(&story.splash_id)
            .bind(&story.splash_hex)
            .bind(&story.doc_key)
            .bind(&story.category)
            .bind(&story.visibility)
            .bind(&story.age_restriction)
            .bind(&story.license)
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
            .execute(&mut *conn)
            .await?;

        assert_eq!(result.rows_affected(), 1);
        Ok(())
    }
    //
    //     #[sqlx::test]
    //     async fn can_handle_valid_tag_names(pool: PgPool) -> sqlx::Result<()> {
    //         let mut conn = pool.acquire().await?;
    //         let tag = get_default_tag();
    //         let cases: Vec<&str> = vec!["abcd", "ab-cd", "0abcd", "ab0cd", "abcd0"];
    //
    //         for case in cases {
    //             let result = sqlx::query(
    //                 r#"
    // INSERT INTO tags (name, follower_count, story_count, created_at)
    // VALUES            ($1, $2, $3, $4);
    //                "#,
    //             )
    //             .bind(case.to_string())
    //             .bind(&tag.follower_count)
    //             .bind(&tag.story_count)
    //             .bind(&tag.created_at)
    //             .execute(&mut *conn)
    //             .await?;
    //
    //             assert_eq!(result.rows_affected(), 1);
    //         }
    //
    //         Ok(())
    //     }
    //
    //     #[sqlx::test]
    //     async fn can_reject_invalid_tag_names(pool: PgPool) -> sqlx::Result<()> {
    //         let mut conn = pool.acquire().await?;
    //         let tag = get_default_tag();
    //         let cases: Vec<&str> = vec!["", "ABCD", "a@", "abcd#", "abcD", "ab_cd"];
    //
    //         for case in cases {
    //             let result = sqlx::query(
    //                 r#"
    // INSERT INTO tags (name, follower_count, story_count, created_at)
    // VALUES            ($1, $2, $3, $4);
    //                "#,
    //             )
    //             .bind(case.to_string())
    //             .bind(tag.follower_count)
    //             .bind(tag.story_count)
    //             .bind(tag.created_at)
    //             .execute(&mut *conn)
    //             .await;
    //
    //             assert!(matches!(result.unwrap_err(), sqlx::Error::Database(_)));
    //         }
    //
    //         Ok(())
    //     }
}
