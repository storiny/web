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
    use storiny::models::user::User;
    use time::OffsetDateTime;

    /// Returns a sample user
    fn get_default_user() -> User {
        User {
            id: 0,
            name: "Red sand".to_string(),
            username: "martian".to_string(),
            avatar_id: None,
            avatar_hex: None,
            banner_id: None,
            banner_hex: None,
            bio: "**hello**".to_string(),
            rendered_bio: "<b>hello</b>".to_string(),
            location: "Mars".to_string(),
            email: "someone@example.com".to_string(),
            email_verified: false,
            password: None,
            is_private: false,
            public_flags: 0,
            wpm: 225,
            follower_count: 0,
            following_count: 0,
            friend_count: 0,
            story_count: 0,
            login_apple_id: None,
            login_google_id: None,
            mfa_enabled: false,
            mfa_secret: None,
            created_at: OffsetDateTime::now_utc(),
            username_modified_at: None,
            deleted_at: None,
        }
    }

    /// Inserts a sample user into the database.
    ///
    /// * `conn` - Pool connection.
    async fn insert_sample_user(conn: &mut PoolConnection<Postgres>) -> Result<PgRow, Error> {
        let user = get_default_user();
        sqlx::query(
            r#"
INSERT INTO users (name, username, email, email_verified, password, bio, rendered_bio, location, wpm, avatar_id, avatar_hex, banner_id, banner_hex, is_private, public_flags, follower_count, following_count, friend_count, story_count, login_apple_id, login_google_id, mfa_enabled, mfa_secret, created_at, username_modified_at, deleted_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
RETURNING id
               "#,
        )
            .bind(user.name)
            .bind(user.username)
            .bind(user.email)
            .bind(user.email_verified)
            .bind(user.password)
            .bind(user.bio)
            .bind(user.rendered_bio)
            .bind(user.location)
            .bind(user.wpm)
            .bind(user.avatar_id)
            .bind(user.avatar_hex)
            .bind(user.banner_id)
            .bind(user.banner_hex)
            .bind(user.is_private)
            .bind(user.public_flags)
            .bind(user.follower_count)
            .bind(user.following_count)
            .bind(user.friend_count)
            .bind(user.story_count)
            .bind(user.login_apple_id)
            .bind(user.login_google_id)
            .bind(user.mfa_enabled)
            .bind(user.mfa_secret)
            .bind(user.created_at)
            .bind(user.username_modified_at)
            .bind(&user.deleted_at)
            .fetch_one( &mut **conn)
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
        let user = get_default_user();
        let cases: Vec<&str> = vec!["abcd", "ab_cd", "0abcd", "ab0cd", "abcd0"];

        for case in cases {
            let mut email = user.email.clone();
            email.push_str(case);

            let result = sqlx::query(
                r#"
INSERT INTO users (name, username, email, email_verified, password, bio, rendered_bio, location, wpm, avatar_id, avatar_hex, banner_id, banner_hex, is_private, public_flags, follower_count, following_count, friend_count, story_count, login_apple_id, login_google_id, mfa_enabled, mfa_secret, created_at, username_modified_at, deleted_at)
VALUES            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26);
               "#)
                .bind(&user.name)
                .bind(case.to_string())
                .bind(email)
                .bind(&user.email_verified)
                .bind(&user.password)
                .bind(&user.bio)
                .bind(&user.rendered_bio)
                .bind(&user.location)
                .bind(&user.wpm)
                .bind(&user.avatar_id)
                .bind(&user.avatar_hex)
                .bind(&user.banner_id)
                .bind(&user.banner_hex)
                .bind(&user.is_private)
                .bind(&user.public_flags)
                .bind(&user.follower_count)
                .bind(&user.following_count)
                .bind(&user.friend_count)
                .bind(&user.story_count)
                .bind(&user.login_apple_id)
                .bind(&user.login_google_id)
                .bind(&user.mfa_enabled)
                .bind(&user.mfa_secret)
                .bind(&user.created_at)
                .bind(&user.username_modified_at)
                .bind(&user.deleted_at)
                .execute(&mut *conn)
                .await?;

            assert_eq!(result.rows_affected(), 1);
        }

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_invalid_usernames(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user = get_default_user();
        let cases: Vec<&str> = vec!["", "ABCD", "a", "abcd#", "abcD"];

        for case in cases {
            let result = sqlx::query(
                r#"
INSERT INTO users (name, username, email, email_verified, password, bio, rendered_bio, location, wpm, avatar_id, avatar_hex, banner_id, banner_hex, is_private, public_flags, follower_count, following_count, friend_count, story_count, login_apple_id, login_google_id, mfa_enabled, mfa_secret, created_at, username_modified_at, deleted_at)
VALUES            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26);
               "#)
                .bind(&user.name)
                .bind(case.to_string())
                .bind(&user.email)
                .bind(&user.email_verified)
                .bind(&user.password)
                .bind(&user.bio)
                .bind(&user.rendered_bio)
                .bind(&user.location)
                .bind(&user.wpm)
                .bind(&user.avatar_id)
                .bind(&user.avatar_hex)
                .bind(&user.banner_id)
                .bind(&user.banner_hex)
                .bind(&user.is_private)
                .bind(&user.public_flags)
                .bind(&user.follower_count)
                .bind(&user.following_count)
                .bind(&user.friend_count)
                .bind(&user.story_count)
                .bind(&user.login_apple_id)
                .bind(&user.login_google_id)
                .bind(&user.mfa_enabled)
                .bind(&user.mfa_secret)
                .bind(&user.created_at)
                .bind(&user.username_modified_at)
                .bind(&user.deleted_at)
                .execute(&mut *conn)
                .await;

            assert!(matches!(result.unwrap_err(), sqlx::Error::Database(_)));
        }

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
            INSERT INTO stories(user_id)
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
            SET deleted_at = now()
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
            INSERT INTO stories(user_id)
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
            SET deactivated_at = now()
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

    // Comments

    #[sqlx::test(fixtures("story"))]
    async fn can_cascade_user_soft_delete_to_comments(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a comment
        let insert_result = sqlx::query(
            r#"
            INSERT INTO comments(content, user_id, story_id)
            VALUES ($1, $2, $3)
            RETURNING id, deleted_at
            "#,
        )
        .bind("Sample content".to_string())
        .bind(user_id)
        .bind(2i64)
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
            SET deleted_at = now()
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
            INSERT INTO comments(content, user_id, story_id)
            VALUES ($1, $2, $3)
            RETURNING id, deleted_at
            "#,
        )
        .bind("Sample content".to_string())
        .bind(user_id)
        .bind(2i64)
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
            SET deactivated_at = now()
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
            INSERT INTO replies(content, user_id, comment_id)
            VALUES ($1, $2, $3)
            RETURNING id, deleted_at
            "#,
        )
        .bind("Sample content".to_string())
        .bind(user_id)
        .bind(3i64)
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
            SET deleted_at = now()
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
            INSERT INTO replies(content, user_id, comment_id)
            VALUES ($1, $2, $3)
            RETURNING id, deleted_at
            "#,
        )
        .bind("Sample content".to_string())
        .bind(user_id)
        .bind(3i64)
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
            SET deactivated_at = now()
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

    // Followed tags

    #[sqlx::test(fixtures("tag"))]
    async fn can_cascade_user_soft_delete_to_followed_tags(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Follow a tag
        let insert_result = sqlx::query(
            r#"
            INSERT INTO tag_followers(tag_id, user_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deleted_at = now()
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
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO tag_followers(tag_id, user_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deactivated_at = now()
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
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(1i64)
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
            SET deleted_at = now()
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
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(1i64)
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
            SET deactivated_at = now()
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
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deleted_at = now()
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
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deactivated_at = now()
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
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO friends(transmitter_id, receiver_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(1i64)
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
            SET deleted_at = now()
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
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO friends(transmitter_id, receiver_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(1i64)
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
            SET deactivated_at = now()
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
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO friends(transmitter_id, receiver_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deleted_at = now()
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
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO friends(transmitter_id, receiver_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deactivated_at = now()
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
        .bind(1i64)
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
        .bind(1i64)
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

    // Story likes

    #[sqlx::test(fixtures("story"))]
    async fn can_cascade_user_soft_delete_to_story_likes(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Like a story
        let insert_result = sqlx::query(
            r#"
            INSERT INTO story_likes(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(2i64)
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
            SET deleted_at = now()
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
        .bind(2i64)
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
        .bind(2i64)
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
            INSERT INTO story_likes(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(2i64)
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
            SET deactivated_at = now()
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
        .bind(2i64)
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
        .bind(2i64)
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
            INSERT INTO comment_likes(user_id, comment_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(3i64)
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
            SET deleted_at = now()
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
        .bind(3i64)
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
        .bind(3i64)
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
            INSERT INTO comment_likes(user_id, comment_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(3i64)
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
            SET deactivated_at = now()
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
        .bind(3i64)
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
        .bind(3i64)
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
            INSERT INTO reply_likes(user_id, reply_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(4i64)
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
            SET deleted_at = now()
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
        .bind(4i64)
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
        .bind(4i64)
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
            INSERT INTO reply_likes(user_id, reply_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(4i64)
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
            SET deactivated_at = now()
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
        .bind(4i64)
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
        .bind(4i64)
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
            INSERT INTO bookmarks(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(2i64)
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
            SET deleted_at = now()
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
        .bind(2i64)
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
        .bind(2i64)
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
            INSERT INTO bookmarks(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(2i64)
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
            SET deactivated_at = now()
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
        .bind(2i64)
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
        .bind(2i64)
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
            INSERT INTO histories(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(2i64)
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
            SET deleted_at = now()
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
        .bind(2i64)
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
        .bind(2i64)
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
            INSERT INTO histories(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(2i64)
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
            SET deactivated_at = now()
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
        .bind(2i64)
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
        .bind(2i64)
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
            INSERT INTO blocks(blocker_id, blocked_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deleted_at = now()
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
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO blocks(blocker_id, blocked_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deactivated_at = now()
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
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO blocks(blocker_id, blocked_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(1i64)
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
            SET deleted_at = now()
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
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO blocks(blocker_id, blocked_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(1i64)
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
            SET deactivated_at = now()
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
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO mutes(muter_id, muted_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deleted_at = now()
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
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO mutes(muter_id, muted_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deactivated_at = now()
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
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO mutes(muter_id, muted_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(1i64)
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
            SET deleted_at = now()
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
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO mutes(muter_id, muted_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(1i64)
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
            SET deactivated_at = now()
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
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO notifications(entity_id, entity_type, notifier_id)
            VALUES ($1, $2, $3)
            RETURNING id
            "#,
        )
        .bind(1i64)
        .bind(0)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Soft-delete the user
        sqlx::query(
            r#"
            UPDATE users
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Transmitted notification should be deleted
        let result = sqlx::query(
            r#"
            SELECT EXISTS(
              SELECT 1 FROM notifications
              WHERE notifier_id = $1
            )
            "#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

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
            INSERT INTO notifications(entity_id, entity_type, notifier_id)
            VALUES ($1, $2, $3)
            RETURNING id
            "#,
        )
        .bind(1i64)
        .bind(0)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Deactivate the user
        sqlx::query(
            r#"
            UPDATE users
            SET deactivated_at = now()
            WHERE id = $1
            "#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Transmitted notification should be deleted
        let result = sqlx::query(
            r#"
            SELECT EXISTS(
              SELECT 1 FROM notifications
              WHERE notifier_id = $1
            )
            "#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

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
            INSERT INTO notification_outs(notified_id, notification_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(user_id)
        .bind(2i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Soft-delete the user
        sqlx::query(
            r#"
            UPDATE users
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Received notification should be deleted
        let result = sqlx::query(
            r#"
            SELECT EXISTS(
              SELECT 1 FROM notification_outs
              WHERE notified_id = $1
            )
            "#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

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
            INSERT INTO notification_outs(notified_id, notification_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(user_id)
        .bind(2i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Deactivate the user
        sqlx::query(
            r#"
            UPDATE users
            SET deactivated_at = now()
            WHERE id = $1
            "#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Received notification should be deleted
        let result = sqlx::query(
            r#"
            SELECT EXISTS(
              SELECT 1 FROM notification_outs
              WHERE notified_id = $1
            )
            "#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

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
            INSERT INTO notifications(entity_id, entity_type, notifier_id)
            VALUES ($1, $2, $3)
            RETURNING id
            "#,
        )
        .bind(user_id)
        .bind(0)
        .bind(1i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Soft-delete the user
        sqlx::query(
            r#"
            UPDATE users
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Notification should be deleted
        let result = sqlx::query(
            r#"
            SELECT EXISTS(
              SELECT 1 FROM notifications
              WHERE notifier_id = $1
            )
            "#,
        )
        .bind(1i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

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
            INSERT INTO notifications(entity_id, entity_type, notifier_id)
            VALUES ($1, $2, $3)
            RETURNING id
            "#,
        )
        .bind(user_id)
        .bind(0)
        .bind(1i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Deactivate the user
        sqlx::query(
            r#"
            UPDATE users
            SET deactivated_at = now()
            WHERE id = $1
            "#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await?;

        // Notification should be deleted
        let result = sqlx::query(
            r#"
            SELECT EXISTS(
              SELECT 1 FROM notifications
              WHERE notifier_id = $1
            )
            "#,
        )
        .bind(1i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

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
            INSERT INTO assets(key, hex, height, width, user_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
            "#,
        )
        .bind("sample_key".to_string())
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
            SET deleted_at = now()
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
            INSERT INTO assets(key, hex, height, width, user_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
            "#,
        )
        .bind("sample_key".to_string())
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
            SET deactivated_at = now()
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

    #[sqlx::test(fixtures("story"))]
    async fn should_not_restore_comments_from_deleted_stories_when_cascading_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a comment
        let result = sqlx::query(
            r#"
            INSERT INTO comments(content, user_id, story_id)
            VALUES ($1, $2, $3)
            RETURNING id, deleted_at
            "#,
        )
        .bind("Sample content")
        .bind(user_id)
        .bind(2i64)
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
            SET deleted_at = now()
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(2i64)
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
        .bind(2i64)
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
            INSERT INTO comments(content, user_id, story_id)
            VALUES ($1, $2, $3)
            RETURNING id, deleted_at
            "#,
        )
        .bind("Sample content")
        .bind(user_id)
        .bind(2i64)
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
            SET deactivated_at = now()
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(2i64)
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
        .bind(2i64)
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
            INSERT INTO replies(content, user_id, comment_id)
            VALUES ($1, $2, $3)
            RETURNING id, deleted_at
            "#,
        )
        .bind("Sample content")
        .bind(user_id)
        .bind(3i64)
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
            SET deleted_at = now()
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(3i64)
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
        .bind(3i64)
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
            INSERT INTO replies(content, user_id, comment_id)
            VALUES ($1, $2, $3)
            RETURNING id, deleted_at
            "#,
        )
        .bind("Sample content")
        .bind(user_id)
        .bind(3i64)
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
            SET deactivated_at = now()
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(3i64)
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
        .bind(3i64)
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
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(1i64)
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
            SET deleted_at = now()
            WHERE id IN ($1, $2)
            "#,
        )
        .bind(user_id)
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Followed relation should be soft-deleted
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM relations
            WHERE followed_id = $1 AND follower_id = $2
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Followed relation should be restored
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM relations
            WHERE followed_id = $1 AND follower_id = $2
            "#,
        )
        .bind(1i64)
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
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(1i64)
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
            SET deactivated_at = now()
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Followed relation should be soft-deleted
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM relations
            WHERE followed_id = $1 AND follower_id = $2
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Followed relation should be restored
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM relations
            WHERE followed_id = $1 AND follower_id = $2
            "#,
        )
        .bind(1i64)
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
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(1i64)
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
            SET deleted_at = now()
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
            SET deactivated_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Followed relation should be soft-deleted
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM relations
            WHERE followed_id = $1 AND follower_id = $2
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Followed relation should be restored
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM relations
            WHERE followed_id = $1 AND follower_id = $2
            "#,
        )
        .bind(1i64)
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
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(1i64)
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
            SET deactivated_at = now()
            WHERE id IN ($1, $2)
            "#,
        )
        .bind(user_id)
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Followed relation should be soft-deleted
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM relations
            WHERE followed_id = $1 AND follower_id = $2
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Followed relation should be restored
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM relations
            WHERE followed_id = $1 AND follower_id = $2
            "#,
        )
        .bind(1i64)
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
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deleted_at = now()
            WHERE id IN ($1, $2)
            "#,
        )
        .bind(user_id)
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deactivated_at = now()
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deleted_at = now()
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
            SET deactivated_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO relations(follower_id, followed_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deactivated_at = now()
            WHERE id IN ($1, $2)
            "#,
        )
        .bind(user_id)
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO friends(transmitter_id, receiver_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deleted_at = now()
            WHERE id IN ($1, $2)
            "#,
        )
        .bind(user_id)
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Friend relation should be soft-deleted
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM friends
            WHERE transmitter_id = $1 AND receiver_id = $2
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Friend relation should be restored
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM friends
            WHERE transmitter_id = $1 AND receiver_id = $2
            "#,
        )
        .bind(1i64)
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
            INSERT INTO friends(transmitter_id, receiver_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deactivated_at = now()
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Friend relation should be soft-deleted
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM friends
            WHERE transmitter_id = $1 AND receiver_id = $2
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Friend relation should be restored
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM friends
            WHERE transmitter_id = $1 AND receiver_id = $2
            "#,
        )
        .bind(1i64)
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
            INSERT INTO friends(transmitter_id, receiver_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deleted_at = now()
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
            SET deactivated_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Friend relation should be soft-deleted
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM friends
            WHERE transmitter_id = $1 AND receiver_id = $2
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Friend relation should be restored
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM friends
            WHERE transmitter_id = $1 AND receiver_id = $2
            "#,
        )
        .bind(1i64)
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
            INSERT INTO friends(transmitter_id, receiver_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(1i64)
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
            SET deactivated_at = now()
            WHERE id IN ($1, $2)
            "#,
        )
        .bind(user_id)
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Friend relation should be soft-deleted
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM friends
            WHERE transmitter_id = $1 AND receiver_id = $2
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
        .execute(&mut *conn)
        .await?;

        // Friend relation should be restored
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM friends
            WHERE transmitter_id = $1 AND receiver_id = $2
            "#,
        )
        .bind(1i64)
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
            INSERT INTO friends(transmitter_id, receiver_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(1i64)
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
            SET deleted_at = now()
            WHERE id IN ($1, $2)
            "#,
        )
        .bind(user_id)
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO friends(transmitter_id, receiver_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(1i64)
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
            SET deactivated_at = now()
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO friends(transmitter_id, receiver_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(1i64)
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
            SET deleted_at = now()
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
            SET deactivated_at = now()
            WHERE id = $1
            "#,
        )
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO friends(transmitter_id, receiver_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(1i64)
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
            SET deactivated_at = now()
            WHERE id IN ($1, $2)
            "#,
        )
        .bind(user_id)
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
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
        .bind(1i64)
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
            INSERT INTO story_likes(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(2i64)
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
            SET deleted_at = now()
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(2i64)
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
        .bind(2i64)
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
        .bind(2i64)
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
        .bind(2i64)
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
        .bind(2i64)
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
            INSERT INTO story_likes(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(2i64)
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
            SET deactivated_at = now()
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(2i64)
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
        .bind(2i64)
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
        .bind(2i64)
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
        .bind(2i64)
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
        .bind(2i64)
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
            INSERT INTO comment_likes(user_id, comment_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(3i64)
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
            SET deleted_at = now()
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(3i64)
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
        .bind(3i64)
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
        .bind(3i64)
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
        .bind(3i64)
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
        .bind(3i64)
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
            INSERT INTO comment_likes(user_id, comment_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(3i64)
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
            SET deactivated_at = now()
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(3i64)
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
        .bind(3i64)
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
        .bind(3i64)
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
        .bind(3i64)
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
        .bind(3i64)
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
            INSERT INTO reply_likes(user_id, reply_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(4i64)
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
            SET deleted_at = now()
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(4i64)
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
        .bind(4i64)
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
        .bind(4i64)
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
        .bind(4i64)
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
        .bind(4i64)
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
            INSERT INTO reply_likes(user_id, reply_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(4i64)
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
            SET deactivated_at = now()
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(4i64)
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
        .bind(4i64)
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
        .bind(4i64)
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
        .bind(4i64)
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
        .bind(4i64)
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
            INSERT INTO bookmarks(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(2i64)
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
            SET deleted_at = now()
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(2i64)
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
        .bind(2i64)
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
        .bind(2i64)
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
        .bind(2i64)
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
        .bind(2i64)
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
            INSERT INTO bookmarks(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(2i64)
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
            SET deactivated_at = now()
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(2i64)
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
        .bind(2i64)
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
        .bind(2i64)
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
        .bind(2i64)
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
        .bind(2i64)
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
            INSERT INTO histories(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(2i64)
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
            SET deleted_at = now()
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(2i64)
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
        .bind(2i64)
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
        .bind(2i64)
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
        .bind(2i64)
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
        .bind(2i64)
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
            INSERT INTO histories(user_id, story_id)
            VALUES ($1, $2)
            RETURNING deleted_at
            "#,
        )
        .bind(user_id)
        .bind(2i64)
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
            SET deactivated_at = now()
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
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(2i64)
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
        .bind(2i64)
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
        .bind(2i64)
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
        .bind(2i64)
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
        .bind(2i64)
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
            INSERT INTO stories(user_id)
            VALUES ($1)
            RETURNING id, deleted_at
            "#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        // Insert a comment
        let comment_result = sqlx::query(
            r#"
            INSERT INTO comments(content, user_id, story_id)
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
            SET deleted_at = now()
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
            INSERT INTO stories(user_id)
            VALUES ($1)
            RETURNING id, deleted_at
            "#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        // Insert a comment
        let comment_result = sqlx::query(
            r#"
            INSERT INTO comments(content, user_id, story_id)
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
            SET deactivated_at = now()
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
            INSERT INTO comments(content, user_id, story_id)
            VALUES ($1, $2, $3)
            RETURNING id, deleted_at
            "#,
        )
        .bind("Sample content".to_string())
        .bind(user_id)
        .bind(2i64)
        .fetch_one(&mut *conn)
        .await?;

        // Insert a reply
        let reply_result = sqlx::query(
            r#"
            INSERT INTO replies(content, user_id, comment_id)
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
            SET deleted_at = now()
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
            INSERT INTO comments(content, user_id, story_id)
            VALUES ($1, $2, $3)
            RETURNING id, deleted_at
            "#,
        )
        .bind("Sample content".to_string())
        .bind(user_id)
        .bind(2i64)
        .fetch_one(&mut *conn)
        .await?;

        // Insert a reply
        let reply_result = sqlx::query(
            r#"
            INSERT INTO replies(content, user_id, comment_id)
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
            SET deactivated_at = now()
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
            INSERT INTO stories(user_id)
            VALUES ($1)
            RETURNING id, deleted_at
            "#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        // Like the story
        let story_like_result = sqlx::query(
            r#"
            INSERT INTO story_likes(user_id, story_id)
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
            SET deleted_at = now()
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
            INSERT INTO stories(user_id)
            VALUES ($1)
            RETURNING id, deleted_at
            "#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        // Like the story
        let story_like_result = sqlx::query(
            r#"
            INSERT INTO story_likes(user_id, story_id)
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
            SET deactivated_at = now()
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
            INSERT INTO comments(content, user_id, story_id)
            VALUES ($1, $2, $3)
            RETURNING id, deleted_at
            "#,
        )
        .bind("Sample content".to_string())
        .bind(user_id)
        .bind(2i64)
        .fetch_one(&mut *conn)
        .await?;

        // Like the comment
        let comment_like_result = sqlx::query(
            r#"
            INSERT INTO comment_likes(user_id, comment_id)
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
            SET deleted_at = now()
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
            INSERT INTO comments(content, user_id, story_id)
            VALUES ($1, $2, $3)
            RETURNING id, deleted_at
            "#,
        )
        .bind("Sample content".to_string())
        .bind(user_id)
        .bind(2i64)
        .fetch_one(&mut *conn)
        .await?;

        // Like the comment
        let comment_like_result = sqlx::query(
            r#"
            INSERT INTO comment_likes(user_id, comment_id)
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
            SET deactivated_at = now()
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
            INSERT INTO replies(content, user_id, comment_id)
            VALUES ($1, $2, $3)
            RETURNING id, deleted_at
            "#,
        )
        .bind("Sample content".to_string())
        .bind(user_id)
        .bind(3i64)
        .fetch_one(&mut *conn)
        .await?;

        // Like the reply
        let reply_like_result = sqlx::query(
            r#"
            INSERT INTO reply_likes(user_id, reply_id)
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
            SET deleted_at = now()
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
            INSERT INTO replies(content, user_id, comment_id)
            VALUES ($1, $2, $3)
            RETURNING id, deleted_at
            "#,
        )
        .bind("Sample content".to_string())
        .bind(user_id)
        .bind(3i64)
        .fetch_one(&mut *conn)
        .await?;

        // Like the reply
        let reply_like_result = sqlx::query(
            r#"
            INSERT INTO reply_likes(user_id, reply_id)
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
            SET deactivated_at = now()
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
            INSERT INTO stories(user_id)
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
            SELECT EXISTS(
                SELECT 1 FROM stories
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

    #[sqlx::test(fixtures("story"))]
    async fn can_delete_comment_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a comment
        let insert_result = sqlx::query(
            r#"
            INSERT INTO comments(content, user_id, story_id)
            VALUES ($1, $2, $3)
            RETURNING id
            "#,
        )
        .bind("Sample content".to_string())
        .bind(user_id)
        .bind(2i64)
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

    #[sqlx::test(fixtures("story", "comment"))]
    async fn can_delete_reply_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a reply
        let insert_result = sqlx::query(
            r#"
            INSERT INTO replies(content, user_id, comment_id)
            VALUES ($1, $2, $3)
            RETURNING id
            "#,
        )
        .bind("Sample content".to_string())
        .bind(user_id)
        .bind(3i64)
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
            SELECT EXISTS(
                SELECT 1 FROM replies
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
    async fn can_delete_followed_relation_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Follow a user
        let insert_result = sqlx::query(
            r#"
            INSERT INTO relations(followed_id, follower_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(1i64)
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
            SELECT EXISTS(
                SELECT 1 FROM relations
                WHERE followed_id = $1 AND follower_id = $2
            )
            "#,
        )
        .bind(1i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_follower_relation_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Add a follower
        let insert_result = sqlx::query(
            r#"
            INSERT INTO relations(followed_id, follower_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(user_id)
        .bind(1i64)
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
            SELECT EXISTS(
                SELECT 1 FROM relations
                WHERE followed_id = $1 AND follower_id = $2
            )
            "#,
        )
        .bind(user_id)
        .bind(1i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_transmitted_friend_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Send a friend request
        let insert_result = sqlx::query(
            r#"
            INSERT INTO friends(transmitter_id, receiver_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(user_id)
        .bind(1i64)
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
            SELECT EXISTS(
                SELECT 1 FROM friends
                WHERE transmitter_id = $1 AND receiver_id = $2
            )
            "#,
        )
        .bind(user_id)
        .bind(1i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_received_friend_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Receive a friend request
        let insert_result = sqlx::query(
            r#"
            INSERT INTO friends(transmitter_id, receiver_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(1i64)
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
            SELECT EXISTS(
                SELECT 1 FROM friends
                WHERE transmitter_id = $1 AND receiver_id = $2
            )
            "#,
        )
        .bind(1i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

        Ok(())
    }

    #[sqlx::test]
    async fn can_set_asset_user_id_as_null_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert an asset
        let insert_result = sqlx::query(
            r#"
            INSERT INTO assets(key, hex, height, width, user_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
            "#,
        )
        .bind("sample_key".to_string())
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

    #[sqlx::test(fixtures("story"))]
    async fn can_delete_story_like_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Like a story
        let insert_result = sqlx::query(
            r#"
            INSERT INTO story_likes(user_id, story_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(user_id)
        .bind(2i64)
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
            SELECT EXISTS(
                SELECT 1 FROM story_likes
                WHERE user_id = $1 AND story_id = $2
            )
            "#,
        )
        .bind(user_id)
        .bind(2i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

        Ok(())
    }

    #[sqlx::test(fixtures("story", "comment"))]
    async fn can_delete_comment_like_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Like a comment
        let insert_result = sqlx::query(
            r#"
            INSERT INTO comment_likes(user_id, comment_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(user_id)
        .bind(3i64)
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
            SELECT EXISTS(
                SELECT 1 FROM comment_likes
                WHERE user_id = $1 AND comment_id = $2
            )
            "#,
        )
        .bind(user_id)
        .bind(3i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

        Ok(())
    }

    #[sqlx::test(fixtures("story", "comment", "reply"))]
    async fn can_delete_reply_like_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Like a reply
        let insert_result = sqlx::query(
            r#"
            INSERT INTO reply_likes(user_id, reply_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(user_id)
        .bind(4i64)
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
            SELECT EXISTS(
                SELECT 1 FROM reply_likes
                WHERE user_id = $1 AND reply_id = $2
            )
            "#,
        )
        .bind(user_id)
        .bind(4i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_delete_bookmark_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a bookmark
        let insert_result = sqlx::query(
            r#"
            INSERT INTO bookmarks(user_id, story_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(user_id)
        .bind(2i64)
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
            SELECT EXISTS(
                SELECT 1 FROM bookmarks
                WHERE user_id = $1 AND story_id = $2
            )
            "#,
        )
        .bind(user_id)
        .bind(2i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

        Ok(())
    }

    #[sqlx::test(fixtures("story"))]
    async fn can_delete_history_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a history
        let insert_result = sqlx::query(
            r#"
            INSERT INTO histories(user_id, story_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(user_id)
        .bind(2i64)
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
            SELECT EXISTS(
                SELECT 1 FROM histories
                WHERE user_id = $1 AND story_id = $2
            )
            "#,
        )
        .bind(user_id)
        .bind(2i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

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
            INSERT INTO tag_followers(tag_id, user_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(1i64)
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
            SELECT EXISTS(
                SELECT 1 FROM tag_followers
                WHERE tag_id = $1 AND user_id = $2
            )
            "#,
        )
        .bind(1i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_blocked_relation_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Get blocked by a user
        let insert_result = sqlx::query(
            r#"
            INSERT INTO blocks(blocker_id, blocked_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(1i64)
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
            SELECT EXISTS(
                SELECT 1 FROM blocks
                WHERE blocker_id = $1 AND blocked_id = $2
            )
            "#,
        )
        .bind(1i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_blocker_relation_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Block a user
        let insert_result = sqlx::query(
            r#"
            INSERT INTO blocks(blocker_id, blocked_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(user_id)
        .bind(1i64)
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
            SELECT EXISTS(
                SELECT 1 FROM blocks
                WHERE blocker_id = $1 AND blocked_id = $2
            )
            "#,
        )
        .bind(user_id)
        .bind(1i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_muted_relation_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Get muted by a user
        let insert_result = sqlx::query(
            r#"
            INSERT INTO mutes(muter_id, muted_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(1i64)
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
            SELECT EXISTS(
                SELECT 1 FROM mutes
                WHERE muter_id = $1 AND muted_id = $2
            )
            "#,
        )
        .bind(1i64)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

        Ok(())
    }

    #[sqlx::test(fixtures("user"))]
    async fn can_delete_muter_relation_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Mute a user
        let insert_result = sqlx::query(
            r#"
            INSERT INTO mutes(muter_id, muted_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(user_id)
        .bind(1i64)
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
            SELECT EXISTS(
                SELECT 1 FROM mutes
                WHERE muter_id = $1 AND muted_id = $2
            )
            "#,
        )
        .bind(user_id)
        .bind(1i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

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
            INSERT INTO notifications(entity_id, entity_type, notifier_id)
            VALUES ($1, $2, $3)
            RETURNING id
            "#,
        )
        .bind(1i64)
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
            SELECT EXISTS(
              SELECT 1 FROM notifications
              WHERE notifier_id = $1
            )
            "#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

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
            INSERT INTO notification_outs(notified_id, notification_id)
            VALUES ($1, $2)
            "#,
        )
        .bind(user_id)
        .bind(2i64)
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
            SELECT EXISTS(
              SELECT 1 FROM notification_outs
              WHERE notified_id = $1
            )
            "#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

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
            INSERT INTO notifications(entity_id, entity_type, notifier_id)
            VALUES ($1, $2, $3)
            RETURNING id
            "#,
        )
        .bind(user_id)
        .bind(0)
        .bind(1i64)
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
            SELECT EXISTS(
              SELECT 1 FROM notifications
              WHERE notifier_id = $1
            )
            "#,
        )
        .bind(1i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

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
            SELECT EXISTS(
                SELECT 1 FROM notification_settings
                WHERE user_id = $1
            )
            "#,
        )
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<bool, _>("exists"), false);

        Ok(())
    }

    #[sqlx::test]
    async fn can_delete_connections_on_user_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a connection
        let insert_result = sqlx::query(
            r#"
            INSERT INTO connections(provider, provider_identifier, user_id)
            VALUES (0, 'sample', $1)
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
            SELECT EXISTS(
                SELECT 1 FROM connections
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
            SELECT EXISTS(
                SELECT 1 FROM account_activities
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
}
