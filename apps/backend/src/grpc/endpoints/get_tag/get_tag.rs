use crate::{
    grpc::{
        defs::tag_def::v1::{
            GetTagRequest,
            GetTagResponse,
        },
        service::GrpcService,
    },
    utils::to_iso8601::to_iso8601,
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
use tracing::error;

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
#[tracing::instrument(
    name = "GRPC get_tag",
    skip_all,
    fields(
        user_id = tracing::field::Empty,
        request
    ),
    err
)]
pub async fn get_tag(
    client: &GrpcService,
    request: Request<GetTagRequest>,
) -> Result<Response<GetTagResponse>, Status> {
    let request = request.into_inner();
    let tag_name = request.name;
    let current_user_id = request
        .current_user_id
        .and_then(|user_id| user_id.parse::<i64>().ok());

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
"t->is_following".tag_id IS NOT NULL AS "is_following"
"#
    } else {
        r#"
-- Boolean flags
FALSE AS "is_following"
"#
    });

    query_builder.push(r#" FROM tags t "#);

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

    if current_user_id.is_some() {
        query_builder.push(",");
        query_builder.push(r#" "t->is_following".tag_id "#);
    }

    let mut db_query = query_builder.build_query_as::<Tag>().bind(tag_name);

    if let Some(current_user_id) = current_user_id {
        tracing::Span::current().record("user_id", current_user_id);

        db_query = db_query.bind(current_user_id);
    }

    let tag = db_query.fetch_one(&client.db_pool).await.map_err(|error| {
        if matches!(error, sqlx::Error::RowNotFound) {
            Status::not_found("Tag not found")
        } else {
            error!("unable to fetch the tag: {error:?}");

            Status::internal("Database error")
        }
    })?;

    Ok(Response::new(GetTagResponse {
        id: tag.id.to_string(),
        name: tag.name,
        story_count: tag.story_count as u32,
        follower_count: tag.follower_count as u32,
        created_at: to_iso8601(&tag.created_at),
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

                let response = response.unwrap().into_inner();

                assert!(!response.is_following);
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
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await;

                assert!(response.is_ok());
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_tag"))]
    async fn can_return_is_following_flag_for_tag_when_logged_in(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                let response = client
                    .get_tag(Request::new(GetTagRequest {
                        name: "sample".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `false` initially.
                assert!(!response.is_following);

                // Follow the tag.
                let result = sqlx::query(
                    r#"
INSERT INTO tag_followers (user_id, tag_id)
VALUES ($1, $2)
"#,
                )
                .bind(user_id.unwrap())
                .bind(2_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_tag(Request::new(GetTagRequest {
                        name: "sample".to_string(),
                        current_user_id: user_id.map(|value| value.to_string()),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                // Should be `true`.
                assert!(response.is_following);
            }),
        )
        .await;
    }
}
