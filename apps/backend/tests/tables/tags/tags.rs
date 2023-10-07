#[cfg(test)]
mod tests {
    use sqlx::PgPool;
    use storiny::models::tag::Tag;
    use time::OffsetDateTime;

    /// Returns a sample tag
    fn get_default_tag() -> Tag {
        Tag {
            id: 0,
            name: "some-tag".to_string(),
            follower_count: 0,
            story_count: 0,
            created_at: OffsetDateTime::now_utc(),
        }
    }

    #[sqlx::test]
    async fn can_insert_a_valid_tag(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let tag = get_default_tag();
        let result = sqlx::query(
            r#"
INSERT INTO tags (name, follower_count, story_count, created_at)
VALUES            ($1, $2, $3, $4);
               "#,
        )
        .bind(&tag.name)
        .bind(&tag.follower_count)
        .bind(&tag.story_count)
        .bind(&tag.created_at)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);
        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_valid_tag_names(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let tag = get_default_tag();
        let cases: Vec<&str> = vec!["abcd", "ab-cd", "0abcd", "ab0cd", "abcd0"];

        for case in cases {
            let result = sqlx::query(
                r#"
INSERT INTO tags (name, follower_count, story_count, created_at)
VALUES            ($1, $2, $3, $4);
               "#,
            )
            .bind(case.to_string())
            .bind(&tag.follower_count)
            .bind(&tag.story_count)
            .bind(&tag.created_at)
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);
        }

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_invalid_tag_names(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let tag = get_default_tag();
        let cases: Vec<&str> = vec!["", "ABCD", "a@", "abcd#", "abcD", "ab_cd"];

        for case in cases {
            let result = sqlx::query(
                r#"
INSERT INTO tags (name, follower_count, story_count, created_at)
VALUES            ($1, $2, $3, $4);
               "#,
            )
            .bind(case.to_string())
            .bind(tag.follower_count)
            .bind(tag.story_count)
            .bind(tag.created_at)
            .execute(&mut *conn)
            .await;

            assert!(matches!(result.unwrap_err(), sqlx::Error::Database(_)));
        }

        Ok(())
    }
}
