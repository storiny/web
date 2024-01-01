use serde::{
    Deserialize,
    Serialize,
};

use sqlx::{
    types::Json,
    FromRow,
    Pool,
    Postgres,
    QueryBuilder,
};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
struct User {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    name: String,
    username: String,
    avatar_id: Option<Uuid>,
    avatar_hex: Option<String>,
    public_flags: i32,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
pub struct Story {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    slug: String,
    title: String,
    read_count: i32,
    // Joins
    user: Json<User>,
}

#[tracing::instrument(skip_all, fields(user_id), err)]
pub async fn get_rsb_content_stories(
    user_id: Option<i64>,
    pg_pool: &Pool<Postgres>,
) -> Result<Vec<Story>, sqlx::Error> {
    let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
        r#"
WITH rsb_stories AS (
    SELECT
        -- Story
        s.id,
        s.title,
        s.slug,
        s.read_count,
        -- User
        JSON_BUILD_OBJECT(
            'id', u.id,
            'name', u.name,
            'username', u.username,
            'avatar_id', u.avatar_id,
            'avatar_hex', u.avatar_hex,
            'public_flags', u.public_flags
        ) AS "user",
        -- Weights
        s.published_at::DATE AS "published_at_date_only"
"#,
    );

    if user_id.is_some() {
        query_builder.push(",");
        query_builder.push(
            r#"
COUNT(DISTINCT "s->story_tags->follower") AS "followed_tags_weight"
"#,
        );
    }

    query_builder.push(
        r#"
FROM
    stories s
        INNER JOIN users u
           ON u.id = s.user_id
"#,
    );

    query_builder.push(if user_id.is_some() {
        r#"
-- Make sure to handle stories from private users
AND (
    NOT u.is_private OR
    EXISTS (
        SELECT 1 FROM friends
        WHERE
            (
                    (transmitter_id = u.id AND receiver_id = $1)
                OR
                    (transmitter_id = $1 AND receiver_id = u.id)
            )
            AND accepted_at IS NOT NULL
            AND deleted_at IS NULL
    )
)
-- Filter out stories from blocked users
AND NOT EXISTS (
    SELECT 1 FROM blocks b
    WHERE b.blocker_id = $1
        AND b.blocked_id = u.id
)
-- Filter out stories from muted users
AND NOT EXISTS (
    SELECT 1 FROM mutes m
    WHERE m.muter_id = $1
        AND m.muted_id = u.id
)
"#
    } else {
        r#"
-- Ignore stories from private users
AND u.is_private IS FALSE
"#
    });

    query_builder.push(
        r#"
-- Join story tags
LEFT OUTER JOIN story_tags AS "s->story_tags"
    ON "s->story_tags".story_id = s.id
"#,
    );

    if user_id.is_some() {
        query_builder.push(
            r#"
-- Join followed tags for current user
LEFT OUTER JOIN tag_followers AS "s->story_tags->follower"
    ON "s->story_tags->follower".tag_id = "s->story_tags".tag_id
    AND "s->story_tags->follower".user_id = $1
    AND "s->story_tags->follower".deleted_at IS NULL
"#,
        );
    }

    query_builder.push(
        r#"
WHERE
      -- Public
      s.visibility = 2
  AND s.published_at IS NOT NULL
  AND s.deleted_at IS NULL
GROUP BY
    s.id,
    u.id,
    s.published_at,
    s.read_count
ORDER BY
    published_at_date_only DESC,
"#,
    );

    if user_id.is_some() {
        query_builder.push(r#"followed_tags_weight DESC"#);
        query_builder.push(",");
    }

    query_builder.push(
        r#"
        s.read_count DESC
    LIMIT 3
)
SELECT
    id,
    title,
    slug,
    read_count,
    "user"
FROM
    rsb_stories
"#,
    );

    let mut db_query = query_builder.build_query_as::<Story>();

    if let Some(user_id) = user_id {
        db_query = db_query.bind(user_id);
    }

    db_query.fetch_all(pg_pool).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::PgPool;

    // Logged-out

    #[sqlx::test(fixtures("rsb_content"))]
    async fn can_return_rsb_content_stories(pool: PgPool) -> sqlx::Result<()> {
        let result = get_rsb_content_stories(None, &pool).await?;

        assert_eq!(result.len(), 3);

        Ok(())
    }

    #[sqlx::test(fixtures("rsb_content"))]
    async fn should_not_include_soft_deleted_stories(pool: PgPool) -> sqlx::Result<()> {
        // Should return all the stories initially.
        let result = get_rsb_content_stories(None, &pool).await?;
        assert_eq!(result.len(), 3);

        // Soft-delete one of the stories.
        let result = sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&pool)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only two stories.
        let result = get_rsb_content_stories(None, &pool).await?;
        assert_eq!(result.len(), 2);

        // Recover the story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&pool)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the stories again.
        let result = get_rsb_content_stories(None, &pool).await?;
        assert_eq!(result.len(), 3);

        Ok(())
    }

    #[sqlx::test(fixtures("rsb_content"))]
    async fn should_not_include_unpublished_stories(pool: PgPool) -> sqlx::Result<()> {
        // Should return all the stories initially.
        let result = get_rsb_content_stories(None, &pool).await?;
        assert_eq!(result.len(), 3);

        // Unpublish one of the stories.
        let result = sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&pool)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only two stories.
        let result = get_rsb_content_stories(None, &pool).await?;
        assert_eq!(result.len(), 2);

        // Republish the story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&pool)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the stories again.
        let result = get_rsb_content_stories(None, &pool).await?;
        assert_eq!(result.len(), 3);

        Ok(())
    }

    // Logged-in

    #[sqlx::test(fixtures("rsb_content"))]
    async fn can_return_rsb_content_stories_when_logged_in(pool: PgPool) -> sqlx::Result<()> {
        let result = get_rsb_content_stories(Some(1_i64), &pool).await?;

        assert_eq!(result.len(), 3);

        Ok(())
    }

    #[sqlx::test(fixtures("rsb_content"))]
    async fn should_not_include_soft_deleted_stories_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        // Should return all the stories initially.
        let result = get_rsb_content_stories(Some(1_i64), &pool).await?;
        assert_eq!(result.len(), 3);

        // Soft-delete one of the stories.
        let result = sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&pool)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only two stories.
        let result = get_rsb_content_stories(Some(1_i64), &pool).await?;
        assert_eq!(result.len(), 2);

        // Recover the story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&pool)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the stories again.
        let result = get_rsb_content_stories(Some(1_i64), &pool).await?;
        assert_eq!(result.len(), 3);

        Ok(())
    }

    #[sqlx::test(fixtures("rsb_content"))]
    async fn should_not_include_unpublished_stories_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        // Should return all the stories initially.
        let result = get_rsb_content_stories(Some(1_i64), &pool).await?;
        assert_eq!(result.len(), 3);

        // Unpublish one of the stories.
        let result = sqlx::query(
            r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&pool)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only two stories.
        let result = get_rsb_content_stories(Some(1_i64), &pool).await?;
        assert_eq!(result.len(), 2);

        // Republish the story.
        let result = sqlx::query(
            r#"
UPDATE stories
SET published_at = NOW()
WHERE id = $1
"#,
        )
        .bind(4_i64)
        .execute(&pool)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the stories again.
        let result = get_rsb_content_stories(Some(1_i64), &pool).await?;
        assert_eq!(result.len(), 3);

        Ok(())
    }
}
