#[cfg(test)]
mod tests {
    use sqlx::PgPool;
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

    #[sqlx::test]
    async fn can_insert_a_valid_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let user = get_default_user();
        let result = sqlx::query(
            r#"
INSERT INTO users (name, username, email, email_verified, password, bio, rendered_bio, location, wpm, avatar_id, avatar_hex, banner_id, banner_hex, is_private, public_flags, follower_count, following_count, friend_count, story_count, login_apple_id, login_google_id, mfa_enabled, mfa_secret, created_at, username_modified_at, deleted_at)
VALUES            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26);
               "#)
            .bind(&user.name)
            .bind(&user.username)
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
            .await?;

        assert_eq!(result.rows_affected(), 1);
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
}
