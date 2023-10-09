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
            INSERT INTO stories(title, doc_key, user_id)
            VALUES ($1, $2, $3)
            RETURNING id, deleted_at
            "#,
        )
        .bind("Sample story".to_string())
        .bind("sample-key".to_string())
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none(),
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
    async fn can_soft_delete_and_recover_stories_on_user_deactivation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert a story
        let insert_result = sqlx::query(
            r#"
            INSERT INTO stories(title, doc_key, user_id)
            VALUES ($1, $2, $3)
            RETURNING id, deleted_at
            "#,
        )
        .bind("Sample story".to_string())
        .bind("sample-key".to_string())
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none(),
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
                .is_none(),
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
    async fn can_soft_delete_and_recover_comments_on_user_deactivation(
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
                .is_none(),
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
                .is_none(),
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
    async fn can_soft_delete_and_recover_replies_on_user_deactivation(
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
                .is_none(),
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

    // Assets

    #[sqlx::test]
    async fn can_cascade_user_soft_delete_to_assets(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert an asset
        let insert_result = sqlx::query(
            r#"
            INSERT INTO assets(key, hex, height, width, user_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, deleted_at
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
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none(),
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

        // Asset should be soft-deleted
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM assets
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

        // Asset should be restored
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM assets
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
    async fn can_soft_delete_and_recover_assets_on_user_deactivation(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user_id = (insert_sample_user(&mut conn).await?).get::<i64, _>("id");

        // Insert an asset
        let insert_result = sqlx::query(
            r#"
            INSERT INTO assets(key, hex, height, width, user_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, deleted_at
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
        assert!(
            insert_result
                .get::<Option<OffsetDateTime>, _>("deleted_at")
                .is_none(),
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

        // Asset should be soft-deleted
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM assets
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

        // Asset should be restored
        let result = sqlx::query(
            r#"
            SELECT deleted_at FROM assets
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
                .is_none(),
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
    async fn can_soft_delete_and_recover_followed_tags_on_user_deactivation(
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
                .is_none(),
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
                .is_none(),
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
    async fn can_soft_delete_and_recover_followed_relations_on_user_deactivation(
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
                .is_none(),
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
                .is_none(),
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
    async fn can_soft_delete_and_recover_follower_relations_on_user_deactivation(
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
                .is_none(),
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
                .is_none(),
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
    async fn can_soft_delete_and_recover_transmitted_friends_on_user_deactivation(
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
                .is_none(),
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
                .is_none(),
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
    async fn can_soft_delete_and_recover_received_friends_on_user_deactivation(
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
                .is_none(),
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
                .is_none(),
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
    async fn can_soft_delete_and_recover_story_likes_on_user_deactivation(
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
                .is_none(),
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
                .is_none(),
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
    async fn can_soft_delete_and_recover_comment_likes_on_user_deactivation(
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
                .is_none(),
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
                .is_none(),
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
    async fn can_soft_delete_and_recover_reply_likes_on_user_deactivation(
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
                .is_none(),
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

    // Misc

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
                .is_none(),
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

        // TODO: Uncomment once story triggers are implemented
        // // Restore the story
        // sqlx::query(
        //     r#"
        //     UPDATE stories
        //     SET deleted_at = NULL
        //     WHERE id = $1
        //     "#,
        // )
        // .bind(2i64)
        // .execute(&mut *conn)
        // .await?;
        //
        // // Comment should be restored
        // let result = sqlx::query(
        //     r#"
        //     SELECT deleted_at FROM comments
        //     WHERE id = $1
        //     "#,
        // )
        // .bind(comment_id)
        // .fetch_one(&mut *conn)
        // .await?;
        //
        // assert!(
        //     result
        //         .get::<Option<OffsetDateTime>, _>("deleted_at")
        //         .is_none()
        // );

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
                .is_none(),
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

        // TODO: Uncomment once story triggers are implemented
        // // Restore the story
        // sqlx::query(
        //     r#"
        //     UPDATE stories
        //     SET deleted_at = NULL
        //     WHERE id = $1
        //     "#,
        // )
        // .bind(2i64)
        // .execute(&mut *conn)
        // .await?;
        //
        // // Comment should be restored
        // let result = sqlx::query(
        //     r#"
        //     SELECT deleted_at FROM comments
        //     WHERE id = $1
        //     "#,
        // )
        // .bind(comment_id)
        // .fetch_one(&mut *conn)
        // .await?;
        //
        // assert!(
        //     result
        //         .get::<Option<OffsetDateTime>, _>("deleted_at")
        //         .is_none()
        // );

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
                .is_none(),
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

        // TODO: Uncomment once comment triggers are implemented
        // // Restore the comment
        // sqlx::query(
        //     r#"
        //     UPDATE comments
        //     SET deleted_at = NULL
        //     WHERE id = $1
        //     "#,
        // )
        // .bind(3i64)
        // .execute(&mut *conn)
        // .await?;
        //
        // // Reply should be restored
        // let result = sqlx::query(
        //     r#"
        //     SELECT deleted_at FROM replies
        //     WHERE id = $1
        //     "#,
        // )
        // .bind(reply_id)
        // .fetch_one(&mut *conn)
        // .await?;
        //
        // assert!(
        //     result
        //         .get::<Option<OffsetDateTime>, _>("deleted_at")
        //         .is_none()
        // );

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
                .is_none(),
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

        // TODO: Uncomment once comment triggers are implemented
        // // Restore the comment
        // sqlx::query(
        //     r#"
        //     UPDATE comments
        //     SET deleted_at = NULL
        //     WHERE id = $1
        //     "#,
        // )
        // .bind(3i64)
        // .execute(&mut *conn)
        // .await?;
        //
        // // Reply should be restored
        // let result = sqlx::query(
        //     r#"
        //     SELECT deleted_at FROM replies
        //     WHERE id = $1
        //     "#,
        // )
        // .bind(reply_id)
        // .fetch_one(&mut *conn)
        // .await?;
        //
        // assert!(
        //     result
        //         .get::<Option<OffsetDateTime>, _>("deleted_at")
        //         .is_none()
        // );

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
                .is_none(),
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
                .is_none(),
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
                .is_none(),
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
                .is_none(),
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
                .is_none(),
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
                .is_none(),
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
                .is_none(),
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
                .is_none(),
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
                .is_none(),
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
                .is_none(),
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
                .is_none(),
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
                .is_none(),
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
                .is_none(),
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
                .is_none(),
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
                .is_none(),
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
                .is_none(),
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
}
