use crate::{
    constants::token::TOKEN_LENGTH,
    grpc::{
        defs::token_def::v1::{
            TokenType,
            VerifyEmailRequest,
            VerifyEmailResponse,
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
use tonic::{
    Request,
    Response,
    Status,
};
use tracing::error;

/// Verifies an email for a user.
#[tracing::instrument(name = "GRPC verify_email", skip_all, err)]
pub async fn verify_email(
    client: &GrpcService,
    request: Request<VerifyEmailRequest>,
) -> Result<Response<VerifyEmailResponse>, Status> {
    let pg_pool = &client.db_pool;
    let mut txn = pg_pool.begin().await.map_err(|error| {
        error!("unable to begin the transaction: {error:?}");
        Status::internal("Database error")
    })?;

    let token_id = request.into_inner().identifier;

    // Validate token length.
    if token_id.chars().count() != TOKEN_LENGTH {
        return Err(Status::invalid_argument(
            "invalid token `identifier` length",
        ));
    }

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

    let token_result = sqlx::query(
        r#"
SELECT user_id
FROM tokens
WHERE
    id = $1
    AND type = $2
    AND expires_at > NOW()
"#,
    )
    .bind(hashed_token.to_string())
    .bind(TokenType::EmailVerification as i16)
    .fetch_one(&mut *txn)
    .await
    .map_err(|error| {
        if matches!(error, sqlx::Error::RowNotFound) {
            Status::not_found("Token not found")
        } else {
            error!("database error: {error:?}");
            Status::internal("Database error")
        }
    })?;

    match sqlx::query(
        r#"
WITH updated_user as (
    UPDATE users
    SET email_verified = TRUE
    WHERE id = $1
)
-- Delete the token
DELETE FROM tokens
WHERE
    id = $2
    AND type = $3
"#,
    )
    .bind(token_result.get::<i64, _>("user_id"))
    .bind(hashed_token.to_string())
    .bind(TokenType::EmailVerification as i16)
    .execute(&mut *txn)
    .await
    .map_err(|_| Status::internal("Database error"))?
    .rows_affected()
    {
        0 => {
            error!("token not found");
            Err(Status::internal("Internal error"))
        }
        _ => {
            txn.commit().await.map_err(|error| {
                error!("unable to commit the transaction: {error:?}");
                Status::internal("Database error")
            })?;

            Ok(Response::new(VerifyEmailResponse {}))
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::{
        config::get_app_config,
        constants::token::TOKEN_LENGTH,
        grpc::defs::token_def::v1::{
            TokenType,
            VerifyEmailRequest,
        },
        test_utils::test_grpc_service,
        utils::generate_hashed_token::generate_hashed_token,
    };
    use nanoid::nanoid;
    use sqlx::{
        PgPool,
        Row,
    };
    use time::{
        Duration,
        OffsetDateTime,
    };
    use tonic::{
        Code,
        Request,
    };

    #[sqlx::test]
    async fn can_verify_email(pool: PgPool) {
        test_grpc_service(
            pool,
            true,
            Box::new(|mut client, pool, _, user_id| async move {
                let config = get_app_config().unwrap();
                let (token_id, hashed_token) = generate_hashed_token(&config.token_salt).unwrap();

                // Insert token.
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
                    .verify_email(Request::new(VerifyEmailRequest {
                        identifier: token_id.to_string(),
                    }))
                    .await;

                assert!(response.is_ok());

                // Should update the user.
                let result = sqlx::query(
                    r#"
SELECT email_verified FROM users
WHERE id = $1
"#,
                )
                .bind(user_id.unwrap())
                .fetch_one(&pool)
                .await
                .unwrap();

                assert!(result.get::<bool, _>("email_verified"))
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
                    .verify_email(Request::new(VerifyEmailRequest {
                        identifier: token_id.to_string(),
                    }))
                    .await;

                assert!(response.is_err());
                assert_eq!(response.unwrap_err().code(), Code::NotFound);
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
                    .verify_email(Request::new(VerifyEmailRequest {
                        identifier: nanoid!(TOKEN_LENGTH).to_string(),
                    }))
                    .await;

                assert!(response.is_err());
                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }
}
