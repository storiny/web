use crate::grpc::{
    defs::open_graph_def::v1::{
        GetTagOpenGraphDataRequest,
        GetTagOpenGraphDataResponse,
    },
    service::GrpcService,
};
use sqlx::FromRow;
use tonic::{
    Request,
    Response,
    Status,
};
use tracing::error;

#[derive(Debug, FromRow)]
struct Tag {
    id: i64,
    name: String,
    story_count: i32,
    follower_count: i32,
}

/// Returns the open graph data for a tag.
#[tracing::instrument(
    name = "GRPC get_tag_open_graph_data",
    skip_all,
    fields(
        id = tracing::field::Empty
    ),
    err
)]
pub async fn get_tag_open_graph_data(
    client: &GrpcService,
    request: Request<GetTagOpenGraphDataRequest>,
) -> Result<Response<GetTagOpenGraphDataResponse>, Status> {
    let request = request.into_inner();
    let id_str = request.id;

    tracing::Span::current().record("id", &id_str);

    let id = id_str
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`id` is invalid"))?;

    let tag = sqlx::query_as::<_, Tag>(
        r#"
SELECT
    id,
    name,
    story_count,
    follower_count
FROM tags
WHERE
    id = $1
"#,
    )
    .bind(id)
    .fetch_one(&client.db_pool)
    .await
    .map_err(|error| {
        if matches!(error, sqlx::Error::RowNotFound) {
            Status::not_found("Tag not found")
        } else {
            error!("database error: {error:?}");
            Status::internal("Database error")
        }
    })?;

    Ok(Response::new(GetTagOpenGraphDataResponse {
        id: tag.id.to_string(),
        name: tag.name,
        story_count: tag.story_count as u32,
        follower_count: tag.follower_count as u32,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::test_grpc_service;
    use sqlx::PgPool;
    use tonic::{
        Code,
        Request,
    };

    #[sqlx::test(fixtures("get_tag_open_graph_data"))]
    async fn can_return_a_tag_open_graph_data(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_tag_open_graph_data(Request::new(GetTagOpenGraphDataRequest {
                        id: 1_i64.to_string(),
                    }))
                    .await;

                assert!(response.is_ok());
            }),
        )
        .await;
    }

    #[sqlx::test]
    async fn can_reject_a_missing_tag(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_tag_open_graph_data(Request::new(GetTagOpenGraphDataRequest {
                        id: "12345".to_string(),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }
}
