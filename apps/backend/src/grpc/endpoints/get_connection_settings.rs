use crate::{
    grpc::{
        defs::{
            connection_def::v1::ConnectionSetting,
            connection_settings_def::v1::{
                GetConnectionSettingsRequest,
                GetConnectionSettingsResponse,
            },
        },
        service::GrpcService,
    },
    utils::{
        generate_connection_url::generate_connection_url,
        to_iso8601::to_iso8601,
    },
};
use sqlx::{
    postgres::PgRow,
    Row,
};
use time::OffsetDateTime;
use tonic::{
    Request,
    Response,
    Status,
};
use tracing::error;

/// Returns the connection settings for a user.
#[tracing::instrument(
    name = "GRPC get_connection_settings",
    skip_all,
    fields(
        user_id = tracing::field::Empty
    ),
    err
)]
pub async fn get_connection_settings(
    client: &GrpcService,
    request: Request<GetConnectionSettingsRequest>,
) -> Result<Response<GetConnectionSettingsResponse>, Status> {
    let user_id_str = request.into_inner().user_id;

    tracing::Span::current().record("user_id", &user_id_str);

    let user_id = user_id_str
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`user_id` is invalid"))?;

    let connections = sqlx::query(
        r#"
SELECT
    id,
    provider,
    provider_identifier,
    display_name,
    hidden,
    created_at
FROM
    connections
WHERE
    user_id = $1
"#,
    )
    .bind(user_id)
    .map(|row: PgRow| ConnectionSetting {
        id: row.get::<i64, _>("id").to_string(),
        provider: row.get::<String, _>("provider"),
        hidden: row.get::<bool, _>("hidden"),
        display_name: row.get("display_name"),
        url: generate_connection_url(
            row.get::<String, _>("provider").as_str(),
            row.get::<String, _>("provider_identifier").as_str(),
        ),
        created_at: to_iso8601(&row.get::<OffsetDateTime, _>("created_at")),
    })
    .fetch_all(&client.db_pool)
    .await
    .map_err(|error| {
        error!("unable to fetch connections: {error:?}");

        Status::internal("Database error")
    })?;

    Ok(Response::new(GetConnectionSettingsResponse { connections }))
}

#[cfg(test)]
mod tests {
    use crate::{
        constants::connection_provider::ConnectionProvider,
        grpc::defs::{
            connection_def::v1::ConnectionSetting,
            connection_settings_def::v1::{
                GetConnectionSettingsRequest,
                GetConnectionSettingsResponse,
            },
        },
        test_utils::test_grpc_service,
        utils::{
            generate_connection_url::generate_connection_url,
            to_iso8601::to_iso8601,
        },
    };
    use sqlx::PgPool;
    use time::OffsetDateTime;
    use tonic::Request;

    #[sqlx::test]
    async fn can_return_connection_settings(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                let created_at = OffsetDateTime::now_utc();

                // Insert a connection.
                let result = sqlx::query(
                    r#"
INSERT INTO connections (
    id,
    provider,
    provider_identifier,
    display_name,
    hidden,
    user_id,
    created_at
)
VALUES ($1, $2, $3, $4, $5, $6, $7)
"#,
                )
                .bind(2_i64)
                .bind(ConnectionProvider::GitHub.to_string())
                .bind("storiny")
                .bind("Storiny")
                .bind(true)
                .bind(user_id.unwrap())
                .bind(created_at)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_connection_settings(Request::new(GetConnectionSettingsRequest {
                        user_id: user_id.unwrap().to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(
                    response,
                    GetConnectionSettingsResponse {
                        connections: vec![ConnectionSetting {
                            id: 2_i64.to_string(),
                            provider: ConnectionProvider::GitHub.to_string(),
                            hidden: true,
                            display_name: "Storiny".to_string(),
                            url: generate_connection_url("github", "storiny"),
                            created_at: to_iso8601(&created_at),
                        }]
                    }
                );
            }),
        )
        .await;
    }
}
