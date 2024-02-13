use crate::grpc::{
    defs::user_def::v1::{
        GetUserMuteCountRequest,
        GetUserMuteCountResponse,
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

/// Returns the muted user count for a user.
#[tracing::instrument(
    name = "GRPC get_user_mute_count",
    skip_all,
    fields(
        user_id = tracing::field::Empty
    ),
    err
)]
pub async fn get_user_mute_count(
    client: &GrpcService,
    request: Request<GetUserMuteCountRequest>,
) -> Result<Response<GetUserMuteCountResponse>, Status> {
    let user_id_str = request.into_inner().user_id;

    tracing::Span::current().record("user_id", &user_id_str);

    let user_id = user_id_str
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`user_id` is invalid"))?;

    let result = sqlx::query(
        r#"
SELECT (
    SELECT COUNT(*)
    FROM mutes
    WHERE
        muter_id = $1
        AND deleted_at IS NULL
) AS "mute_count"
"#,
    )
    .bind(user_id)
    .fetch_one(&client.db_pool)
    .await
    .map_err(|error| {
        error!("database error: {error:?}");

        Status::internal("Database error")
    })?;

    Ok(Response::new(GetUserMuteCountResponse {
        mute_count: result.get::<i64, _>("mute_count") as u32,
    }))
}

#[cfg(test)]
mod tests {
    use crate::{
        grpc::defs::user_def::v1::GetUserMuteCountRequest,
        test_utils::test_grpc_service,
    };
    use sqlx::PgPool;
    use tonic::Request;

    #[sqlx::test(fixtures("get_user_mute_count"))]
    async fn can_return_user_mute_count(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Mute some users.
                let result = sqlx::query(
                    r#"
INSERT INTO mutes (muted_id, muter_id)
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
                    .get_user_mute_count(Request::new(GetUserMuteCountRequest {
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.mute_count, 2_u32);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_user_mute_count"))]
    async fn should_not_count_soft_deleted_mutes(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Mute some users.
                let result = sqlx::query(
                    r#"
INSERT INTO mutes (muted_id, muter_id)
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

                // Should count all the mutes initially.
                let response = client
                    .get_user_mute_count(Request::new(GetUserMuteCountRequest {
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.mute_count, 2_u32);

                // Soft-delete one of the mute relation.
                let result = sqlx::query(
                    r#"
UPDATE mutes
SET deleted_at = NOW()
WHERE muted_id = $1
"#,
                )
                .bind(2_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                // Should count only one mute relation.
                let response = client
                    .get_user_mute_count(Request::new(GetUserMuteCountRequest {
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.mute_count, 1_u32);
            }),
        )
        .await;
    }
}
