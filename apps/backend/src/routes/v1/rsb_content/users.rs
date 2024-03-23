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
use uuid::Uuid;

#[derive(Debug, FromRow, Serialize, Deserialize)]
pub struct User {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    name: String,
    username: String,
    avatar_id: Option<Uuid>,
    avatar_hex: Option<String>,
    public_flags: i32,
    // Bool
    is_following: bool,
    is_muted: bool,
}

#[tracing::instrument(skip_all, fields(user_id), err)]
pub async fn get_rsb_content_users(
    user_id: Option<i64>,
    pg_pool: &Pool<Postgres>,
) -> Result<Vec<User>, sqlx::Error> {
    let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
        r#"
WITH rsb_users AS (
    SELECT
        u.id,
        u.name,
        u.username,
        u.avatar_id,
        u.avatar_hex,
        u.public_flags,
"#,
    );

    query_builder.push(if user_id.is_some() {
        r#"
-- Boolean flags
"u->is_following".follower_id IS NOT NULL AS "is_following",
"u->is_muted".muter_id IS NOT NULL AS "is_muted",
-- Weights
COUNT("u->follower_relations") AS "relation_weight"
"#
    } else {
        r#"
FALSE AS "is_following",
FALSE AS "is_muted"
"#
    });

    query_builder.push(
        r#"
FROM
    users u
"#,
    );

    if user_id.is_some() {
        query_builder.push(
            r#"
-- Join users followed by the current user
LEFT OUTER JOIN relations AS "current_user->following"
      ON "current_user->following".follower_id = $1
      AND "current_user->following".deleted_at IS NULL
--          
-- Join users followed by the followed users of the current user
LEFT OUTER JOIN relations AS "u->follower_relations"
      ON "u->follower_relations".follower_id =
         "current_user->following".followed_id
      AND "u->follower_relations".followed_id = u.id
      AND "u->follower_relations".deleted_at IS NULL
--          
-- Boolean following flag
LEFT OUTER JOIN relations AS "u->is_following"
      ON "u->is_following".followed_id = u.id
      AND "u->is_following".follower_id = $1
      AND "u->is_following".deleted_at IS NULL
--
-- Boolean muted flag
LEFT OUTER JOIN mutes AS "u->is_muted"
    ON "u->is_muted".muted_id = u.id
    AND "u->is_muted".muter_id = $1
    AND "u->is_muted".deleted_at IS NULL
"#,
        );
    }

    query_builder.push(
        r#"
WHERE
    u.deactivated_at IS NULL
AND u.deleted_at IS NULL
"#,
    );

    query_builder.push(if user_id.is_some() {
        r#"
-- Make sure to handle private users
AND (
    NOT u.is_private OR
    EXISTS (
        SELECT 1
        FROM friends
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
-- Filter out blocked users
AND NOT EXISTS (
    SELECT 1 FROM blocks b
    WHERE b.blocker_id = $1
        AND b.blocked_id = u.id
)
-- Filter out muted users
AND NOT EXISTS (
    SELECT 1 FROM mutes m
    WHERE m.muter_id = $1
        AND m.muted_id = u.id
)
-- Do not include the current user
AND u.id <> $1
"#
    } else {
        r#"
-- Ignore private users
AND u.is_private IS FALSE
"#
    });

    query_builder.push(
        r#"
GROUP BY
    u.id,
    u.follower_count,
    u.created_at
"#,
    );

    if user_id.is_some() {
        query_builder.push(",");
        query_builder.push(
            r#"
"u->is_following".follower_id,
"u->is_muted".muter_id
"#,
        );
    }

    query_builder.push(r#" ORDER BY "#);

    if user_id.is_some() {
        query_builder.push(r#" relation_weight DESC "#);
        query_builder.push(",");
    }

    query_builder.push(
        r#"
      u.follower_count DESC,
      u.created_at     DESC
  LIMIT 5
)
SELECT
    id,
    name,
    username,
    avatar_id,
    avatar_hex,
    public_flags,
    is_following,
    is_muted
FROM
    rsb_users
"#,
    );

    let mut db_query = query_builder.build_query_as::<User>();

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
    async fn can_return_rsb_content_users(pool: PgPool) -> sqlx::Result<()> {
        let result = get_rsb_content_users(None, &pool).await?;

        assert_eq!(result.len(), 2);
        assert!(result.iter().all(|user| !user.is_following));

        Ok(())
    }

    #[sqlx::test(fixtures("rsb_content"))]
    async fn should_not_include_soft_deleted_users(pool: PgPool) -> sqlx::Result<()> {
        // Should return all the users initially.
        let result = get_rsb_content_users(None, &pool).await?;
        assert_eq!(result.len(), 2);

        // Soft-delete one of the users.
        let result = sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&pool)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one user.
        let result = get_rsb_content_users(None, &pool).await?;
        assert_eq!(result.len(), 1);

        // Recover the user.
        let result = sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&pool)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the users again.
        let result = get_rsb_content_users(None, &pool).await?;
        assert_eq!(result.len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("rsb_content"))]
    async fn should_not_include_deactivated_users(pool: PgPool) -> sqlx::Result<()> {
        // Should return all the users initially.
        let result = get_rsb_content_users(None, &pool).await?;
        assert_eq!(result.len(), 2);

        // Deactivate one of the users.
        let result = sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&pool)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only one user.
        let result = get_rsb_content_users(None, &pool).await?;
        assert_eq!(result.len(), 1);

        // Reactivate the user.
        let result = sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&pool)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the users again.
        let result = get_rsb_content_users(None, &pool).await?;
        assert_eq!(result.len(), 2);

        Ok(())
    }

    // Logged-in

    #[sqlx::test(fixtures("rsb_content"))]
    async fn can_return_rsb_content_users_when_logged_in(pool: PgPool) -> sqlx::Result<()> {
        let result = get_rsb_content_users(Some(1_i64), &pool).await?;

        // 1 = Does not return the current user.
        assert_eq!(result.len(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("rsb_content"))]
    async fn can_return_is_following_flag_for_rsb_content_users_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = get_rsb_content_users(Some(1_i64), &pool).await?;

        // Should be `false` initially.
        assert!(result.iter().all(|user| !user.is_following));

        // Follow the user.
        let result = sqlx::query(
            r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let result = get_rsb_content_users(Some(1_i64), &pool).await?;

        // Should be `true`.
        assert!(result.iter().all(|user| user.is_following));

        Ok(())
    }

    #[sqlx::test(fixtures("rsb_content"))]
    async fn can_return_is_muted_flag_for_rsb_content_users_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = get_rsb_content_users(Some(1_i64), &pool).await?;

        // Should be `false` initially.
        assert!(result.iter().all(|user| !user.is_muted));

        // Mute the user.
        let result = sqlx::query(
            r#"
INSERT INTO mutes (muter_id, muted_id)
VALUES ($1, $2)
"#,
        )
        .bind(1_i64)
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let result = get_rsb_content_users(Some(1_i64), &pool).await?;

        // Should be `true`.
        assert!(result.iter().all(|user| user.is_muted));

        Ok(())
    }

    #[sqlx::test(fixtures("rsb_content"))]
    async fn should_not_include_soft_deleted_users_when_logged_in(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        // Should return the user initially.
        let result = get_rsb_content_users(Some(1_i64), &pool).await?;
        assert_eq!(result.len(), 1);

        // Soft-delete the user.
        let result = sqlx::query(
            r#"
UPDATE users
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&pool)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should not return any user.
        let result = get_rsb_content_users(Some(1_i64), &pool).await?;
        assert!(result.is_empty());

        // Recover the user.
        let result = sqlx::query(
            r#"
UPDATE users
SET deleted_at = NULL
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&pool)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return the user again.
        let result = get_rsb_content_users(Some(1_i64), &pool).await?;
        assert_eq!(result.len(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("rsb_content"))]
    async fn should_not_include_deactivated_users_when_logged_in(pool: PgPool) -> sqlx::Result<()> {
        // Should return the user initially.
        let result = get_rsb_content_users(Some(1_i64), &pool).await?;
        assert_eq!(result.len(), 1);

        // Deactivate the user.
        let result = sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&pool)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should not return any user.
        let result = get_rsb_content_users(Some(1_i64), &pool).await?;
        assert!(result.is_empty());

        // Reactivate the user.
        let result = sqlx::query(
            r#"
UPDATE users
SET deactivated_at = NULL
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&pool)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return the user again.
        let result = get_rsb_content_users(Some(1_i64), &pool).await?;
        assert_eq!(result.len(), 1);

        Ok(())
    }
}
