use crate::grpc::{
    defs::token_def::v1::{
        GetTokenRequest,
        GetTokenResponse,
        TokenType,
    },
    service::GrpcService,
};
use sqlx::Row;
use time::OffsetDateTime;
use tonic::{
    Request,
    Response,
    Status,
};

/// Returns the token object.
pub async fn get_token(
    client: &GrpcService,
    request: Request<GetTokenRequest>,
) -> Result<Response<GetTokenResponse>, Status> {
    let request = request.into_inner();
    let token_id = request.identifier;
    let token_type = TokenType::try_from(request.r#type)
        .map_err(|_| Status::invalid_argument("`type` is invalid"))?;

    match sqlx::query(
        r#"
        SELECT expires_at FROM tokens
        WHERE id = $1 AND type = $2
        "#,
    )
    .bind(token_id)
    .bind(token_type as i16)
    .fetch_one(&client.db_pool)
    .await
    {
        Ok(token) => {
            // Check whether the token has expired
            if token.get::<OffsetDateTime, _>("expires_at") < OffsetDateTime::now_utc() {
                Ok(Response::new(GetTokenResponse {
                    is_valid: false,
                    is_expired: true,
                }))
            } else {
                Ok(Response::new(GetTokenResponse {
                    is_valid: true,
                    is_expired: false,
                }))
            }
        }
        Err(kind) => {
            if matches!(kind, sqlx::Error::RowNotFound) {
                Ok(Response::new(GetTokenResponse {
                    is_valid: false,
                    is_expired: false,
                }))
            } else {
                Err(Status::internal("Database error"))
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::{
        grpc::defs::token_def::v1::{
            GetTokenRequest,
            TokenType,
        },
        test_utils::test_grpc_service,
    };
    use sqlx::PgPool;
    use time::{
        Duration,
        OffsetDateTime,
    };
    use tonic::Request;

    #[sqlx::test]
    async fn can_return_token(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Insert token
                let result = sqlx::query(
                    r#"
                    INSERT INTO tokens (id, type, user_id, expires_at)
                    VALUES ($1, $2, $3, $4)
                    "#,
                )
                .bind("sample".to_string())
                .bind(TokenType::EmailVerification as i16)
                .bind(user_id.unwrap())
                .bind(OffsetDateTime::now_utc() + Duration::days(1)) // 24 hours
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_token(Request::new(GetTokenRequest {
                        identifier: "sample".to_string(),
                        r#type: TokenType::EmailVerification as i32,
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert!(!response.is_expired);
                assert!(response.is_valid);
            }),
        )
        .await;
    }

    #[sqlx::test]
    async fn can_handle_an_expired_token(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                // Insert an expired token
                let result = sqlx::query(
                    r#"
                    INSERT INTO tokens (id, type, user_id, expires_at)
                    VALUES ($1, $2, $3, $4)
                    "#,
                )
                .bind("sample".to_string())
                .bind(TokenType::EmailVerification as i16)
                .bind(user_id.unwrap())
                .bind(OffsetDateTime::now_utc() - Duration::days(1)) // Yesterday
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_token(Request::new(GetTokenRequest {
                        identifier: "sample".to_string(),
                        r#type: TokenType::EmailVerification as i32,
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert!(response.is_expired);
                assert!(!response.is_valid);
            }),
        )
        .await;
    }

    #[sqlx::test]
    async fn can_handle_a_missing_token(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_token(Request::new(GetTokenRequest {
                        identifier: "invalid".to_string(),
                        r#type: TokenType::EmailVerification as i32,
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert!(!response.is_expired);
                assert!(!response.is_valid);
            }),
        )
        .await;
    }
}
