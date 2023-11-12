use crate::grpc::{
    defs::story_def::v1::{Draft as DraftDef, GetDraftsInfoRequest, GetDraftsInfoResponse},
    service::GrpcService,
};
use serde::Deserialize;
use sqlx::{FromRow, Row};
use time::OffsetDateTime;
use tonic::{Request, Response, Status};
use uuid::Uuid;

#[derive(Debug, FromRow)]
struct Draft {
    id: i64,
    title: String,
    splash_id: Option<Uuid>,
    splash_hex: Option<String>,
    word_count: i32,
    created_at: OffsetDateTime,
    edited_at: Option<OffsetDateTime>,
}

/// Returns the `pending_draft_count`, `deleted_draft_count` and `latest_draft` for a user.
pub async fn get_tag(
    client: &GrpcService,
    request: Request<GetDraftsInfoRequest>,
) -> Result<Response<GetDraftsInfoResponse>, Status> {
    let user_id = request
        .into_inner()
        .id
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`id` is invalid"))?;

    let pg_pool = &client.db_pool;
    let mut txn = pg_pool
        .begin()
        .await
        .map_err(|_| Status::internal("Database error"))?;

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
    .fetch_one(&mut *txn)
    .await
    .map_err(|_| Status::internal("Database error"))?;

    let latest_draft = sqlx::query_as::<_, Draft>(
        r#"
        SELECT
            id,
            title,
            splash_id,
            splash_hex,
            word_count,
            created_at,
            edited_at
        FROM
            stories
        WHERE
            user_id = $1
                AND first_published_at IS NULL
                AND deleted_at IS NULL
        ORDER BY
            edited_at DESC NULLS LAST,
            created_at DESC
        LIMIT 1
        "#,
    )
    .bind(user_id)
    .fetch_one(&mut *txn)
    .await;

    // Throw for internal server error
    if let Err(ref err) = latest_draft {
        if matches!(err, sqlx::Error::RowNotFound) {
            return Err(Status::internal("Database error"));
        }
    }

    txn.commit()
        .await
        .map_err(|_| Status::internal("Database error"))?;

    Ok(Response::new(GetDraftsInfoResponse {
        pending_draft_count: result.get::<i64, _>("pending_draft_count") as u32,
        deleted_draft_count: result.get::<i64, _>("deleted_draft_count") as u32,
        latest_draft: latest_draft.ok().and_then(|draft| {
            Some(DraftDef {
                id: draft.id.to_string(),
                title: draft.title,
                splash_id: draft.splash_id.and_then(|value| Some(value.to_string())),
                splash_hex: draft.splash_hex,
                word_count: draft.word_count as u32,
                created_at: draft.created_at.to_string(),
                edited_at: draft.edited_at.and_then(|value| Some(value.to_string())),
            })
        }),
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

                assert_eq!(response.pending_draft_count, 2_u32);
                assert_eq!(response.deleted_draft_count, 2_u32);
                assert!(response.latest_draft.is_some());
            }),
        )
        .await;
    }
}
