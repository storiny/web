use crate::grpc::{
    defs::story_def::v1::{
        GetContributionsInfoRequest,
        GetContributionsInfoResponse,
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

/// Returns a user's contributions.
#[tracing::instrument(
    name = "GRPC get_contributions_info",
    skip_all,
    fields(
        user_id = tracing::field::Empty
    ),
    err
)]
pub async fn get_contributions_info(
    client: &GrpcService,
    request: Request<GetContributionsInfoRequest>,
) -> Result<Response<GetContributionsInfoResponse>, Status> {
    let user_id_str = request.into_inner().user_id;

    tracing::Span::current().record("user_id", &user_id_str);

    let user_id = user_id_str
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`user_id` is invalid"))?;

    let result = sqlx::query(
        r#"
SELECT (
    SELECT COUNT(*)
    FROM story_contributors
    WHERE
        user_id = $1
        AND accepted_at IS NOT NULL    
        AND deleted_at IS NULL
    ) AS "contributable_story_count",
    (
    SELECT COUNT(*)
    FROM story_contributors
    WHERE
        user_id = $1
        AND accepted_at IS NULL    
        AND deleted_at IS NULL
    ) AS "pending_collaboration_request_count"
"#,
    )
    .bind(user_id)
    .fetch_one(&client.db_pool)
    .await
    .map_err(|error| {
        error!("database error: {error:?}");

        Status::internal("Database error")
    })?;

    Ok(Response::new(GetContributionsInfoResponse {
        contributable_story_count: result.get::<i64, _>("contributable_story_count") as u32,
        pending_collaboration_request_count: result
            .get::<i64, _>("pending_collaboration_request_count")
            as u32,
    }))
}

#[cfg(test)]
mod tests {
    use crate::{
        grpc::defs::story_def::v1::GetContributionsInfoRequest,
        test_utils::test_grpc_service,
    };
    use sqlx::PgPool;
    use tonic::Request;

    #[sqlx::test(fixtures("get_contributions_info"))]
    async fn can_return_contributions_info(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_contributions_info(Request::new(GetContributionsInfoRequest {
                        user_id: 1_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.contributable_story_count, 2_u32);
                assert_eq!(response.pending_collaboration_request_count, 2_u32);
            }),
        )
        .await;
    }
}
