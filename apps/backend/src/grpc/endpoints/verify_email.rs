use crate::grpc::defs::token_def::v1::{TokenType, VerifyEmailRequest, VerifyEmailResponse};
use crate::grpc::service::GrpcService;
use serde::Deserialize;
use sqlx::{FromRow, Row};
use tonic::{Request, Response, Status};

/// Verifies an email for a user.
pub async fn verify_email(
    client: &GrpcService,
    request: Request<VerifyEmailRequest>,
) -> Result<Response<VerifyEmailResponse>, Status> {
    let pg_pool = &client.db_pool;
    let mut txn = pg_pool.begin().await?;
    let token_id = request.into_inner().identifier;
    let token_result = sqlx::query(
        r#"
        SELECT user_id FROM tokens
        WHERE id = $1 AND type = $2
        "#,
    )
    .bind(token_id)
    .bind(TokenType::EmailVerification as i16)
    .fetch_one(&mut *txn)
    .await;

    if let Err(ref err) = token_result {
        if matches!(err, sqlx::Error::RowNotFound) {
            return Err(Status::not_found("Token not found"));
        }

        return Err(Status::internal("Database error"));
    }

    match sqlx::query(
        r#"
        WITH updated_user as (
            UPDATE users
            SET email_verified = TRUE
            WHERE id = (SELECT user_id FROM token)
        )
        DELETE FROM tokens
        WHERE id = $1 AND type = $2
        "#,
    )
    .bind(token_id)
    .bind(TokenType::EmailVerification as i16)
    .execute(&client.db_pool)
    .await
    .map_err(|_| Status::internal("Database error"))?
    .rows_affected()
    {
        // 0 => Err(Status::),
        _ => Ok(Response::new(VerifyEmailResponse {})),
    }
}

#[cfg(test)]
mod tests {
    use crate::grpc::defs::token_def::v1::{GetTokenRequest, TokenType};
    use crate::test_utils::test_grpc_service;
    use sqlx::PgPool;
    use time::{Duration, OffsetDateTime};
    use tonic::Request;

    #[sqlx::test]
    async fn can_return_token(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, user_id| async move {
                // Insert token
                let result = sqlx::query(
                    r#"
                    INSERT INTO tokens(id, type, user_id, expires_at)
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
            Box::new(|mut client, pool, user_id| async move {
                // Insert an expired token
                let result = sqlx::query(
                    r#"
                    INSERT INTO tokens(id, type, user_id, expires_at)
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
            Box::new(|mut client, _, _| async move {
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
