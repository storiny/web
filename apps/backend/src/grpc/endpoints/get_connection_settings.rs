use crate::{
    grpc::{
        defs::{
            connection_def::v1::{
                ConnectionSetting,
                Provider,
            },
            connection_settings_def::v1::{
                GetConnectionSettingsRequest,
                GetConnectionSettingsResponse,
            },
        },
        service::GrpcService,
    },
    utils::generate_connection_url::generate_connection_url,
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

/// Returns the connection settings for a user.
pub async fn get_connection_settings(
    client: &GrpcService,
    request: Request<GetConnectionSettingsRequest>,
) -> Result<Response<GetConnectionSettingsResponse>, Status> {
    let user_id = request
        .into_inner()
        .id
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`id` is invalid"))?;

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
        provider: row.get::<i16, _>("provider") as i32,
        hidden: row.get::<bool, _>("hidden"),
        display_name: row.get("display_name"),
        url: if let Ok(provider) = Provider::try_from(row.get::<i16, _>("provider") as i32) {
            generate_connection_url(
                provider,
                row.get::<String, _>("provider_identifier").as_str(),
            )
        } else {
            "/".to_string()
        },
        created_at: row.get::<OffsetDateTime, _>("created_at").to_string(),
    })
    .fetch_all(&client.db_pool)
    .await
    .map_err(|_| Status::internal("Database error"))?;

    Ok(Response::new(GetConnectionSettingsResponse { connections }))
}

#[cfg(test)]
mod tests {
    use crate::{
        grpc::defs::{
            connection_def::v1::{
                ConnectionSetting,
                Provider,
            },
            connection_settings_def::v1::{
                GetConnectionSettingsRequest,
                GetConnectionSettingsResponse,
            },
        },
        test_utils::test_grpc_service,
        utils::generate_connection_url::generate_connection_url,
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

                // Insert a connection
                let result = sqlx::query(
                    r#"
                    INSERT INTO connections(
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
                .bind(Provider::Github as i16)
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
                        id: 1_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(
                    response,
                    GetConnectionSettingsResponse {
                        connections: vec![ConnectionSetting {
                            id: 2_i64.to_string(),
                            provider: Provider::Github as i32,
                            hidden: true,
                            display_name: "Storiny".to_string(),
                            url: generate_connection_url(Provider::Github, "storiny"),
                            created_at: created_at.to_string(),
                        }]
                    }
                );
            }),
        )
        .await;
    }
}
