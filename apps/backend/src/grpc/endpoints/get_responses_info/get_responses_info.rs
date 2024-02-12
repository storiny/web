use crate::grpc::{
    defs::response_def::v1::{
        GetResponsesInfoRequest,
        GetResponsesInfoResponse,
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

/// Returns the `comment_count` and `reply_count` for a user.
#[tracing::instrument(
    name = "GRPC get_responses_info",
    skip_all,
    fields(
        user_id = tracing::field::Empty
    ),
    err
)]
pub async fn get_responses_info(
    client: &GrpcService,
    request: Request<GetResponsesInfoRequest>,
) -> Result<Response<GetResponsesInfoResponse>, Status> {
    let user_id_str = request.into_inner().user_id;

    tracing::Span::current().record("user_id", &user_id_str);

    let user_id = user_id_str
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`user_id` is invalid"))?;

    let result = sqlx::query(
        r#"
SELECT (
    SELECT COUNT(*)
    FROM replies
    WHERE
        user_id = $1
        AND deleted_at IS NULL
    ) AS "reply_count",
    (
    SELECT COUNT(*)
    FROM comments
    WHERE
        user_id = $1
        AND deleted_at IS NULL
    ) AS "comment_count"
"#,
    )
    .bind(user_id)
    .fetch_one(&client.db_pool)
    .await
    .map_err(|error| {
        error!("database error: {error:?}");

        Status::internal("Database error")
    })?;

    Ok(Response::new(GetResponsesInfoResponse {
        comment_count: result.get::<i64, _>("comment_count") as u32,
        reply_count: result.get::<i64, _>("reply_count") as u32,
    }))
}

#[cfg(test)]
mod tests {
    use crate::{
        grpc::defs::response_def::v1::GetResponsesInfoRequest,
        test_utils::test_grpc_service,
    };
    use sqlx::PgPool;
    use tonic::Request;

    #[sqlx::test(fixtures("get_responses_info"))]
    async fn can_return_responses_info(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_responses_info(Request::new(GetResponsesInfoRequest {
                        user_id: 1_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.comment_count, 2_u32);
                assert_eq!(response.reply_count, 2_u32);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_responses_info"))]
    async fn should_not_count_soft_deleted_comments(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                // Should count all the comments initially.
                let response = client
                    .get_responses_info(Request::new(GetResponsesInfoRequest {
                        user_id: 1_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.comment_count, 2_u32);

                // Soft-delete one of the comments.
                let result = sqlx::query(
                    r#"
UPDATE comments
SET deleted_at = NOW()
WHERE id = $1
"#,
                )
                .bind(2_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                // Should count only one comment.
                let response = client
                    .get_responses_info(Request::new(GetResponsesInfoRequest {
                        user_id: 1_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.comment_count, 1_u32);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_responses_info"))]
    async fn should_not_count_soft_deleted_replies(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                // Should count all the replies initially.
                let response = client
                    .get_responses_info(Request::new(GetResponsesInfoRequest {
                        user_id: 1_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.reply_count, 2_u32);

                // Soft-delete one of the replies.
                let result = sqlx::query(
                    r#"
UPDATE replies
SET deleted_at = NOW()
WHERE id = $1
"#,
                )
                .bind(3_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                // Should count only one reply.
                let response = client
                    .get_responses_info(Request::new(GetResponsesInfoRequest {
                        user_id: 1_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.reply_count, 1_u32);
            }),
        )
        .await;
    }
}
