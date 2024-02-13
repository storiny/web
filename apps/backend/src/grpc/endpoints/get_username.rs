use crate::grpc::{
    defs::user_def::v1::{
        GetUsernameRequest,
        GetUsernameResponse,
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

/// Returns the user's username using the ID.
#[tracing::instrument(
    name = "GRPC get_username",
    skip_all,
    fields(
        user_id = tracing::field::Empty
    ),
    err
)]
pub async fn get_username(
    client: &GrpcService,
    request: Request<GetUsernameRequest>,
) -> Result<Response<GetUsernameResponse>, Status> {
    let user_id_str = request.into_inner().user_id;

    tracing::Span::current().record("user_id", &user_id_str);

    let user_id = user_id_str
        .parse::<i64>()
        .map_err(|_| Status::invalid_argument("`user_id` is invalid"))?;

    let user = sqlx::query(
        r#"
SELECT username
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

    Ok(Response::new(GetUsernameResponse {
        username: user.get::<String, _>("username"),
    }))
}

#[cfg(test)]
mod tests {
    use crate::{
        grpc::defs::user_def::v1::GetUsernameRequest,
        test_utils::test_grpc_service,
    };
    use sqlx::{
        PgPool,
        Row,
    };
    use tonic::{
        Code,
        Request,
    };

    #[sqlx::test]
    async fn can_return_username(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                // Insert a user.
                let result = sqlx::query(
                    r#"
INSERT INTO users (name, username, email)
VALUES ($1, $2, $3)
RETURNING id
"#,
                )
                .bind("Test user")
                .bind("test_user")
                .bind("test@example.com")
                .fetch_one(&pool)
                .await
                .unwrap();

                let user_id = result.get::<i64, _>("id");

                let response = client
                    .get_username(Request::new(GetUsernameRequest {
                        user_id: user_id.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.username, "test_user");
            }),
        )
        .await;
    }

    #[sqlx::test]
    async fn can_reject_an_invalid_user_id(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_username(Request::new(GetUsernameRequest {
                        user_id: "12345".to_string(),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }
}
