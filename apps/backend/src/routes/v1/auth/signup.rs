use crate::{
    amqp::consumers::templated_email::{
        TemplatedEmailMessage,
        TEMPLATED_EMAIL_QUEUE_NAME,
    },
    constants::{
        email_template::EmailTemplate,
        reserved_keywords::RESERVED_KEYWORDS,
        resource_lock::ResourceLock,
        username_regex::USERNAME_REGEX,
    },
    error::{
        AppError,
        FormErrorResponse,
        ToastErrorResponse,
    },
    grpc::defs::token_def::v1::TokenType,
    middlewares::identity::identity::Identity,
    models::email_templates::email_verification::EmailVerificationEmailTemplateData,
    utils::{
        generate_hashed_token::generate_hashed_token,
        incr_resource_lock_attempts::incr_resource_lock_attempts,
        is_resource_locked::is_resource_locked,
    },
    AppState,
};
use actix_web::{
    http::StatusCode,
    post,
    web,
    HttpRequest,
    HttpResponse,
};
use actix_web_validator::Json;
use argon2::{
    password_hash::{
        rand_core::OsRng,
        SaltString,
    },
    Argon2,
    PasswordHasher,
};
use chrono::{
    Datelike,
    Local,
};
use deadpool_lapin::lapin::{
    options::BasicPublishOptions,
    BasicProperties,
};
use serde::{
    Deserialize,
    Serialize,
};
use slugify::slugify;
use sqlx::Row;
use time::{
    Duration,
    OffsetDateTime,
};
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(email(message = "Invalid e-mail"))]
    #[validate(length(min = 3, max = 300, message = "Invalid e-mail length"))]
    email: String,
    #[validate(length(min = 3, max = 32, message = "Invalid name length"))]
    name: String,
    #[validate(regex = "USERNAME_REGEX")]
    #[validate(length(min = 3, max = 24, message = "Invalid username length"))]
    username: String,
    #[validate(length(min = 6, max = 64, message = "Invalid password length"))]
    password: String,
    #[validate(range(min = 18, max = 320, message = "Invalid WPM range"))]
    wpm: u16,
}

#[post("/v1/auth/signup")]
#[tracing::instrument(
    name = "POST /v1/auth/signup",
    skip_all,
    fields(
        email = %payload.email,
        name = %payload.name,
        username = %payload.username,
        wpm = %payload.wpm
    ),
    err
)]
async fn post(
    req: HttpRequest,
    payload: Json<Request>,
    data: web::Data<AppState>,
    user: Option<Identity>,
) -> Result<HttpResponse, AppError> {
    // Return early if the user is already logged-in.
    if user.is_some() {
        return Err(ToastErrorResponse::new(None, "You are already logged in").into());
    }

    let client_ip = {
        let conn_info = req.connection_info();
        let real_ip = conn_info.realip_remote_addr().unwrap_or_default();
        real_ip.to_string()
    };

    if is_resource_locked(&data.redis, ResourceLock::Signup, &client_ip).await? {
        return Err(ToastErrorResponse::new(
            Some(StatusCode::TOO_MANY_REQUESTS),
            "You are being rate-limited. Try again later.",
        )
        .into());
    }

    let mut form_errors: Vec<(&str, &str)> = vec![];

    // Check for the uniqueness of the e-mail.
    {
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM users
    WHERE email = $1
)
"#,
        )
        .bind(&payload.email)
        .fetch_one(&data.db_pool)
        .await?;

        if result.get::<bool, _>("exists") {
            form_errors.push(("email", "This e-mail is already in use"));
        }
    }

    let slugged_username = slugify!(&payload.username, separator = "_", max_length = 24);

    // Check of a valid username.
    if RESERVED_KEYWORDS.contains(&slugged_username.as_str()) {
        form_errors.push(("username", "This username is not available"));
    } else {
        let result = sqlx::query(
            r#"
SELECT EXISTS (
    SELECT 1 FROM users
    WHERE username = $1
)
"#,
        )
        .bind(&slugged_username)
        .fetch_one(&data.db_pool)
        .await?;

        if result.get::<bool, _>("exists") {
            form_errors.push(("username", "This username is already in use"));
        }
    }

    if !form_errors.is_empty() {
        return Err(FormErrorResponse::new(Some(StatusCode::CONFLICT), form_errors).into());
    }

    let salt = SaltString::generate(&mut OsRng);
    let hashed_password = Argon2::default()
        .hash_password(payload.password.as_bytes(), &salt)
        .map_err(|error| AppError::InternalError(error.to_string()))?;

    let (token_id, hashed_token) = generate_hashed_token(&data.config.token_salt)?;

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    // Insert the user and the email verification token.
    sqlx::query(
        r#"
WITH inserted_user AS (
    INSERT INTO users (email, name, username, password, wpm)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
)
INSERT INTO tokens (id, type, user_id, expires_at)
SELECT $6, $7, (SELECT id FROM inserted_user), $8
"#,
    )
    .bind(&payload.email)
    .bind(&payload.name)
    .bind(&slugged_username)
    .bind(hashed_password.to_string())
    .bind(payload.wpm as i32)
    .bind(&hashed_token)
    .bind(TokenType::EmailVerification as i16)
    .bind(OffsetDateTime::now_utc() + Duration::days(1)) // 24 hours
    .execute(&mut *txn)
    .await?;

    // Increment the signup attempts.
    incr_resource_lock_attempts(&data.redis, ResourceLock::Signup, &client_ip).await?;

    // Push an email job.

    let full_name = payload.name.clone();
    let first_name = full_name.split(' ').collect::<Vec<_>>()[0];
    let verification_link = format!(
        "{}/auth/verify-email/{}",
        data.config.web_server_url, token_id
    );

    let template_data = serde_json::to_string(&EmailVerificationEmailTemplateData {
        email: payload.email.to_string(),
        link: verification_link,
        name: first_name.to_string(),
        copyright_year: Local::now().year().to_string(),
    })
    .map_err(|error| {
        AppError::InternalError(format!("unable to serialize the template data: {error:?}"))
    })?;

    // Publish a message for the email job.
    {
        let channel = {
            let lapin = &data.lapin;
            let connection = lapin.get().await?;
            connection.create_channel().await?
        };

        let message = serde_json::to_vec(&TemplatedEmailMessage {
            destination: payload.email.to_string(),
            template: EmailTemplate::EmailVerification.to_string(),
            template_data,
        })
        .map_err(|error| {
            AppError::InternalError(format!("unable to serialize the message: {error:?}"))
        })?;

        channel
            .basic_publish(
                "",
                TEMPLATED_EMAIL_QUEUE_NAME,
                BasicPublishOptions::default(),
                &message,
                BasicProperties::default(),
            )
            .await?;
    }

    txn.commit().await?;

    Ok(HttpResponse::Created().finish())
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_form_error_response,
        exceed_resource_lock_attempts,
        get_resource_lock_attempts,
        init_app_for_test,
        RedisTestContext,
    };
    use actix_web::test;
    use argon2::{
        PasswordHash,
        PasswordVerifier,
    };
    use sqlx::PgPool;
    use std::net::{
        Ipv4Addr,
        SocketAddr,
        SocketAddrV4,
    };
    use storiny_macros::test_context;

    #[sqlx::test]
    async fn can_reject_a_signup_request_when_the_email_is_already_in_use(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false, None).await.0;

        // Insert the user.
        sqlx::query(
            r#"
INSERT INTO users (name, username, email)
VALUES ($1, $2, $3)
"#,
        )
        .bind("Some name")
        .bind("some_username")
        .bind("someone@example.com")
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .uri("/v1/auth/signup")
            .set_json(Request {
                email: "someone@example.com".to_string(),
                name: "Some user".to_string(),
                username: "other_name".to_string(),
                password: "some_secret_password".to_string(),
                wpm: 270,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(res, vec![("email", "This e-mail is already in use")]).await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_signup_request_when_the_username_is_already_in_use(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false, None).await.0;

        // Insert the user.
        sqlx::query(
            r#"
INSERT INTO users (name, username, email)
VALUES ($1, $2, $3)
"#,
        )
        .bind("Some name")
        .bind("some_username")
        .bind("someone@example.com")
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .uri("/v1/auth/signup")
            .set_json(Request {
                email: "other@example.com".to_string(),
                name: "Some user".to_string(),
                username: "some_username".to_string(),
                password: "some_secret_password".to_string(),
                wpm: 270,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(res, vec![("username", "This username is already in use")])
            .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_signup_request_for_a_reserved_usernames(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let app = init_app_for_test(post, pool, false, false, None).await.0;

        let req = test::TestRequest::post()
            .uri("/v1/auth/signup")
            .set_json(Request {
                email: "someone@example.com".to_string(),
                name: "Some user".to_string(),
                username: RESERVED_KEYWORDS[10].to_string(),
                password: "some_secret_password".to_string(),
                wpm: 270,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(res, vec![("username", "This username is not available")]).await;

        Ok(())
    }

    mod serial {
        use super::*;

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_signup_using_valid_details(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let app = init_app_for_test(post, pool, false, false, None).await.0;

            let req = test::TestRequest::post()
                .peer_addr(SocketAddr::from(SocketAddrV4::new(
                    Ipv4Addr::new(8, 8, 8, 8),
                    8080,
                )))
                .uri("/v1/auth/signup")
                .set_json(Request {
                    email: "someone@example.com".to_string(),
                    name: "Some user".to_string(),
                    username: "some_user".to_string(),
                    password: "some_secret_password".to_string(),
                    wpm: 270,
                })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // User should be present in the database.
            let user = sqlx::query(
                r#"
SELECT email, name, password, wpm FROM users
WHERE username = $1
"#,
            )
            .bind("some_user")
            .fetch_one(&mut *conn)
            .await?;

            assert_eq!(user.get::<String, _>("name"), "Some user".to_string());
            assert!(
                Argon2::default()
                    .verify_password(
                        "some_secret_password".as_bytes(),
                        &PasswordHash::new(&user.get::<String, _>("password")).unwrap(),
                    )
                    .is_ok()
            );

            // Should also insert an e-mail verification token.
            let token = sqlx::query(
                r#"
SELECT EXISTS (
    SELECT 1 FROM tokens
    WHERE type = $1
)
"#,
            )
            .bind(TokenType::EmailVerification as i16)
            .fetch_one(&mut *conn)
            .await?;

            assert!(token.get::<bool, _>("exists"));

            // Should increment the signup attempts.
            let result =
                get_resource_lock_attempts(&ctx.redis_pool, ResourceLock::Signup, "8.8.8.8")
                    .await
                    .unwrap();

            assert_eq!(result, 1);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_a_signup_request_on_exceeding_the_max_attempts(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let app = init_app_for_test(post, pool, false, false, None).await.0;

            exceed_resource_lock_attempts(&ctx.redis_pool, ResourceLock::Signup, "8.8.8.8").await;

            let req = test::TestRequest::post()
                .peer_addr(SocketAddr::from(SocketAddrV4::new(
                    Ipv4Addr::new(8, 8, 8, 8),
                    8080,
                )))
                .uri("/v1/auth/signup")
                .set_json(Request {
                    email: "someone@example.com".to_string(),
                    name: "Some user".to_string(),
                    username: "some_user".to_string(),
                    password: "some_secret_password".to_string(),
                    wpm: 270,
                })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert_eq!(res.status(), StatusCode::TOO_MANY_REQUESTS);

            Ok(())
        }
    }
}
