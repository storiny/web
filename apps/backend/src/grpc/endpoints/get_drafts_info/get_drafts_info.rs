use crate::{
    grpc::{
        defs::story_def::v1::{
            Draft as DraftDef,
            GetDraftsInfoRequest,
            GetDraftsInfoResponse,
        },
        service::GrpcService,
    },
    utils::to_iso8601::to_iso8601,
};
use sqlx::{
    FromRow,
    Row,
};
use time::OffsetDateTime;
use tonic::{
    Request,
    Response,
    Status,
};
use tracing::error;
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
#[tracing::instrument(
    name = "GRPC get_drafts_info",
    skip_all,
    fields(
        user_id = tracing::field::Empty
    ),
    err
)]
pub async fn get_drafts_info(
    client: &GrpcService,
    request: Request<GetDraftsInfoRequest>,
) -> Result<Response<GetDraftsInfoResponse>, Status> {
    let user_id_str = request.into_inner().user_id;

    tracing::Span::current().record("user_id", &user_id_str);

    let user_id = user_id_str
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`user_id` is invalid"))?;

    let pg_pool = &client.db_pool;
    let mut txn = pg_pool.begin().await.map_err(|error| {
        error!("unable to begin the transaction: {error:?}");

        Status::internal("Database error")
    })?;

    let result = sqlx::query(
        r#"
SELECT
(
    SELECT COUNT(*)
    FROM stories
    WHERE
        user_id = $1
        AND first_published_at IS NULL
        AND deleted_at IS NULL
) AS "pending_draft_count",
(
    SELECT COUNT(*)
    FROM stories
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
    .map_err(|error| {
        error!("database error: {error:?}");

        Status::internal("Database error")
    })?;

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

    // Throw for database errors.
    if let Err(ref error) = latest_draft {
        if !matches!(error, sqlx::Error::RowNotFound) {
            error!("unable to fetch the latest draft: {error:?}");

            return Err(Status::internal("Database error"));
        }
    }

    txn.commit().await.map_err(|error| {
        error!("unable to commit the transaction: {error:?}");

        Status::internal("Database error")
    })?;

    Ok(Response::new(GetDraftsInfoResponse {
        pending_draft_count: result.get::<i64, _>("pending_draft_count") as u32,
        deleted_draft_count: result.get::<i64, _>("deleted_draft_count") as u32,
        latest_draft: latest_draft.ok().map(|draft| DraftDef {
            id: draft.id.to_string(),
            title: draft.title,
            splash_id: draft.splash_id.map(|value| value.to_string()),
            splash_hex: draft.splash_hex,
            word_count: draft.word_count as u32,
            created_at: to_iso8601(&draft.created_at),
            edited_at: draft.edited_at.map(|value| to_iso8601(&value)),
        }),
    }))
}

#[cfg(test)]
mod tests {
    use crate::{
        grpc::defs::story_def::v1::GetDraftsInfoRequest,
        test_utils::test_grpc_service,
    };
    use sqlx::PgPool;
    use tonic::Request;

    #[sqlx::test(fixtures("get_drafts_info"))]
    async fn can_return_drafts_info(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_drafts_info(Request::new(GetDraftsInfoRequest {
                        user_id: 1_i64.to_string(),
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
