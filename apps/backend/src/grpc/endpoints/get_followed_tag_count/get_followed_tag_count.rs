use crate::grpc::{
    defs::tag_def::v1::{
        GetFollowedTagCountRequest,
        GetFollowedTagCountResponse,
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

/// Returns the followed tag count for a user.
#[tracing::instrument(
    name = "GRPC get_followed_tag_count",
    skip_all,
    fields(
        user_id = tracing::field::Empty
    ),
    err
)]
pub async fn get_followed_tag_count(
    client: &GrpcService,
    request: Request<GetFollowedTagCountRequest>,
) -> Result<Response<GetFollowedTagCountResponse>, Status> {
    let user_id_str = request.into_inner().user_id;

    tracing::Span::current().record("user_id", &user_id_str);

    let user_id = user_id_str
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`user_id` is invalid"))?;

    let result = sqlx::query(
        r#"
SELECT (
    SELECT COUNT(*)
    FROM tag_followers
    WHERE
        user_id = $1
        AND deleted_at IS NULL
) AS "followed_tag_count"
"#,
    )
    .bind(user_id)
    .fetch_one(&client.db_pool)
    .await
    .map_err(|error| {
        error!("unable to get the followed tag count: {error:?}");

        Status::internal("Database error")
    })?;

    Ok(Response::new(GetFollowedTagCountResponse {
        followed_tag_count: result.get::<i64, _>("followed_tag_count") as u32,
    }))
}

#[cfg(test)]
mod tests {
    use crate::{
        grpc::defs::tag_def::v1::GetFollowedTagCountRequest,
        test_utils::test_grpc_service,
    };
    use sqlx::PgPool;
    use tonic::Request;

    #[sqlx::test(fixtures("get_followed_tag_count"))]
    async fn can_return_followed_tag_count(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Follow some tags.
                let result = sqlx::query(
                    r#"
INSERT INTO tag_followers (tag_id, user_id)
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
                    .get_followed_tag_count(Request::new(GetFollowedTagCountRequest {
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.followed_tag_count, 2_u32);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_followed_tag_count"))]
    async fn should_not_count_soft_deleted_followed_tags(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Follow some tags.
                let result = sqlx::query(
                    r#"
INSERT INTO tag_followers (tag_id, user_id)
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

                // Should count all the followed tags initially.
                let response = client
                    .get_followed_tag_count(Request::new(GetFollowedTagCountRequest {
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.followed_tag_count, 2_u32);

                // Soft-delete one of the followed tag relation.
                let result = sqlx::query(
                    r#"
UPDATE tag_followers
SET deleted_at = NOW()
WHERE tag_id = $1
"#,
                )
                .bind(2_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                // Should count only one followed tag relation.
                let response = client
                    .get_followed_tag_count(Request::new(GetFollowedTagCountRequest {
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.followed_tag_count, 1_u32);
            }),
        )
        .await;
    }
}
