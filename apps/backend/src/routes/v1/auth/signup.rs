use crate::{
    constants::{
        email_source::EMAIL_SOURCE,
        email_templates::EmailTemplate,
        reserved_usernames::RESERVED_USERNAMES,
        token_type::TokenType,
    },
    error::{
        AppError,
        FormErrorResponse,
        ToastErrorResponse,
    },
    middleware::identity::identity::Identity,
    AppState,
};
use actix_web::{
    http::header::ContentType,
    post,
    web,
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
use email_address::EmailAddress;
use lazy_static::lazy_static;
use nanoid::nanoid;
use regex::Regex;
use rusoto_ses::{
    Destination,
    SendTemplatedEmailRequest,
    Ses,
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

lazy_static! {
    static ref USERNAME_REGEX: Regex = Regex::new(r"^[\w_]+$").unwrap();
}

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

#[derive(Debug, Serialize)]
struct EmailVerificationEmailTemplateData {
    name: String,
    email: String,
    link: String,
}

#[post("/v1/auth/signup")]
async fn post(
    payload: Json<Request>,
    data: web::Data<AppState>,
    user: Option<Identity>,
) -> Result<HttpResponse, AppError> {
    // Return if the user maintains a valid session
    if user.is_some() {
        return Ok(HttpResponse::BadRequest()
            .content_type(ContentType::json())
            .json(ToastErrorResponse::new(
                "You are already logged-in".to_string(),
            )));
    }

    let mut form_errors: Vec<Vec<String>> = vec![];

    if !EmailAddress::is_valid(&payload.email) {
        form_errors.push(vec!["email".to_string(), "Invalid e-mail".to_string()]);
    } else {
        // Check for duplicate e-mail
        let email_check = sqlx::query(
            r#"
            SELECT EXISTS(
                SELECT 1 FROM users
                WHERE email = $1
            )
            "#,
        )
        .bind(&payload.email)
        .fetch_one(&data.db_pool)
        .await?;

        if email_check.get::<bool, _>("exists") {
            form_errors.push(vec![
                "email".to_string(),
                "This e-mail is already in use".to_string(),
            ]);
        }
    }

    let slugged_username = slugify!(&payload.username, separator = "_", max_length = 24);

    // Chekc if username is reserved
    if RESERVED_USERNAMES.contains(&slugged_username.as_str()) {
        form_errors.push(vec![
            "username".to_string(),
            "This username is not available".to_string(),
        ]);
    } else {
        // Check for duplicate username
        let username_check = sqlx::query(
            r#"
            SELECT EXISTS(
                SELECT 1 FROM users
                WHERE username = $1
            )
            "#,
        )
        .bind(&slugged_username)
        .fetch_one(&data.db_pool)
        .await?;

        if username_check.get::<bool, _>("exists") {
            form_errors.push(vec![
                "username".to_string(),
                "This username is already in use".to_string(),
            ]);
        }
    }

    // Return duplication errors if not empty
    if !form_errors.is_empty() {
        return Ok(HttpResponse::Conflict().json(FormErrorResponse::new(form_errors)));
    }

    // Generate a hash from the password
    match Argon2::default().hash_password(
        &payload.password.as_bytes(),
        &SaltString::generate(&mut OsRng),
    ) {
        Ok(hashed_password) => {
            let token_id = nanoid!(48);

            // Generate the token hash
            match Argon2::default()
                .hash_password(&token_id.as_bytes(), &SaltString::generate(&mut OsRng))
            {
                Ok(hashed_token) => {
                    let pg_pool = &data.db_pool;
                    let mut transaction = pg_pool.begin().await?;

                    // Insert the user
                    let user_insert_result = sqlx::query(
                        r#"
                        INSERT INTO users(email, name, username, password, wpm)
                        VALUES ($1, $2, $3, $4, $5)
                        RETURNING id
                        "#,
                    )
                    .bind(&payload.email)
                    .bind(&payload.name)
                    .bind(&slugged_username)
                    .bind(hashed_password.to_string())
                    .bind((&payload.wpm).clone() as i32)
                    .fetch_one(&mut *transaction)
                    .await?;

                    let user_id = user_insert_result.get::<i64, _>("id");

                    // Insert email verification token
                    sqlx::query(
                        r#"
                        INSERT INTO tokens(id, type, user_id, expires_at)
                        VALUES ($1, $2, $3, $4)
                        "#,
                    )
                    .bind(hashed_token.to_string())
                    .bind(TokenType::EmailVerify.to_string())
                    .bind(user_id)
                    .bind(OffsetDateTime::now_utc() + Duration::days(1)) // 24 hours
                    .execute(&mut *transaction)
                    .await?;

                    transaction.commit().await?;

                    let full_name = payload.name.clone();
                    let first_name = full_name.split(" ").collect::<Vec<_>>()[0];
                    let verification_link =
                        format!("https://storiny.com/auth/verify-email/{}", token_id);

                    match serde_json::to_string(&EmailVerificationEmailTemplateData {
                        email: (&payload.email).to_string(),
                        link: verification_link,
                        name: first_name.to_string(),
                    }) {
                        Ok(template_data) => {
                            let ses = &data.ses_client;
                            let _ = ses
                                .send_templated_email(SendTemplatedEmailRequest {
                                    configuration_set_name: None,
                                    destination: Destination {
                                        bcc_addresses: None,
                                        cc_addresses: None,
                                        to_addresses: Some(vec![(&payload.email).to_string()]),
                                    },
                                    reply_to_addresses: None,
                                    return_path: None,
                                    return_path_arn: None,
                                    source: EMAIL_SOURCE.to_string(),
                                    source_arn: None,
                                    tags: None,
                                    template: EmailTemplate::EmailVerification.to_string(),
                                    template_data,
                                    template_arn: None,
                                })
                                .await;

                            Ok(HttpResponse::Created().finish())
                        }
                        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
                    }
                }
                Err(_) => Ok(HttpResponse::InternalServerError().finish()),
            }
        }
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::utils::init_app_for_test::init_app_for_test;
    use actix_http::body::to_bytes;
    use actix_web::test;
    use argon2::{
        PasswordHash,
        PasswordVerifier,
    };
    use sqlx::PgPool;

    #[sqlx::test]
    async fn can_signup_using_valid_details(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool).await;

        let req = test::TestRequest::post()
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

        // User should be present in the database
        let user = sqlx::query(
            r#"
            SELECT email, name, password, wpm FROM users
            WHERE username = $1
            "#,
        )
        .bind("some_user")
        .fetch_one(&mut *conn)
        .await?;

        // Assert the columns from the database
        assert_eq!(user.get::<String, _>("name"), "Some user".to_string());

        // Check whether the hashed password matches
        assert!(
            Argon2::default()
                .verify_password(
                    "some_secret_password".as_bytes(),
                    &PasswordHash::new(&user.get::<String, _>("password")).unwrap(),
                )
                .is_ok()
        );

        // Should also insert an e-mail verification token
        let token = sqlx::query(
            r#"
            SELECT EXISTS(
                SELECT 1 FROM tokens
                WHERE type = $1
            )
            "#,
        )
        .bind(TokenType::EmailVerify.to_string())
        .fetch_one(&mut *conn)
        .await?;

        assert!(token.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_signup_when_the_email_already_exists(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool).await;

        // Insert user into the database
        sqlx::query(
            r#"
            INSERT INTO users(name, username, email)
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
        assert_eq!(
            to_bytes(res.into_body()).await.unwrap_or_default(),
            serde_json::to_string(&FormErrorResponse::new(vec![vec![
                "email".to_string(),
                "This e-mail is already in use".to_string(),
            ]]))
            .unwrap_or_default()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_signup_when_the_username_already_exists(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool).await;

        // Insert user into the database
        sqlx::query(
            r#"
            INSERT INTO users(name, username, email)
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
        assert_eq!(
            to_bytes(res.into_body()).await.unwrap_or_default(),
            serde_json::to_string(&FormErrorResponse::new(vec![vec![
                "username".to_string(),
                "This username is already in use".to_string(),
            ]]))
            .unwrap_or_default()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_signup_for_reserved_usernames(pool: PgPool) -> sqlx::Result<()> {
        let app = init_app_for_test(post, pool).await;

        let req = test::TestRequest::post()
            .uri("/v1/auth/signup")
            .set_json(Request {
                email: "someone@example.com".to_string(),
                name: "Some user".to_string(),
                username: RESERVED_USERNAMES[10].to_string(),
                password: "some_secret_password".to_string(),
                wpm: 270,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_eq!(
            to_bytes(res.into_body()).await.unwrap_or_default(),
            serde_json::to_string(&FormErrorResponse::new(vec![vec![
                "username".to_string(),
                "This username is not available".to_string(),
            ]]))
            .unwrap_or_default()
        );

        Ok(())
    }
}
