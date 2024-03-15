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
    async fn can_send_a_writer_request(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
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

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_reject_an_illegal_writer(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Case when the receiver ID is same as the ID of the owner of the blog.
        let result = sqlx::query(
            r#"
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES ($1, $2, $3)
"#,
        )
        .bind(2_i64)
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
            SqlState::IllegalWriter.to_string()
        );

        // Case when the receiver ID is same as the transmitter ID.
        let result = sqlx::query(
            r#"
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES ($1, $2, $3)
"#,
        )
        .bind(2_i64)
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
            SqlState::IllegalWriter.to_string()
        );

        // Case when the receiver is already an editor in the blog.
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
        .await;

        // Should reject with the correct SQLSTATE.
        assert_eq!(
            result
                .unwrap_err()
                .into_database_error()
                .unwrap()
                .code()
                .unwrap(),
            SqlState::IllegalWriter.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_reject_overflowing_writers(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        let result = sqlx::query(
            r#"
WITH inserted_users AS (
    INSERT INTO users (id, name, username, email)
    VALUES
        (4, 'Writer 1', 'writer_1', 'writer_1@storiny.com'),
        (5, 'Writer 2', 'writer_2', 'writer_2@storiny.com'),
        (6, 'Writer 3', 'writer_3', 'writer_3@storiny.com'),
        (7, 'Writer 4', 'writer_4', 'writer_4@storiny.com'),
        (8, 'Writer 5', 'writer_5', 'writer_5@storiny.com'),
        (9, 'Writer 6', 'writer_6', 'writer_6@storiny.com'),
        (10, 'Writer 7', 'writer_7', 'writer_7@storiny.com'),
        (11, 'Writer 8', 'writer_8', 'writer_8@storiny.com'),
        (12, 'Writer 9', 'writer_9', 'writer_9@storiny.com'),
        (13, 'Writer 10', 'writer_10', 'writer_10@storiny.com')
)
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES
    ($1, 4, $2),
    ($1, 5, $2),
    ($1, 6, $2),
    ($1, 7, $2),
    ($1, 8, $2),
    ($1, 9, $2),
    ($1, 10, $2),
    ($1, 11, $2),
    ($1, 12, $2),
    ($1, 13, $2)
"#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 10);

        // Force overflow.
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
        .await;

        // Should reject with the correct SQLSTATE.
        assert_eq!(
            result
                .unwrap_err()
                .into_database_error()
                .unwrap()
                .code()
                .unwrap(),
            SqlState::WriterOverflow.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_handle_overflowing_writers_for_a_blog_with_plus_features(
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

        // Add writers.
        let result = sqlx::query(
            r#"
WITH inserted_users AS (
    INSERT INTO users (id, name, username, email)
    VALUES
        (4, 'Writer 1', 'writer_1', 'writer_1@storiny.com'),
        (5, 'Writer 2', 'writer_2', 'writer_2@storiny.com'),
        (6, 'Writer 3', 'writer_3', 'writer_3@storiny.com'),
        (7, 'Writer 4', 'writer_4', 'writer_4@storiny.com'),
        (8, 'Writer 5', 'writer_5', 'writer_5@storiny.com'),
        (9, 'Writer 6', 'writer_6', 'writer_6@storiny.com'),
        (10, 'Writer 7', 'writer_7', 'writer_7@storiny.com'),
        (11, 'Writer 8', 'writer_8', 'writer_8@storiny.com'),
        (12, 'Writer 9', 'writer_9', 'writer_9@storiny.com'),
        (13, 'Writer 10', 'writer_10', 'writer_10@storiny.com')
)
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES
    ($1, 4, $2),
    ($1, 5, $2),
    ($1, 6, $2),
    ($1, 7, $2),
    ($1, 8, $2),
    ($1, 9, $2),
    ($1, 10, $2),
    ($1, 11, $2),
    ($1, 12, $2),
    ($1, 13, $2)
"#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 10);

        // Force overflow.
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

        // Should accept the writer.
        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_reject_blog_writer_invite_for_private_writer(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Make the writer private.
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
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES ($1, $2, $3)
"#,
        )
        .bind(1_i64)
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
            SqlState::WriterNotAcceptingBlogRequest.to_string()
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

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_reject_blog_writer_invite_for_soft_deleted_writer(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Soft-delete the writer
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
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES ($1, $2, $3)
"#,
        )
        .bind(1_i64)
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
    async fn can_reject_blog_writer_invite_for_deactivated_writer(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Deactivate the writer
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
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES ($1, $2, $3)
"#,
        )
        .bind(1_i64)
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
    async fn can_reject_blog_writer_invite_for_soft_deleted_blog(pool: PgPool) -> sqlx::Result<()> {
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
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES ($1, $2, $3)
"#,
        )
        .bind(1_i64)
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

    // `writer_count` counter cache

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_increment_writer_count_when_accepting_a_writer_invite(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Send a writer invite
        sqlx::query(
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

        // Should not increment `writer_count`
        let result = sqlx::query(
            r#"
SELECT writer_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("writer_count"), 0);

        // Accept the writer invite
        sqlx::query(
            r#"
UPDATE blog_writers
SET accepted_at = NOW()
WHERE receiver_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should increment the `writer_count`
        let result = sqlx::query(
            r#"
SELECT writer_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("writer_count"), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_update_writer_count_when_soft_deleting_and_restoring_the_writer(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Send a writer invite
        sqlx::query(
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

        // Accept the writer invite
        sqlx::query(
            r#"
UPDATE blog_writers
SET accepted_at = NOW()
WHERE receiver_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should have 1 `writer_count` initially
        let result = sqlx::query(
            r#"
SELECT writer_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("writer_count"), 1);

        // Soft-delete the writer
        sqlx::query(
            r#"
UPDATE blog_writers
SET deleted_at = NOW()
WHERE receiver_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement the `writer_count`
        let result = sqlx::query(
            r#"
SELECT writer_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("writer_count"), 0);

        // Restore the writer
        sqlx::query(
            r#"
UPDATE blog_writers
SET deleted_at = NULL
WHERE receiver_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should increment the `writer_count`
        let result = sqlx::query(
            r#"
SELECT writer_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("writer_count"), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_update_writer_count_when_hard_deleting_the_writer(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Send a writer request
        sqlx::query(
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

        // Accept the writer invite
        sqlx::query(
            r#"
UPDATE blog_writers
SET accepted_at = NOW()
WHERE receiver_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should have 1 `writer_count` initially
        let result = sqlx::query(
            r#"
SELECT writer_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("writer_count"), 1);

        // Delete the writer
        sqlx::query(
            r#"
DELETE FROM blog_writers
WHERE receiver_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement the `writer_count`
        let result = sqlx::query(
            r#"
SELECT writer_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("writer_count"), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog"))]
    async fn should_not_update_writer_count_when_hard_deleting_a_soft_deleted_writer(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Send a writer invite
        sqlx::query(
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

        // Accept the writer invite
        sqlx::query(
            r#"
UPDATE blog_writers
SET accepted_at = NOW()
WHERE receiver_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Insert two more writers so that the `writer_count` is always >= 1,
        // which would allow us to bypass the `writer_count > 1` constraint
        // on the blog when decrementing the `writer_count`.
        sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Writer 1', 'writer_1', 'writer_1@storiny.com')
    RETURNING id
)
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES ($1, (SELECT id FROM inserted_user), $2)
"#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Writer 2', 'writer_2', 'writer_2@storiny.com')
    RETURNING id
)
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES ($1, (SELECT id FROM inserted_user), $2)
"#,
        )
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
UPDATE blog_writers
SET accepted_at = NOW()
WHERE blog_id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should have 3 `writer_count` initially
        let result = sqlx::query(
            r#"
SELECT writer_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("writer_count"), 3);

        // Soft-delete the writer
        sqlx::query(
            r#"
UPDATE blog_writers
SET deleted_at = NOW()
WHERE receiver_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should decrement the `writer_count`
        let result = sqlx::query(
            r#"
SELECT writer_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("writer_count"), 2);

        // Delete the writer
        sqlx::query(
            r#"
DELETE FROM blog_writers
WHERE receiver_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should not decrement the `writer_count` any further
        let result = sqlx::query(
            r#"
SELECT writer_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("writer_count"), 2);

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user", "blog"))]
    async fn should_not_increment_writer_count_when_inserting_a_writer_invite(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Send a writer invite
        sqlx::query(
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

        // Should not increment `writer_count`
        let result = sqlx::query(
            r#"
SELECT writer_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("writer_count"), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog"))]
    async fn should_not_update_writer_count_when_soft_deleting_and_restoring_the_non_accepted_writer(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Send a writer invite
        sqlx::query(
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

        // Soft-delete the writer
        sqlx::query(
            r#"
UPDATE blog_writers
SET deleted_at = NOW()
WHERE receiver_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Restore the writer
        sqlx::query(
            r#"
UPDATE blog_writers
SET deleted_at = NULL
WHERE receiver_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should not increment the `writer_count`
        let result = sqlx::query(
            r#"
SELECT writer_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("writer_count"), 0);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog"))]
    async fn should_not_update_writer_count_when_hard_deleting_the_non_accepted_writer(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Send a writer invite
        sqlx::query(
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

        // Insert two more writers so that the `writer_count` is always >= 1,
        // which would allow us to bypass the `writer_count > 1` constraint
        // on the blog when decrementing the `writer_count`.
        sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Writer 1', 'writer_1', 'writer_1@storiny.com')
    RETURNING id
)
INSERT INTO blog_writers (id, transmitter_id, receiver_id, blog_id)
VALUES ($1, $2, (SELECT id FROM inserted_user), $3)
"#,
        )
        .bind(4_i64)
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Writer 2', 'writer_2', 'writer_2@storiny.com')
    RETURNING id
)
INSERT INTO blog_writers (id, transmitter_id, receiver_id, blog_id)
VALUES ($1, $2, (SELECT id FROM inserted_user), $3)
"#,
        )
        .bind(5_i64)
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
UPDATE blog_writers
SET accepted_at = NOW()
WHERE id IN (4, 5)
"#,
        )
        .execute(&mut *conn)
        .await?;

        // Should have 2 `writer_count` initially
        let result = sqlx::query(
            r#"
SELECT writer_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("writer_count"), 2);

        // Delete the writer
        sqlx::query(
            r#"
DELETE FROM blog_writers
WHERE receiver_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should not decrement the `writer_count`
        let result = sqlx::query(
            r#"
SELECT writer_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("writer_count"), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog"))]
    async fn should_not_update_writer_count_when_hard_deleting_a_soft_deleted_non_accepted_writer(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Send a writer invite
        sqlx::query(
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

        // Insert two more writers so that the `writer_count` is always >= 1,
        // which would allow us to bypass the `writer_count > 1` constraint
        // on the blog when decrementing the `writer_count`.
        sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Writer 1', 'writer_1', 'writer_1@storiny.com')
    RETURNING id
)
INSERT INTO blog_writers (id, transmitter_id, receiver_id, blog_id)
VALUES ($1, $2, (SELECT id FROM inserted_user), $3)
"#,
        )
        .bind(4_i64)
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Writer 2', 'writer_2', 'writer_2@storiny.com')
    RETURNING id
)
INSERT INTO blog_writers (id, transmitter_id, receiver_id, blog_id)
VALUES ($1, $2, (SELECT id FROM inserted_user), $3)
"#,
        )
        .bind(5_i64)
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        sqlx::query(
            r#"
UPDATE blog_writers
SET accepted_at = NOW()
WHERE id IN (4, 5)
"#,
        )
        .execute(&mut *conn)
        .await?;

        // Should have 2 `writer_count` initially
        let result = sqlx::query(
            r#"
SELECT writer_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("writer_count"), 2);

        // Soft-delete the writer
        sqlx::query(
            r#"
UPDATE blog_writers
SET deleted_at = NOW()
WHERE receiver_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should not decrement the `writer_count`
        let result = sqlx::query(
            r#"
SELECT writer_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("writer_count"), 2);

        // Delete the writer
        sqlx::query(
            r#"
DELETE FROM blog_writers
WHERE receiver_id = $1 AND blog_id = $2
"#,
        )
        .bind(2_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        // Should not decrement the `writer_count`
        let result = sqlx::query(
            r#"
SELECT writer_count FROM blogs
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("writer_count"), 2);

        Ok(())
    }

    // `incoming_blog_requests` setting

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_reject_blog_writer_invite_for_none_incoming_blog_requests_setting(
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
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES ($1, $2, $3)
"#,
        )
        .bind(1_i64)
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
            SqlState::WriterNotAcceptingBlogRequest.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog", "following"))]
    async fn can_reject_blog_writer_invite_for_none_incoming_blog_requests_setting_from_following_user(
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
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES ($1, $2, $3)
"#,
        )
        .bind(1_i64)
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
            SqlState::WriterNotAcceptingBlogRequest.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog", "friend"))]
    async fn can_reject_blog_writer_invite_for_none_incoming_blog_requests_setting_from_friend(
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
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES ($1, $2, $3)
"#,
        )
        .bind(1_i64)
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
            SqlState::WriterNotAcceptingBlogRequest.to_string()
        );

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_reject_blog_writer_invite_for_following_incoming_blog_requests_setting(
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
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES ($1, $2, $3)
"#,
        )
        .bind(1_i64)
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
            SqlState::WriterNotAcceptingBlogRequest.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog", "following"))]
    async fn can_accept_blog_writer_invite_for_following_incoming_blog_requests_setting_from_following_user(
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

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog", "friend"))]
    async fn can_reject_blog_writer_invite_for_following_incoming_blog_requests_setting_from_friend(
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
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES ($1, $2, $3)
"#,
        )
        .bind(1_i64)
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
            SqlState::WriterNotAcceptingBlogRequest.to_string()
        );

        Ok(())
    }

    //

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_reject_blog_writer_invite_for_friends_incoming_blog_requests_setting(
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
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES ($1, $2, $3)
"#,
        )
        .bind(1_i64)
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
            SqlState::WriterNotAcceptingBlogRequest.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog", "following"))]
    async fn can_reject_blog_writer_invite_for_friends_incoming_blog_requests_setting_from_following_user(
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
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES ($1, $2, $3)
"#,
        )
        .bind(1_i64)
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
            SqlState::WriterNotAcceptingBlogRequest.to_string()
        );

        Ok(())
    }

    #[sqlx::test(fixtures("user", "blog", "friend"))]
    async fn can_accept_blog_writer_invite_for_friends_incoming_blog_requests_setting_from_friends(
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

        Ok(())
    }

    // Notifications

    #[sqlx::test(fixtures("user", "blog"))]
    async fn can_delete_notifications_when_the_writer_is_soft_deleted(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Add a writer
        let result = sqlx::query(
            r#"
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind(1_i64)
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

        // Soft-delete the writer
        sqlx::query(
            r#"
UPDATE blog_writers
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
    async fn can_delete_notification_on_writer_hard_delete(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Add a writer
        let result = sqlx::query(
            r#"
INSERT INTO blog_writers (transmitter_id, receiver_id, blog_id)
VALUES ($1, $2, $3)
RETURNING id
"#,
        )
        .bind(1_i64)
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

        // Delete the writer
        sqlx::query(
            r#"
DELETE FROM blog_writers
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
