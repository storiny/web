use crate::grpc::{
    defs::tag_def::v1::{
        GetTagRequest,
        GetTagResponse,
    },
    service::GrpcService,
};
use sqlx::{
    FromRow,
    Postgres,
    QueryBuilder,
};
use time::OffsetDateTime;
use tonic::{
    Request,
    Response,
    Status,
};

#[derive(Debug, FromRow)]
struct Tag {
    id: i64,
    name: String,
    story_count: i32,
    follower_count: i32,
    created_at: OffsetDateTime,
    // Boolean flags
    is_following: bool,
}

/// Returns the tag object.
pub async fn get_tag(
    client: &GrpcService,
    request: Request<GetTagRequest>,
) -> Result<Response<GetTagResponse>, Status> {
    let request = request.into_inner();
    let tag_name = request.name;
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
            t.id,
            t.name,
            t.story_count,
            t.follower_count,
            t.created_at,
        "#,
    );

    query_builder.push(if current_user_id.is_some() {
        r#"
        -- Boolean flags
        "t->is_following" IS NOT NULL AS "is_following"
        "#
    } else {
        r#"
        -- Boolean flags
        FALSE AS "is_following"
        "#
    });

    query_builder.push(
        r#"
        FROM tags t
        "#,
    );

    if current_user_id.is_some() {
        query_builder.push(
            r#"
            -- Boolean following flag
            LEFT OUTER JOIN tag_followers AS "t->is_following"
                ON "t->is_following".tag_id = t.id
                    AND "t->is_following".user_id = $2
                    AND "t->is_following".deleted_at IS NULL
            "#,
        );
    }

    query_builder.push(
        r#"
        WHERE
            t.name = $1
        GROUP BY
            t.id
        "#,
    );

    let mut query_result = query_builder.build_query_as::<Tag>().bind(tag_name);

    if let Some(user_id) = current_user_id {
        query_result = query_result.bind(user_id);
    }

    let result = query_result.fetch_one(&client.db_pool).await;

    if let Err(ref err) = result {
        if matches!(err, sqlx::Error::RowNotFound) {
            return Err(Status::not_found("Tag not found"));
        }

        return Err(Status::internal("Database error"));
    }

    let tag = result.unwrap();

    Ok(Response::new(GetTagResponse {
        id: tag.id.to_string(),
        name: tag.name,
        story_count: tag.story_count as u32,
        follower_count: tag.follower_count as u32,
        created_at: tag.created_at.to_string(),
        is_following: tag.is_following,
    }))
}

#[cfg(test)]
mod tests {
    use crate::{
        grpc::defs::tag_def::v1::GetTagRequest,
        test_utils::test_grpc_service,
    };
    use sqlx::PgPool;
    use tonic::Request;

    #[sqlx::test(fixtures("get_tag"))]
    async fn can_return_tag(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_tag(Request::new(GetTagRequest {
                        name: "sample".to_string(),
                        current_user_id: None,
                    }))
                    .await;

                assert!(response.is_ok());
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_tag"))]
    async fn can_return_tag_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, _, _, user_id| async move {
                let response = client
                    .get_tag(Request::new(GetTagRequest {
                        name: "sample".to_string(),
                        current_user_id: user_id.and_then(|value| Some(value.to_string())),
                    }))
                    .await;

                assert!(response.is_ok());
            }),
        )
        .await;
    }
}
