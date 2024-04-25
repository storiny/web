use crate::{
    constants::token::TOKEN_LENGTH,
    grpc::{
        defs::token_def::v1::{
            GetTokenRequest,
            GetTokenResponse,
            TokenType,
        },
        service::GrpcService,
    },
};
use argon2::{
    password_hash::SaltString,
    Argon2,
    PasswordHasher,
};
use sqlx::Row;
use time::OffsetDateTime;
use tonic::{
    Request,
    Response,
    Status,
};
use tracing::error;

/// Returns the token object.
#[tracing::instrument(
    name = "GRPC get_token",
    skip_all,
    fields(
        token_type = tracing::field::Empty
    ),
    err
)]
pub async fn get_token(
    client: &GrpcService,
    request: Request<GetTokenRequest>,
) -> Result<Response<GetTokenResponse>, Status> {
    let request = request.into_inner();
    let token_id = request.identifier;

    // Validate token length.
    if token_id.chars().count() != TOKEN_LENGTH {
        return Err(Status::invalid_argument(
            "invalid token `identifier` length",
        ));
    }

    let token_type = TokenType::try_from(request.r#type)
        .map_err(|_| Status::invalid_argument("`type` is invalid"))?;

    tracing::Span::current().record("token_type", token_type as i32);

    let salt = SaltString::from_b64(&client.config.token_salt).map_err(|error| {
        error!("unable to parse the salt string: {error:?}");
        Status::internal("unable to verify the token")
    })?;

    let hashed_token = Argon2::default()
        .hash_password(token_id.as_bytes(), &salt)
        .map_err(|error| {
            error!("unable to generate token hash: {error:?}");
            Status::internal("unable to verify the token")
        })?;

    match sqlx::query(
        r#"
SELECT expires_at FROM tokens
WHERE id = $1 AND type = $2
"#,
    )
    .bind(hashed_token.to_string())
    .bind(token_type as i16)
    .fetch_one(&client.db_pool)
    .await
    {
        Ok(token) => {
            // Check whether the token has expired.
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
        Err(error) => {
            if matches!(error, sqlx::Error::RowNotFound) {
                return Ok(Response::new(GetTokenResponse {
                    is_valid: false,
                    is_expired: false,
                }));
            }

            error!("database error: {error:?}");

            Err(Status::internal("Database error"))
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::{
        config::get_app_config,
        constants::token::TOKEN_LENGTH,
        grpc::defs::token_def::v1::{
            GetTokenRequest,
            TokenType,
        },
        test_utils::test_grpc_service,
        utils::generate_hashed_token::generate_hashed_token,
    };
    use nanoid::nanoid;
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
                let config = get_app_config().unwrap();
                let (token_id, hashed_token) = generate_hashed_token(&config.token_salt).unwrap();

                // Insert the token.
                let result = sqlx::query(
                    r#"
INSERT INTO tokens (id, type, user_id, expires_at)
VALUES ($1, $2, $3, $4)
"#,
                )
                .bind(&hashed_token)
                .bind(TokenType::EmailVerification as i16)
                .bind(user_id.unwrap())
                .bind(OffsetDateTime::now_utc() + Duration::days(1)) // 24 hours
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_token(Request::new(GetTokenRequest {
                        identifier: token_id.to_string(),
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
                let config = get_app_config().unwrap();
                let (token_id, hashed_token) = generate_hashed_token(&config.token_salt).unwrap();

                // Insert an expired token.
                let result = sqlx::query(
                    r#"
INSERT INTO tokens (id, type, user_id, expires_at)
VALUES ($1, $2, $3, $4)
"#,
                )
                .bind(&hashed_token)
                .bind(TokenType::EmailVerification as i16)
                .bind(user_id.unwrap())
                .bind(OffsetDateTime::now_utc() - Duration::days(1)) // Yesterday
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .get_token(Request::new(GetTokenRequest {
                        identifier: token_id.to_string(),
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
                        identifier: nanoid!(TOKEN_LENGTH).to_string(),
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
