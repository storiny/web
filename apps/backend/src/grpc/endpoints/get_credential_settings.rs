use crate::grpc::{
    defs::credential_settings_def::v1::{
        GetCredentialSettingsRequest,
        GetCredentialSettingsResponse,
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

/// Returns the credential settings for a user.
#[tracing::instrument(
    name = "GRPC get_credential_settings",
    skip_all,
    fields(
        user_id = tracing::field::Empty
    ),
    err
)]
pub async fn get_credential_settings(
    client: &GrpcService,
    request: Request<GetCredentialSettingsRequest>,
) -> Result<Response<GetCredentialSettingsResponse>, Status> {
    let user_id_str = request.into_inner().user_id;

    tracing::Span::current().record("user_id", &user_id_str);

    let user_id = user_id_str
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`user_id` is invalid"))?;

    let user = sqlx::query(
        r#"
SELECT
    password IS NOT NULL "has_password",
    mfa_enabled,
    login_apple_id,
    login_google_id
FROM users
WHERE id = $1
"#,
    )
    .bind(user_id)
    .fetch_one(&client.db_pool)
    .await
    .map_err(|error| {
        if matches!(error, sqlx::Error::RowNotFound) {
            Status::not_found("User not found")
        } else {
            error!("database error: {error:?}");

            Status::internal("Database error")
        }
    })?;

    Ok(Response::new(GetCredentialSettingsResponse {
        has_password: user.get::<bool, _>("has_password"),
        mfa_enabled: user.get::<bool, _>("mfa_enabled"),
        login_apple_id: user.get::<Option<String>, _>("login_apple_id"),
        login_google_id: user.get::<Option<String>, _>("login_google_id"),
    }))
}

#[cfg(test)]
mod tests {
    use crate::{
        grpc::defs::credential_settings_def::v1::{
            GetCredentialSettingsRequest,
            GetCredentialSettingsResponse,
        },
        test_utils::test_grpc_service,
    };
    use sqlx::{
        PgPool,
        Row,
    };
    use tonic::Request;

    #[sqlx::test]
    async fn can_return_credential_settings(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                // Insert the user.
                let result = sqlx::query(
                    r#"
INSERT INTO users (
    name,
    username,
    email,
    password,
    login_apple_id,
    login_google_id,
    mfa_enabled
)
VALUES ($1, $2, $3, $4, $5, $6, TRUE)
RETURNING id
"#,
                )
                .bind("Some user".to_string())
                .bind("some_user".to_string())
                .bind("someone@example.com".to_string())
                .bind("some_hashed_password")
                .bind("some_apple_id")
                .bind("some_google_id")
                .fetch_one(&pool)
                .await
                .unwrap();

                let user_id = result.get::<i64, _>("id");

                let response = client
                    .get_credential_settings(Request::new(GetCredentialSettingsRequest {
                        user_id: user_id.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(
                    response,
                    GetCredentialSettingsResponse {
                        has_password: true,
                        mfa_enabled: true,
                        login_apple_id: Some("some_apple_id".to_string()),
                        login_google_id: Some("some_google_id".to_string()),
                    }
                );
            }),
        )
        .await;
    }
}
