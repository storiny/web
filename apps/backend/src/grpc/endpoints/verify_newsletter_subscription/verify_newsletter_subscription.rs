use crate::{
    constants::token::TOKEN_LENGTH,
    grpc::{
        defs::token_def::v1::{
            VerifyNewsletterSubscriptionRequest,
            VerifyNewsletterSubscriptionResponse,
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
use tracing::{
    error,
    warn,
};

/// Verifies a newsletter subscription for a user.
#[tracing::instrument(name = "GRPC verify_newsletter_subscription", skip_all, err)]
pub async fn verify_newsletter_subscription(
    client: &GrpcService,
    request: Request<VerifyNewsletterSubscriptionRequest>,
) -> Result<Response<VerifyNewsletterSubscriptionResponse>, Status> {
    let pg_pool = &client.db_pool;
    let mut txn = pg_pool.begin().await.map_err(|error| {
        error!("unable to begin the transaction: {error:?}");
        Status::internal("Database error")
    })?;

    let token_id = request.into_inner().identifier;

    // Validate token length.
    if token_id.chars().count() != TOKEN_LENGTH {
        warn!("token length does not match");
        return Ok(Response::new(VerifyNewsletterSubscriptionResponse {
            is_valid: false,
        }));
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
SELECT blog_id, email
FROM newsletter_tokens
WHERE
    id = $1
    AND expires_at > NOW()
"#,
    )
    .bind(hashed_token.to_string())
    .fetch_one(&mut *txn)
    .await;

    if let Err(error) = token_result {
        if matches!(error, sqlx::Error::RowNotFound) {
            return Ok(Response::new(VerifyNewsletterSubscriptionResponse {
                is_valid: false,
            }));
        }

        error!("database error: {error:?}");

        return Err(Status::internal("Database error"));
    }

    // This can be safely unwrapped here.
    #[allow(clippy::unwrap_used)]
    let token_result = token_result.unwrap();

    match sqlx::query(
        r#"
WITH inserted_subscriber as (
    INSERT INTO subscribers (blog_id, email)
    VALUES ($1, $2)
)
-- Delete the token
DELETE FROM newsletter_tokens
WHERE id = $3
"#,
    )
    .bind(token_result.get::<i64, _>("blog_id"))
    .bind(token_result.get::<String, _>("email"))
    .bind(hashed_token.to_string())
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

            Ok(Response::new(VerifyNewsletterSubscriptionResponse {
                is_valid: true,
            }))
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::{
        config::get_app_config,
        grpc::defs::token_def::v1::VerifyNewsletterSubscriptionRequest,
        test_utils::test_grpc_service,
        utils::generate_hashed_token::generate_hashed_token,
    };
    use sqlx::{
        PgPool,
        Row,
    };
    use time::{
        Duration,
        OffsetDateTime,
    };
    use tonic::Request;

    #[sqlx::test(fixtures("verify_newsletter_subscription"))]
    async fn can_verify_newsletter_subscription(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                let config = get_app_config().unwrap();
                let (token_id, hashed_token) = generate_hashed_token(&config.token_salt).unwrap();

                // Insert token.
                let result = sqlx::query(
                    r#"
INSERT INTO newsletter_tokens (id, email, blog_id, expires_at)
VALUES ($1, $2, $3, $4)
"#,
                )
                .bind(&hashed_token)
                .bind("someone@example.com")
                .bind(2_i64)
                .bind(OffsetDateTime::now_utc() + Duration::days(1)) // 24 hours
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .verify_newsletter_subscription(Request::new(
                        VerifyNewsletterSubscriptionRequest {
                            identifier: token_id.to_string(),
                        },
                    ))
                    .await;

                assert!(response.is_ok());

                // Should insert a subscriber.
                let result = sqlx::query(
                    r#"
SELECT EXISTS (
    SELECT FROM subscribers
    WHERE blog_id = $1
)
"#,
                )
                .bind(2_i64)
                .fetch_one(&pool)
                .await
                .unwrap();

                assert!(result.get::<bool, _>("exists"));

                // Should delete the token.
                let result = sqlx::query(
                    r#"
SELECT EXISTS (
    SELECT FROM newsletter_tokens
    WHERE blog_id = $1
)
"#,
                )
                .bind(2_i64)
                .fetch_one(&pool)
                .await
                .unwrap();

                assert!(!result.get::<bool, _>("exists"));
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("verify_newsletter_subscription"))]
    async fn can_handle_an_expired_token(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                let config = get_app_config().unwrap();
                let (token_id, hashed_token) = generate_hashed_token(&config.token_salt).unwrap();

                // Insert an expired token.
                let result = sqlx::query(
                    r#"
INSERT INTO newsletter_tokens (id, email, blog_id, expires_at)
VALUES ($1, $2, $3, $4)
"#,
                )
                .bind(&hashed_token)
                .bind("someone@example.com")
                .bind(2_i64)
                .bind(OffsetDateTime::now_utc() - Duration::days(1)) // Yesterday
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                let response = client
                    .verify_newsletter_subscription(Request::new(
                        VerifyNewsletterSubscriptionRequest {
                            identifier: token_id.to_string(),
                        },
                    ))
                    .await
                    .unwrap()
                    .into_inner();

                assert!(!response.is_valid);
            }),
        )
        .await;
    }
}
