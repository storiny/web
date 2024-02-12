use crate::grpc::{
    defs::user_def::v1::{
        GetUserRelationsInfoRequest,
        GetUserRelationsInfoResponse,
    },
    service::GrpcService,
};
use sqlx::Row;
use tonic::{
    Request,
    Response,
    Status,
};
use tracing::error;

/// Returns the relations details for a user.
#[tracing::instrument(
    name = "GRPC get_user_relations_info",
    skip_all,
    fields(
        user_id = tracing::field::Empty
    ),
    err
)]
pub async fn get_user_relations_info(
    client: &GrpcService,
    request: Request<GetUserRelationsInfoRequest>,
) -> Result<Response<GetUserRelationsInfoResponse>, Status> {
    let user_id_str = request.into_inner().user_id;

    tracing::Span::current().record("user_id", &user_id_str);

    let user_id = user_id_str
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`user_id` is invalid"))?;

    let result = sqlx::query(
        r#"
SELECT
-- Follower count
(
    SELECT COUNT(*)
    FROM relations
    WHERE
        followed_id = $1
        AND deleted_at IS NULL
) AS "follower_count",
-- Following count
(
    SELECT COUNT(*)
    FROM relations
    WHERE
        follower_id = $1
        AND deleted_at IS NULL
) AS "following_count",
-- Friend count
(
    SELECT COUNT(*)
    FROM friends
    WHERE
        (transmitter_id = $1 OR receiver_id = $1)
        AND accepted_at IS NOT NULL  
        AND deleted_at IS NULL
) AS "friend_count",
-- Pending friend request count
(
    SELECT COUNT(*)
    FROM friends
    WHERE
        receiver_id = $1
        AND accepted_at IS NULL  
        AND deleted_at IS NULL
) AS "pending_friend_request_count"    
"#,
    )
    .bind(user_id)
    .fetch_one(&client.db_pool)
    .await
    .map_err(|error| {
        error!("database error: {error:?}");

        Status::internal("Database error")
    })?;

    Ok(Response::new(GetUserRelationsInfoResponse {
        follower_count: result.get::<i64, _>("follower_count") as u32,
        following_count: result.get::<i64, _>("following_count") as u32,
        friend_count: result.get::<i64, _>("friend_count") as u32,
        pending_friend_request_count: result.get::<i64, _>("pending_friend_request_count") as u32,
    }))
}

#[cfg(test)]
mod tests {
    use crate::{
        grpc::defs::user_def::v1::GetUserRelationsInfoRequest,
        test_utils::test_grpc_service,
    };
    use sqlx::PgPool;
    use tonic::Request;

    #[sqlx::test(fixtures("get_user_relations_info"))]
    async fn can_return_user_relations_info(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Add some relations.
                let result = sqlx::query(
                    r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2), ($2, $1)
"#,
                )
                .bind(user_id.unwrap())
                .bind(2_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 2);

                // Add some friends.
                let result = sqlx::query(
                    r#"
INSERT INTO friends (transmitter_id, receiver_id, accepted_at)
VALUES ($1, $2, NOW()), ($3, $1, DEFAULT)
"#,
                )
                .bind(user_id.unwrap())
                .bind(2_i64)
                .bind(3_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 2);

                let response = client
                    .get_user_relations_info(Request::new(GetUserRelationsInfoRequest {
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.follower_count, 1_u32);
                assert_eq!(response.following_count, 1_u32);
                assert_eq!(response.friend_count, 1_u32);
                assert_eq!(response.pending_friend_request_count, 1_u32);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_user_relations_info"))]
    async fn should_not_include_soft_deleted_user_relations(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Add some relations.
                let result = sqlx::query(
                    r#"
INSERT INTO relations (follower_id, followed_id)
VALUES ($1, $2), ($2, $1)
"#,
                )
                .bind(user_id.unwrap())
                .bind(2_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 2);

                // Add some friends.
                let result = sqlx::query(
                    r#"
INSERT INTO friends (transmitter_id, receiver_id, accepted_at)
VALUES ($1, $2, NOW()), ($3, $1, DEFAULT)
"#,
                )
                .bind(user_id.unwrap())
                .bind(2_i64)
                .bind(3_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 2);

                // Should return all the relations initially.
                let response = client
                    .get_user_relations_info(Request::new(GetUserRelationsInfoRequest {
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.follower_count, 1_u32);
                assert_eq!(response.following_count, 1_u32);
                assert_eq!(response.friend_count, 1_u32);
                assert_eq!(response.pending_friend_request_count, 1_u32);

                // Soft-delete relations.
                let result = sqlx::query(
                    r#"
UPDATE relations
SET deleted_at = NOW()
WHERE follower_id = $1 OR followed_id = $1
"#,
                )
                .bind(user_id.unwrap())
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 2);

                // Soft-delete friends.
                let result = sqlx::query(
                    r#"
UPDATE friends
SET deleted_at = NOW()
WHERE transmitter_id = $1 OR receiver_id = $1
"#,
                )
                .bind(user_id.unwrap())
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 2);

                let response = client
                    .get_user_relations_info(Request::new(GetUserRelationsInfoRequest {
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.follower_count, 0_u32);
                assert_eq!(response.following_count, 0_u32);
                assert_eq!(response.friend_count, 0_u32);
                assert_eq!(response.pending_friend_request_count, 0_u32);
            }),
        )
        .await;
    }
}
