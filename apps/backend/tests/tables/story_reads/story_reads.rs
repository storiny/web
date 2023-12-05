#[cfg(test)]
mod tests {
    use sqlx::{
        PgPool,
        Row,
    };
    use storiny::{
        constants::sql_states::SqlState,
        grpc::defs::login_activity_def::v1::DeviceType,
    };

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_read_a_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = sqlx::query(
            r#"
INSERT INTO story_reads (
    hostname,
    country_code,
    duration,
    device,
    user_id,
    story_id
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6
)
"#,
        )
        .bind("storiny.com")
        .bind("XX")
        .bind(60_i16)
        .bind(DeviceType::Computer as i16)
        .bind(1_i64)
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_reject_story_read_for_soft_deleted_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Soft-delete the story
        sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO story_reads(country_code, story_id)
VALUES ($1, $2)
"#,
        )
        .bind("XX")
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

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_reject_story_read_for_unpublished_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Unpublish the story
        sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        let result = sqlx::query(
            r#"
INSERT INTO story_reads(country_code, story_id)
VALUES ($1, $2)
"#,
        )
        .bind("XX")
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

    #[sqlx::test(fixtures("user", "story"))]
    async fn can_increment_read_count_on_story_when_inserting_story_read(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Read the story
        let insert_result = sqlx::query(
            r#"
INSERT INTO story_reads(country_code, story_id)
VALUES ($1, $2)
"#,
        )
        .bind("XX")
        .bind(3_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 1);

        // Should increment `read_count` on story
        let result = sqlx::query(
            r#"
SELECT read_count FROM stories
WHERE id = $1
"#,
        )
        .bind(3_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<i32, _>("read_count"), 1);

        Ok(())
    }
}
