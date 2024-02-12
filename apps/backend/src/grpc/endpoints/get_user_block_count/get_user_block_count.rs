use crate::grpc::{
    defs::user_def::v1::{
        GetUserBlockCountRequest,
        GetUserBlockCountResponse,
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

/// Returns the blocked user count for a user.
#[tracing::instrument(
    name = "GRPC get_user_block_count",
    skip_all,
    fields(
        user_id = tracing::field::Empty
    ),
    err
)]
pub async fn get_user_block_count(
    client: &GrpcService,
    request: Request<GetUserBlockCountRequest>,
) -> Result<Response<GetUserBlockCountResponse>, Status> {
    let user_id_str = request.into_inner().user_id;

    tracing::Span::current().record("user_id", &user_id_str);

    let user_id = user_id_str
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`user_id` is invalid"))?;

    let result = sqlx::query(
        r#"
SELECT (
    SELECT COUNT(*)
    FROM blocks
    WHERE
        blocker_id = $1
        AND deleted_at IS NULL
) AS "block_count"
"#,
    )
    .bind(user_id)
    .fetch_one(&client.db_pool)
    .await
    .map_err(|error| {
        error!("database error: {error:?}");

        Status::internal("Database error")
    })?;

    Ok(Response::new(GetUserBlockCountResponse {
        block_count: result.get::<i64, _>("block_count") as u32,
    }))
}

#[cfg(test)]
mod tests {
    use crate::{
        grpc::defs::user_def::v1::GetUserBlockCountRequest,
        test_utils::test_grpc_service,
    };
    use sqlx::PgPool;
    use tonic::Request;

    #[sqlx::test(fixtures("get_user_block_count"))]
    async fn can_return_user_block_count(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Block some users.
                let result = sqlx::query(
                    r#"
INSERT INTO blocks (blocked_id, blocker_id)
VALUES ($2, $1), ($3, $1)
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
                    .get_user_block_count(Request::new(GetUserBlockCountRequest {
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.block_count, 2_u32);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_user_block_count"))]
    async fn should_not_count_soft_deleted_blocks(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Block some users.
                let result = sqlx::query(
                    r#"
INSERT INTO blocks (blocked_id, blocker_id)
VALUES ($2, $1), ($3, $1)
"#,
                )
                .bind(user_id.unwrap())
                .bind(2_i64)
                .bind(3_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 2);

                // Should count all the blocks initially.
                let response = client
                    .get_user_block_count(Request::new(GetUserBlockCountRequest {
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.block_count, 2_u32);

                // Soft-delete one of the block relation.
                let result = sqlx::query(
                    r#"
UPDATE blocks
SET deleted_at = NOW()
WHERE blocked_id = $1
"#,
                )
                .bind(2_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                // Should count only one block relation.
                let response = client
                    .get_user_block_count(Request::new(GetUserBlockCountRequest {
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.block_count, 1_u32);
            }),
        )
        .await;
    }
}
