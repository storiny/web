#[cfg(test)]
mod tests {
    use sqlx::{
        PgPool,
        Row,
    };
    use storiny::{
        constants::sql_states::SqlState,
        grpc::defs::privacy_settings_def::v1::IncomingBlogRequest,
    };

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_send_an_editor_request(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_reject_an_illegal_editor(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(3_i64)
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
            SqlState::IllegalEditor.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_reject_overflowing_editors(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        let result = sqlx::query(
            r#"
WITH inserted_users AS (
    INSERT INTO users (id, name, username, email)
    VALUES
        (4, 'Editor 1', 'editor_1', 'editor_1@storiny.com'),
        (5, 'Editor 2', 'editor_2', 'editor_2@storiny.com'),
        (6, 'Editor 3', 'editor_3', 'editor_3@storiny.com'),
        (7, 'Editor 4', 'editor_4', 'editor_4@storiny.com'),
        (8, 'Editor 5', 'editor_5', 'editor_5@storiny.com')
)
INSERT INTO blog_editors (user_id, blog_id)
VALUES (4, $1), (5, $1), (6, $1), (7, $1), (8, $1)
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 5);

        // Force overflow.
        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
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
            SqlState::EditorOverflow.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_handle_overflowing_editors_for_a_blog_with_plus_features(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Enable plus features for the blog.
        let result = sqlx::query(
            r#"
UPDATE blogs
SET has_plus_features = TRUE
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Add editors.
        let result = sqlx::query(
            r#"
WITH inserted_users AS (
    INSERT INTO users (id, name, username, email)
    VALUES
        (4, 'Editor 1', 'editor_1', 'editor_1@storiny.com'),
        (5, 'Editor 2', 'editor_2', 'editor_2@storiny.com'),
        (6, 'Editor 3', 'editor_3', 'editor_3@storiny.com'),
        (7, 'Editor 4', 'editor_4', 'editor_4@storiny.com'),
        (8, 'Editor 5', 'editor_5', 'editor_5@storiny.com')
)
INSERT INTO blog_editors (user_id, blog_id)
VALUES (4, $1), (5, $1), (6, $1), (7, $1), (8, $1)
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 5);

        // Force overflow.
        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should accept the editor.
        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_purge_redundant_writer_when_accepting_the_editor_invite(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Insert a writer.
        let result = sqlx::query(
            r#"
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES ($1, $2, $3)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Insert an editor.
        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Accept the editor invite.
        let result = sqlx::query(
            r#"
UPDATE blog_editors
SET accepted_at = NOW()
WHERE user_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should delete the writer.
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT FROM blog_writers
    WHERE blog_id = $1
)
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_reject_blog_editor_invite_for_private_editor(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Make the editor private.
        sqlx::query(
            r#"
UPDATE users
SET is_private = TRUE
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
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
            SqlState::EditorNotAcceptingBlogRequest.to_string()
        );

        // Add the user as friend.
        sqlx::query(
            r#"
INSERT INTO friends (transmitter_id, receiver_id, accepted_at)
VALUES ($1, $2, NOW())
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_reject_blog_editor_invite_for_soft_deleted_editor(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Soft-delete the editor
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

        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
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

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_reject_blog_editor_invite_for_deactivated_editor(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Deactivate the editor
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

        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
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

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_reject_blog_editor_invite_for_soft_deleted_blog(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

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
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
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

    // `editor_count` counter cache

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_increment_editor_count_when_accepting_an_editor_invite(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Send an editor invite
        sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should not increment `editor_count`
        let result = sqlx::query(
            r#"
SELECT editor_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("editor_count"), 0);

        // Accept the editor invite
        sqlx::query(
            r#"
UPDATE blog_editors
SET accepted_at = NOW()
WHERE user_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should increment the `editor_count`
        let result = sqlx::query(
            r#"
SELECT editor_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("editor_count"), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_update_editor_count_when_soft_deleting_and_restoring_the_editor(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Send an editor invite
        sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Accept the editor invite
        sqlx::query(
            r#"
UPDATE blog_editors
SET accepted_at = NOW()
WHERE user_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should have 1 `editor_count` initially
        let result = sqlx::query(
            r#"
SELECT editor_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("editor_count"), 1);

        // Soft-delete the editor
        sqlx::query(
            r#"
UPDATE blog_editors
SET deleted_at = NOW()
WHERE user_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement the `editor_count`
        let result = sqlx::query(
            r#"
SELECT editor_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("editor_count"), 0);

        // Restore the editor
        sqlx::query(
            r#"
UPDATE blog_editors
SET deleted_at = NULL
WHERE user_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should increment the `editor_count`
        let result = sqlx::query(
            r#"
SELECT editor_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("editor_count"), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_update_editor_count_when_hard_deleting_the_editor(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Send an editor request
        sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Accept the editor invite
        sqlx::query(
            r#"
UPDATE blog_editors
SET accepted_at = NOW()
WHERE user_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should have 1 `editor_count` initially
        let result = sqlx::query(
            r#"
SELECT editor_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("editor_count"), 1);

        // Delete the editor
        sqlx::query(
            r#"
DELETE FROM blog_editors
WHERE user_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement the `editor_count`
        let result = sqlx::query(
            r#"
SELECT editor_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("editor_count"), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog"))]
    async fn should_not_update_editor_count_when_hard_deleting_a_soft_deleted_editor(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Send an editor invite
        sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Accept the editor invite
        sqlx::query(
            r#"
UPDATE blog_editors
SET accepted_at = NOW()
WHERE user_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Insert two more editors so that the `editor_count` is always >= 1,
        // which would allow us to bypass the `editor_count > 1` constraint
        // on the blog when decrementing the `editor_count`.
        sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Editor 1', 'editor_1', 'editor_1@storiny.com')
    RETURNING id
)
INSERT INTO blog_editors (user_id, blog_id)
VALUES ((SELECT id FROM inserted_user), $1)
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Editor 2', 'editor_2', 'editor_2@storiny.com')
    RETURNING id
)
INSERT INTO blog_editors (user_id, blog_id)
VALUES ((SELECT id FROM inserted_user), $1)
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
UPDATE blog_editors
SET accepted_at = NOW()
WHERE blog_id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should have 3 `editor_count` initially
        let result = sqlx::query(
            r#"
SELECT editor_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("editor_count"), 3);

        // Soft-delete the editor
        sqlx::query(
            r#"
UPDATE blog_editors
SET deleted_at = NOW()
WHERE user_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement the `editor_count`
        let result = sqlx::query(
            r#"
SELECT editor_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("editor_count"), 2);

        // Delete the editor
        sqlx::query(
            r#"
DELETE FROM blog_editors
WHERE user_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should not decrement the `editor_count` any further
        let result = sqlx::query(
            r#"
SELECT editor_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("editor_count"), 2);

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user", "blog"))]
    async fn should_not_increment_editor_count_when_inserting_an_editor_invite(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Send an editor invite
        sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should not increment `editor_count`
        let result = sqlx::query(
            r#"
SELECT editor_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("editor_count"), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog"))]
    async fn should_not_update_editor_count_when_soft_deleting_and_restoring_the_non_accepted_editor(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Send an editor invite
        sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Soft-delete the editor
        sqlx::query(
            r#"
UPDATE blog_editors
SET deleted_at = NOW()
WHERE user_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Restore the editor
        sqlx::query(
            r#"
UPDATE blog_editors
SET deleted_at = NULL
WHERE user_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should not increment the `editor_count`
        let result = sqlx::query(
            r#"
SELECT editor_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("editor_count"), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog"))]
    async fn should_not_update_editor_count_when_hard_deleting_the_non_accepted_editor(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Send an editor invite
        sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Insert two more editors so that the `editor_count` is always >= 1,
        // which would allow us to bypass the `editor_count > 1` constraint
        // on the blog when decrementing the `editor_count`.
        sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Editor 1', 'editor_1', 'editor_1@storiny.com')
    RETURNING id
)
INSERT INTO blog_editors (id, user_id, blog_id)
VALUES ($1, (SELECT id FROM inserted_user), $2)
"#,
        )
        .bind(4_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Editor 2', 'editor_2', 'editor_2@storiny.com')
    RETURNING id
)
INSERT INTO blog_editors (id, user_id, blog_id)
VALUES ($1, (SELECT id FROM inserted_user), $2)
"#,
        )
        .bind(5_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
UPDATE blog_editors
SET accepted_at = NOW()
WHERE id IN (4, 5)
"#,
        )
        .execute(&mut *conn)
        .await?;

        // Should have 2 `editor_count` initially
        let result = sqlx::query(
            r#"
SELECT editor_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("editor_count"), 2);

        // Delete the editor
        sqlx::query(
            r#"
DELETE FROM blog_editors
WHERE user_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should not decrement the `editor_count`
        let result = sqlx::query(
            r#"
SELECT editor_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("editor_count"), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog"))]
    async fn should_not_update_editor_count_when_hard_deleting_a_soft_deleted_non_accepted_editor(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Send an editor invite
        sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Insert two more editors so that the `editor_count` is always >= 1,
        // which would allow us to bypass the `editor_count > 1` constraint
        // on the blog when decrementing the `editor_count`.
        sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Editor 1', 'editor_1', 'editor_1@storiny.com')
    RETURNING id
)
INSERT INTO blog_editors (id, user_id, blog_id)
VALUES ($1, (SELECT id FROM inserted_user), $2)
"#,
        )
        .bind(4_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Editor 2', 'editor_2', 'editor_2@storiny.com')
    RETURNING id
)
INSERT INTO blog_editors (id, user_id, blog_id)
VALUES ($1, (SELECT id FROM inserted_user), $2)
"#,
        )
        .bind(5_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
UPDATE blog_editors
SET accepted_at = NOW()
WHERE id IN (4, 5)
"#,
        )
        .execute(&mut *conn)
        .await?;

        // Should have 2 `editor_count` initially
        let result = sqlx::query(
            r#"
SELECT editor_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("editor_count"), 2);

        // Soft-delete the editor
        sqlx::query(
            r#"
UPDATE blog_editors
SET deleted_at = NOW()
WHERE user_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should not decrement the `editor_count`
        let result = sqlx::query(
            r#"
SELECT editor_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("editor_count"), 2);

        // Delete the editor
        sqlx::query(
            r#"
DELETE FROM blog_editors
WHERE user_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should not decrement the `editor_count`
        let result = sqlx::query(
            r#"
SELECT editor_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("editor_count"), 2);

        Ok(())
    }

    // `incoming_blog_requests` setting

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_reject_blog_editor_invite_for_none_incoming_blog_requests_setting(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set `incoming_blog_requests` to none
        sqlx::query(
            r#"
UPDATE users
SET incoming_blog_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingBlogRequest::None as i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
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
            SqlState::EditorNotAcceptingBlogRequest.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog", "following"))]
    async fn can_reject_blog_editor_invite_for_none_incoming_blog_requests_setting_from_following_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set `incoming_blog_requests` to none
        sqlx::query(
            r#"
UPDATE users
SET incoming_blog_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingBlogRequest::None as i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
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
            SqlState::EditorNotAcceptingBlogRequest.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog", "friend"))]
    async fn can_reject_blog_editor_invite_for_none_incoming_blog_requests_setting_from_friend(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set `incoming_blog_requests` to none
        sqlx::query(
            r#"
UPDATE users
SET incoming_blog_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingBlogRequest::None as i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
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
            SqlState::EditorNotAcceptingBlogRequest.to_string()
        );

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_reject_blog_editor_invite_for_following_incoming_blog_requests_setting(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set `incoming_blog_requests` to following
        sqlx::query(
            r#"
UPDATE users
SET incoming_blog_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingBlogRequest::Following as i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
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
            SqlState::EditorNotAcceptingBlogRequest.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog", "following"))]
    async fn can_accept_blog_editor_invite_for_following_incoming_blog_requests_setting_from_following_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set `incoming_blog_requests` to following
        sqlx::query(
            r#"
UPDATE users
SET incoming_blog_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingBlogRequest::Following as i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog", "friend"))]
    async fn can_reject_blog_editor_invite_for_following_incoming_blog_requests_setting_from_friend(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set `incoming_blog_requests` to following
        sqlx::query(
            r#"
UPDATE users
SET incoming_blog_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingBlogRequest::Following as i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
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
            SqlState::EditorNotAcceptingBlogRequest.to_string()
        );

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_reject_blog_editor_invite_for_friends_incoming_blog_requests_setting(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set `incoming_blog_requests` to friends
        sqlx::query(
            r#"
UPDATE users
SET incoming_blog_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingBlogRequest::Friends as i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
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
            SqlState::EditorNotAcceptingBlogRequest.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog", "following"))]
    async fn can_reject_blog_editor_invite_for_friends_incoming_blog_requests_setting_from_following_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set `incoming_blog_requests` to friends
        sqlx::query(
            r#"
UPDATE users
SET incoming_blog_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingBlogRequest::Friends as i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
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
            SqlState::EditorNotAcceptingBlogRequest.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog", "friend"))]
    async fn can_accept_blog_editor_invite_for_friends_incoming_blog_requests_setting_from_friends(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Set `incoming_blog_requests` to friends
        sqlx::query(
            r#"
UPDATE users
SET incoming_blog_requests = $1
WHERE id = $2
"#,
        )
        .bind(IncomingBlogRequest::Friends as i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }

    // Notifications

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_delete_notifications_when_the_editor_is_soft_deleted(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Add an editor
        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
RETURNING id
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Insert a notification
        let insert_result = sqlx::query(
            r#"
INSERT INTO notifications (entity_id, entity_type, notifier_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind(result.get::<i64, _>("id"))
        .bind(0)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Soft-delete the editor
        sqlx::query(
            r#"
UPDATE blog_editors
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(result.get::<i64, _>("id"))
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

    // Hard deletes

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_delete_notification_on_editor_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Add an editor
        let result = sqlx::query(
            r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
RETURNING id
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        // Insert a notification
        let insert_result = sqlx::query(
            r#"
INSERT INTO notifications (entity_id, entity_type, notifier_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind(result.get::<i64, _>("id"))
        .bind(0)
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Delete the editor
        sqlx::query(
            r#"
DELETE FROM blog_editors
WHERE id = $1
"#,
        )
        .bind(result.get::<i64, _>("id"))
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
}
