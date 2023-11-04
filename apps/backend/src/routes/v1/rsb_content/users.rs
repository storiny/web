use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgConnection, PgPool, Postgres, QueryBuilder};
use validator::Validate;

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct User {
    id: i64,
    name: String,
    username: String,
    avatar_id: Option<String>,
    avatar_hex: Option<String>,
    public_flags: i32,
    // Bool
    is_following: bool,
}

pub async fn get_rsb_content_users(
    user_id: Option<i64>,
    pg_pool: &mut PgConnection,
) -> Result<Vec<User>, sqlx::Error> {
    let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
        r#"
        WITH
            rsb_users AS (SELECT
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
        CASE
          WHEN COUNT("u->is_following") = 1
              THEN
              TRUE
          ELSE
              FALSE
        END AS "is_following",
        -- Weights
        COUNT("u->follower_relations") AS "relation_weight"
        "#
    } else {
        r#"
        FALSE AS "is_following"
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
        -- Make sure to handle stories from private users
        AND (
                    NOT u.is_private OR
                    EXISTS (SELECT
                                1
                            FROM
                                friends
                            WHERE
                                 (transmitter_id = u.id AND receiver_id = $1)
                              OR (transmitter_id = $1 AND receiver_id = u.id)
                                     AND accepted_at IS NOT NULL
                           )
                )
            -- Filter out stories from blocked and muted users
        AND u.id NOT IN (SELECT
                             b.blocked_id
                         FROM
                             blocks b
                         WHERE
                             b.blocker_id = $1
                         UNION
                         SELECT
                             m.muted_id
                         FROM
                             mutes m
                         WHERE
                             m.muter_id = $1
                        )
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
        ORDER BY
        "#,
    );

    if user_id.is_some() {
        query_builder.push(
            r#"
            relation_weight DESC
            "#,
        );
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
            is_following
        FROM
            rsb_users
        "#,
    );

    let mut db_query = query_builder.build_query_as::<Story>();

    if user_id.is_some() {
        db_query = db_query.bind(user_id.unwrap());
    }

    db_query.fetch_all(pg_pool).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use actix_web::test;
    use sqlx::PgPool;

    // Logged-out

    #[sqlx::test(fixtures("rsb_content"))]
    async fn can_return_rsb_content_userspool(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = get_rsb_content_users(None, &mut *conn).await?;

        assert_eq!(result.len(), 1);

        Ok(())
    }

    #[sqlx::test(fixtures("rsb_content"))]
    async fn should_not_include_soft_deleted_users(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Should return all the users initially
        let result = get_rsb_content_users(None, &mut *conn).await?;
        assert_eq!(result.len(), 3);

        // Soft-delete one of the users
        let result = sqlx::query(
            r#"
            UPDATE users
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(5_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only two writers
        let result = get_rsb_content_users(None, &mut *conn).await?;
        assert_eq!(result.len(), 2);

        // Recover the user
        let result = sqlx::query(
            r#"
            UPDATE users
            SET deleted_at = NULL
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the users again
        let result = get_rsb_content_users(None, &mut *conn).await?;
        assert_eq!(result.len(), 3);

        Ok(())
    }

    #[sqlx::test(fixtures("rsb_content"))]
    async fn should_not_include_unpublished_stories(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Should return all the stories initially
        let result = get_rsb_content_users(None, &mut *conn).await?;
        assert_eq!(result.len(), 3);

        // Unpublish one of the stories
        let result = sqlx::query(
            r#"
            UPDATE stories
            SET published_at = NULL
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only two stories
        let result = get_rsb_content_users(None, &mut *conn).await?;
        assert_eq!(result.len(), 2);

        // Republish the story
        let result = sqlx::query(
            r#"
            UPDATE stories
            SET published_at = now()
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the stories again
        let result = get_rsb_content_users(None, &mut *conn).await?;
        assert_eq!(result.len(), 3);

        Ok(())
    }

    // Logged-in

    #[sqlx::test(fixtures("rsb_content"))]
    async fn can_return_rsb_content_stories(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let result = get_rsb_content_users(Some(1_i64), &mut *conn).await?;

        assert_eq!(result.len(), 3);

        Ok(())
    }

    #[sqlx::test(fixtures("rsb_content"))]
    async fn should_not_include_soft_deleted_stories(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Should return all the stories initially
        let result = get_rsb_content_users(Some(1_i64), &mut *conn).await?;
        assert_eq!(result.len(), 3);

        // Soft-delete one of the stories
        let result = sqlx::query(
            r#"
            UPDATE stories
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only two stories
        let result = get_rsb_content_users(Some(1_i64), &mut *conn).await?;
        assert_eq!(result.len(), 2);

        // Recover the story
        let result = sqlx::query(
            r#"
            UPDATE stories
            SET deleted_at = NULL
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the stories again
        let result = get_rsb_content_users(Some(1_i64), &mut *conn).await?;
        assert_eq!(result.len(), 3);

        Ok(())
    }

    #[sqlx::test(fixtures("rsb_content"))]
    async fn should_not_include_unpublished_stories(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;

        // Should return all the stories initially
        let result = get_rsb_content_users(Some(1_i64), &mut *conn).await?;
        assert_eq!(result.len(), 3);

        // Unpublish one of the stories
        let result = sqlx::query(
            r#"
            UPDATE stories
            SET published_at = NULL
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return only two stories
        let result = get_rsb_content_users(Some(1_i64), &mut *conn).await?;
        assert_eq!(result.len(), 2);

        // Republish the story
        let result = sqlx::query(
            r#"
            UPDATE stories
            SET published_at = now()
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Should return all the stories again
        let result = get_rsb_content_users(Some(1_i64), &mut *conn).await?;
        assert_eq!(result.len(), 3);

        Ok(())
    }
}
