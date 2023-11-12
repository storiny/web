use crate::grpc::{
    defs::story_def::v1::{GetDraftsInfoRequest, GetDraftsInfoResponse},
    service::GrpcService,
};
use sqlx::Row;
use tonic::{Request, Response, Status};

/// Returns the `pending_draft_count`, `deleted_draft_count` and `latest_draft` for a user.
pub async fn get_drafts_info(
    client: &GrpcService,
    request: Request<GetDraftsInfoRequest>,
) -> Result<Response<GetDraftsInfoResponse>, Status> {
    let user_id = request
        .into_inner()
        .id
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`id` is invalid"))?;

    let result = sqlx::query(
        r#"
        SELECT
            (SELECT
                 COUNT(*)
             FROM
                 stories
             WHERE
                   user_id = $1
               AND first_published_at IS NULL    
               AND deleted_at IS NULL
            ) AS "pending_draft_count",
            (SELECT
                 COUNT(*)
             FROM
                 stories
             WHERE
                   user_id = $1
               AND first_published_at IS NULL    
               AND deleted_at IS NOT NULL
            ) AS "deleted_draft_count"    
        "#,
    )
    .bind(user_id)
    .fetch_one(&client.db_pool)
    .await
    .map_err(|_| Status::internal("Database error"))?;

    Ok(Response::new(GetDraftsInfoResponse {
        pending_draft_count: result.get::<i64, _>("pending_draft_count") as u32,
        deleted_draft_count: result.get::<i64, _>("deleted_draft_count") as u32,
    }))
}

#[cfg(test)]
mod tests {
    use crate::grpc::defs::story_def::v1::GetDraftsInfoRequest;
    use crate::test_utils::test_grpc_service;
    use sqlx::PgPool;
    use tonic::Request;

    #[sqlx::test(fixtures("get_drafts_info"))]
    async fn can_return_drafts_info(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, user_id| async move {
                let response = client
                    .get_drafts_info(Request::new(GetDraftsInfoRequest {
                        id: 1_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(2_u32, response.pending_draft_count);
                assert_eq!(2_u32, response.deleted_draft_count);
            }),
        )
        .await;
    }
}
