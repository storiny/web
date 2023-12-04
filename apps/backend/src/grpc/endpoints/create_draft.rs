use crate::{
    constants::resource_limit::ResourceLimit,
    grpc::{
        defs::story_def::v1::{
            CreateDraftRequest,
            CreateDraftResponse,
        },
        service::GrpcService,
    },
    utils::{
        check_resource_limit::check_resource_limit,
        incr_resource_limit::incr_resource_limit,
    },
};
use sqlx::Row;
use tonic::{
    Request,
    Response,
    Status,
};

/// Creates a new draft.
pub async fn create_draft(
    client: &GrpcService,
    request: Request<CreateDraftRequest>,
) -> Result<Response<CreateDraftResponse>, Status> {
    let user_id = request
        .into_inner()
        .user_id
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`user_id` is invalid"))?;

    if !check_resource_limit(&client.redis_pool, ResourceLimit::CreateStory, user_id)
        .await
        .map_err(|_| Status::internal("Cache error"))?
    {
        return Err(Status::resource_exhausted(
            "Daily limit exceeded for creating drafts. Try again tomorrow.",
        ));
    }

    let pg_pool = &client.db_pool;
    let mut txn = pg_pool
        .begin()
        .await
        .map_err(|_| Status::internal("Database error"))?;

    match sqlx::query(
        r#"
        INSERT INTO stories (user_id)
        VALUES ($1)
        RETURNING id
        "#,
    )
    .bind(&user_id)
    .fetch_one(&mut *txn)
    .await
    {
        Ok(draft) => {
            incr_resource_limit(&client.redis_pool, ResourceLimit::CreateStory, user_id)
                .await
                .map_err(|_| Status::internal("Cache error"))?;

            txn.commit()
                .await
                .map_err(|_| Status::internal("Database error"))?;

            Ok(Response::new(CreateDraftResponse {
                draft_id: draft.get::<i64, _>("id").to_string(),
            }))
        }
        Err(error) => {
            if let Some(db_error) = error.into_database_error() {
                if matches!(db_error.kind(), sqlx::error::ErrorKind::ForeignKeyViolation) {
                    Err(Status::not_found("User not found"))
                } else {
                    Err(Status::internal("Database error"))
                }
            } else {
                Err(Status::internal("Database error"))
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::{
        constants::resource_limit::ResourceLimit,
        grpc::defs::story_def::v1::CreateDraftRequest,
        test_utils::{
            exceed_resource_limit,
            get_resource_limit,
            test_grpc_service,
            RedisTestContext,
        },
    };
    use sqlx::{
        PgPool,
        Row,
    };
    use storiny_macros::test_context;
    use tonic::Request;

    mod serial {
        use super::*;

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_create_draft(_ctx: &mut RedisTestContext, pool: PgPool) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, pool, redis_pool, user_id| async move {
                    let response = client
                        .create_draft(Request::new(CreateDraftRequest {
                            user_id: user_id.unwrap().to_string(),
                        }))
                        .await;

                    assert!(response.is_ok());

                    let draft_id = response.unwrap().into_inner().draft_id;

                    // Story should be present in the database
                    let result = sqlx::query(
                        r#"
                        SELECT EXISTS (
                            SELECT 1 FROM stories
                            WHERE id = $1
                        )
                        "#,
                    )
                    .bind(draft_id.parse::<i64>().unwrap())
                    .fetch_one(&pool)
                    .await
                    .unwrap();

                    assert!(result.get::<bool, _>("exists"));

                    // Should also increment the resource limit
                    let result = get_resource_limit(
                        &redis_pool,
                        ResourceLimit::CreateStory,
                        user_id.unwrap(),
                    )
                    .await;

                    assert_eq!(result, 1);
                }),
            )
            .await;
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_draft_on_exceeding_the_resource_limit(
            _ctx: &mut RedisTestContext,
            pool: PgPool,
        ) {
            test_grpc_service(
                pool,
                true,
                Box::new(|mut client, _, redis_pool, user_id| async move {
                    exceed_resource_limit(
                        &redis_pool,
                        ResourceLimit::CreateStory,
                        user_id.unwrap(),
                    )
                    .await;

                    let response = client
                        .create_draft(Request::new(CreateDraftRequest {
                            user_id: user_id.unwrap().to_string(),
                        }))
                        .await;

                    assert!(response.is_err());
                    // TODO: Assert on the status code of the error response instead when tonic
                    // includes the `RESOURCE_EXHAUSTED` variant in their `StatusCode` enum.
                    assert_eq!(
                        response.unwrap_err().message(),
                        "Daily limit exceeded for creating drafts. Try again tomorrow."
                    );
                }),
            )
            .await;
        }
    }
}
