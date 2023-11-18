use crate::grpc::defs::comment_def::v1::{GetCommentRequest, GetCommentResponse};
use crate::grpc::defs::user_def::v1::BareUser;
use crate::grpc::service::GrpcService;
use serde::Deserialize;
use sqlx::types::Json;
use sqlx::{FromRow, Postgres, QueryBuilder};
use time::OffsetDateTime;
use tonic::{Request, Response, Status};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct User {
    id: i64,
    name: String,
    username: String,
    avatar_id: Option<Uuid>,
    avatar_hex: Option<String>,
    public_flags: i32,
}

#[derive(Debug, FromRow)]
struct Comment {
    id: i64,
    content: String,
    rendered_content: String,
    user_id: i64,
    story_id: i64,
    story_slug: String,
    story_writer_username: String,
    hidden: bool,
    // Timestamps
    edited_at: Option<OffsetDateTime>,
    created_at: OffsetDateTime,
    // Stats
    like_count: i32,
    reply_count: i32,
    user: Json<User>,
    // Boolean flags
    is_liked: bool,
}

/// Returns the comment object.
pub async fn get_comment(
    client: &GrpcService,
    request: Request<GetCommentRequest>,
) -> Result<Response<GetCommentResponse>, Status> {
    let request = request.into_inner();
    let comment_id = request
        .id
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`id` is invalid"))?;

    let current_user_id = {
        if let Some(user_id) = request.current_user_id {
            let value = user_id
                .parse::<i64>()
                .map_err(|_| Status::invalid_argument("`current_user_id` is invalid"))?;

            Some(value)
        } else {
            None
        }
    };

    let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
        r#"
        SELECT
            c.id,
            c.content,
            c.rendered_content,
            c.user_id,
            c.story_id,
            c.hidden,
            c.like_count,
            c.reply_count,
            cs.slug             AS "story_slug",
            "cs->user".username AS "story_writer_username",
            -- User
            JSON_BUILD_OBJECT(
                    'id', cu.id,
                    'name', cu.name,
                    'username', cu.username,
                    'avatar_id', cu.avatar_id,
                    'avatar_hex', cu.avatar_hex,
                    'public_flags', cu.public_flags
            )                   AS "user",
            -- Timestamps
            c.edited_at,
            c.created_at,
        "#,
    );

    query_builder.push(if current_user_id.is_some() {
        r#"
        -- Boolean flags
        CASE
            WHEN COUNT("c->is_liked") = 1
                THEN
                    TRUE
                ELSE
                    FALSE
        END AS "is_liked"
        "#
    } else {
        r#"
        -- Boolean flags
        FALSE AS "is_liked"
        "#
    });

    query_builder.push(
        r#"
        FROM
            comments c
                -- Join comment user
                INNER JOIN users AS cu
                           ON cu.id = c.user_id
                -- Join comment story
                INNER JOIN stories AS cs
                           ON cs.id = c.story_id
                -- Join comment story user
                INNER JOIN users AS "cs->user"
                           ON "cs->user".id = cs.user_id
        "#,
    );

    if current_user_id.is_some() {
        query_builder.push(
            r#"
            -- Boolean like flag
            LEFT OUTER JOIN comment_likes AS "c->is_liked"
                            ON "c->is_liked".comment_id = c.id
                                AND "c->is_liked".user_id = $2
                                AND "c->is_liked".deleted_at IS NULL
            "#,
        );
    }

    query_builder.push(
        r#"
        WHERE
              c.id = $1
          AND c.deleted_at IS NULL
        GROUP BY
            c.id,
            cu.id,
            cs.slug,
            "cs->user".username
        LIMIT 1
        "#,
    );

    let mut query_result = query_builder.build_query_as::<Comment>().bind(comment_id);

    if let Some(user_id) = current_user_id {
        query_result = query_result.bind(user_id);
    }

    let result = query_result.fetch_one(&client.db_pool).await;

    if let Err(ref err) = result {
        if matches!(err, sqlx::Error::RowNotFound) {
            return Err(Status::not_found("Comment not found"));
        }

        return Err(Status::internal("Database error"));
    }

    let comment = result.unwrap();

    Ok(Response::new(GetCommentResponse {
        id: comment.id.to_string(),
        content: comment.content,
        rendered_content: comment.rendered_content,
        user_id: comment.user_id.to_string(),
        story_id: comment.story_id.to_string(),
        story_slug: comment.story_slug,
        story_writer_username: comment.story_writer_username,
        hidden: comment.hidden,
        edited_at: comment.edited_at.and_then(|value| Some(value.to_string())),
        created_at: comment.created_at.to_string(),
        like_count: comment.like_count as u32,
        reply_count: comment.reply_count as u32,
        user: Some(BareUser {
            id: comment.user.id.to_string(),
            name: comment.user.name.clone(),
            username: comment.user.username.clone(),
            avatar_id: comment
                .user
                .avatar_id
                .and_then(|value| Some(value.to_string())),
            avatar_hex: comment.user.avatar_hex.clone(),
            public_flags: comment.user.public_flags as u32,
        }),
        is_liked: comment.is_liked,
    }))
}

#[cfg(test)]
mod tests {
    use crate::grpc::defs::comment_def::v1::GetCommentRequest;
    use crate::test_utils::test_grpc_service;
    use sqlx::PgPool;
    use tonic::{Code, Request};

    // Logged-out

    #[sqlx::test(fixtures("get_comment"))]
    async fn can_return_comment(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_comment(Request::new(GetCommentRequest {
                        id: 3_i64.to_string(),
                        current_user_id: None,
                    }))
                    .await;

                assert!(response.is_ok());
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_comment"))]
    async fn should_not_return_soft_deleted_comment(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                // Soft-delete the comment
                let result = sqlx::query(
                    r#"
                    UPDATE comments
                    SET deleted_at = now()
                    WHERE id = $1
                    "#,
                )
                .bind(3_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_comment(Request::new(GetCommentRequest {
                        id: 3_i64.to_string(),
                        current_user_id: None,
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }

    // Logged-in

    #[sqlx::test(fixtures("get_comment"))]
    async fn can_return_comment_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, _, _, user_id| async move {
                let response = client
                    .get_comment(Request::new(GetCommentRequest {
                        id: 3_i64.to_string(),
                        current_user_id: user_id.and_then(|value| Some(value.to_string())),
                    }))
                    .await;

                assert!(response.is_ok());
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_comment"))]
    async fn should_not_return_soft_deleted_comment_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Soft-delete the comment
                let result = sqlx::query(
                    r#"
                    UPDATE comments
                    SET deleted_at = now()
                    WHERE id = $1
                    "#,
                )
                .bind(3_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_comment(Request::new(GetCommentRequest {
                        id: 3_i64.to_string(),
                        current_user_id: user_id.and_then(|value| Some(value.to_string())),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }
}
