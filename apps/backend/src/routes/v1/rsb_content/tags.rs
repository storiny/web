use serde::{
    Deserialize,
    Serialize,
};
use sqlx::{
    FromRow,
    Pool,
    Postgres,
    QueryBuilder,
};

#[derive(Debug, FromRow, Serialize, Deserialize)]
pub struct Tag {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    name: String,
    follower_count: i32,
    story_count: i32,
}

#[tracing::instrument(skip_all, fields(user_id), err)]
pub async fn get_rsb_content_tags(
    user_id: Option<i64>,
    pg_pool: &Pool<Postgres>,
) -> Result<Vec<Tag>, sqlx::Error> {
    let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
        r#"
WITH rsb_tags AS (
    SELECT
         -- Tag
         t.id,
         t.name,
         t.story_count,
         t.follower_count
"#,
    );

    if user_id.is_some() {
        query_builder.push(",");
        query_builder.push(
            r#"
-- Weights
COUNT("st") AS "history_weight"
"#,
        );
    }

    query_builder.push(
        r#"
FROM
    tags t
"#,
    );

    if user_id.is_some() {
        query_builder.push(
            r#"
LEFT OUTER JOIN story_tags AS st
    ON st.tag_id = t.id
    AND st.story_id = ANY (
        SELECT story_id
        FROM histories h
        WHERE
            h.user_id = $1
            AND h.deleted_at IS NULL
        ORDER BY
            h.created_at DESC
        LIMIT 50
    )
GROUP BY
    t.id,
    t.follower_count,
    t.story_count,
    t.created_at
"#,
        );
    }

    query_builder.push(r#" ORDER BY "#);

    if user_id.is_some() {
        query_builder.push(r#"history_weight DESC"#);
        query_builder.push(",");
    }

    query_builder.push(
        r#"
         t.follower_count DESC,
         t.story_count    DESC,
         t.created_at     DESC
     LIMIT 8
    )
SELECT
    id,
    name,
    follower_count,
    story_count
FROM
    rsb_tags
"#,
    );

    let mut db_query = query_builder.build_query_as::<Tag>();

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
    async fn can_return_rsb_content_tags(pool: PgPool) -> sqlx::Result<()> {
        let result = get_rsb_content_tags(None, &pool).await?;

        assert_eq!(result.len(), 3);

        Ok(())
    }

    // Logged-in

    #[sqlx::test(fixtures("rsb_content"))]
    async fn can_return_rsb_content_tags_when_logged_in(pool: PgPool) -> sqlx::Result<()> {
        let result = get_rsb_content_tags(Some(1_i64), &pool).await?;

        assert_eq!(result.len(), 3);

        Ok(())
    }
}
