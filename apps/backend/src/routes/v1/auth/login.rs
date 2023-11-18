use crate::utils::generate_totp::generate_totp;
use crate::{
    error::{AppError, FormErrorResponse, ToastErrorResponse},
    middleware::identity::identity::Identity,
    models::user::UserFlag,
    utils::{
        flag::{Flag, Mask},
        get_client_device::get_client_device,
        get_client_location::get_client_location,
    },
    AppState,
};
use actix_extended_session::Session;
use actix_http::HttpMessage;
use actix_web::{post, web, HttpRequest, HttpResponse};
use actix_web_validator::{Json, QsQuery};
use argon2::{Argon2, PasswordHash, PasswordVerifier};
use email_address::EmailAddress;
use serde::{Deserialize, Serialize};
use sqlx::{Error, Row};
use std::net::IpAddr;
use time::OffsetDateTime;
use totp_rs::Secret;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(email(message = "Invalid e-mail"))]
    #[validate(length(min = 3, max = 300, message = "Invalid e-mail length"))]
    email: String,
    #[validate(length(min = 6, max = 64, message = "Invalid password length"))]
    password: String,
    remember_me: bool,
    #[validate(length(min = 6, max = 8, message = "Invalid verification code"))]
    code: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
struct Response {
    result: String,
}

#[derive(Deserialize, Validate)]
struct QueryParams {
    bypass: Option<String>,
}

// TODO: Get all the current sessions for the user before final login, and purge previous sessions if > 10

#[post("/v1/auth/login")]
async fn post(
    payload: Json<Request>,
    req: HttpRequest,
    query: QsQuery<QueryParams>,
    data: web::Data<AppState>,
    user: Option<Identity>,
    session: Session,
) -> Result<HttpResponse, AppError> {
    // Return if the user is already logged-in
    if user.is_some() {
        return Ok(
            HttpResponse::BadRequest().json(ToastErrorResponse::new("You are already logged-in"))
        );
    }

    // Check for valid e-mail
    if !EmailAddress::is_valid(&payload.email) {
        return Ok(HttpResponse::BadRequest()
            .json(FormErrorResponse::new(vec![("email", "Invalid e-mail")])));
    }

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;
    let should_bypass = query.bypass.is_some();
    let query_result = sqlx::query(
        r#"
        SELECT
            id,
            username,
            password,
            email_verified,
            public_flags,
            deactivated_at,
            deleted_at,
            mfa_enabled,
            mfa_secret
        FROM users
        WHERE email = $1
        "#,
    )
    .bind(&payload.email)
    .fetch_one(&mut *txn)
    .await;

    match query_result {
        Ok(user) => {
            let user_id = user.get::<i64, _>("id");

            // MFA check
            if user.get::<bool, _>("mfa_enabled") {
                if payload.code.is_none() {
                    return Ok(HttpResponse::Unauthorized()
                        .json(ToastErrorResponse::new("Missing verification code")));
                }

                let verification_code = payload.code.clone().unwrap_or_default();

                match verification_code.chars().count() {
                    // Recovery code
                    8 => {
                        let result = sqlx::query(
                            r#"
                            SELECT EXISTS(
                                SELECT 1 FROM mfa_recovery_codes
                                WHERE
                                    code = $1
                                    AND user_id = $2
                                    AND used_at IS NULL
                            )
                            "#,
                        )
                        .bind(&verification_code)
                        .bind(&user_id)
                        .fetch_one(&mut *txn)
                        .await?;

                        if !result.get::<bool, _>("exists") {
                            return Ok(HttpResponse::BadRequest().json(FormErrorResponse::new(
                                vec![("code", "Invalid verification code")],
                            )));
                        }

                        // Mark the code as used
                        sqlx::query(
                            r#"
                            UPDATE mfa_recovery_codes
                            SET used_at = now()
                            WHERE code = $1 AND user_id = $2
                            "#,
                        )
                        .bind(&verification_code)
                        .bind(&user_id)
                        .execute(&mut *txn)
                        .await?;
                    }
                    // TOTP code
                    6 => {
                        let mfa_secret = user
                            .get::<Option<String>, _>("mfa_secret")
                            .unwrap_or_default();
                        let secret_as_bytes = Secret::Encoded(mfa_secret).to_bytes();

                        if secret_as_bytes.is_err() {
                            return Ok(HttpResponse::InternalServerError().finish());
                        }

                        match generate_totp(
                            secret_as_bytes.unwrap(),
                            &user.get::<String, _>("username"),
                        ) {
                            Ok(totp) => {
                                let is_valid = totp.check_current(&verification_code);

                                if is_valid.is_err() {
                                    return Ok(HttpResponse::InternalServerError().json(
                                        ToastErrorResponse::new(
                                            "Unable to validate the verification code",
                                        ),
                                    ));
                                }

                                if !is_valid.unwrap() {
                                    return Ok(HttpResponse::BadRequest().json(
                                        FormErrorResponse::new(vec![(
                                            "code",
                                            "Invalid verification code",
                                        )]),
                                    ));
                                }
                            }
                            Err(_) => return Ok(HttpResponse::InternalServerError().finish()),
                        }
                    }
                    _ => {
                        return Ok(
                            HttpResponse::BadRequest().json(FormErrorResponse::new(vec![(
                                "code",
                                "Invalid verification code",
                            )])),
                        )
                    }
                };
            }

            let user_password = user.get::<Option<String>, _>("password");
            // User has created account using a third-party service, such as Apple or Google
            if user_password.is_none() {
                return Ok(HttpResponse::Unauthorized()
                    .json(ToastErrorResponse::new("Invalid credentials")));
            }

            match PasswordHash::new(&user_password.unwrap()) {
                Ok(hash) => {
                    match Argon2::default().verify_password(&payload.password.as_bytes(), &hash) {
                        Ok(_) => {
                            // Check if the user is suspended
                            {
                                let public_flags = user.get::<i32, _>("public_flags");
                                let user_flags = Flag::new(public_flags as u32);

                                // User suspended
                                if user_flags.has_any_of(Mask::Multiple(vec![
                                    UserFlag::TemporarilySuspended,
                                    UserFlag::PermanentlySuspended,
                                ])) {
                                    return Ok(HttpResponse::Ok().json(Response {
                                        result: "suspended".to_string(),
                                    }));
                                }
                            }

                            // Check if the user is soft-deleted
                            {
                                let deleted_at =
                                    user.get::<Option<OffsetDateTime>, _>("deleted_at");

                                if deleted_at.is_some() {
                                    if should_bypass {
                                        // Restore the user
                                        sqlx::query(
                                            r#"
                                            UPDATE users
                                            SET deleted_at = NULL
                                            WHERE id = $1
                                            "#,
                                        )
                                        .bind(&user_id)
                                        .execute(&mut *txn)
                                        .await?;
                                    } else {
                                        return Ok(HttpResponse::Ok().json(Response {
                                            result: "held_for_deletion".to_string(),
                                        }));
                                    }
                                }
                            }

                            // Check if the user is deactivated
                            {
                                let deactivated_at =
                                    user.get::<Option<OffsetDateTime>, _>("deactivated_at");

                                if deactivated_at.is_some() {
                                    if should_bypass {
                                        // Reactivate the user
                                        sqlx::query(
                                            r#"
                                            UPDATE users
                                            SET deactivated_at = NULL
                                            WHERE id = $1
                                            "#,
                                        )
                                        .bind(&user_id)
                                        .execute(&mut *txn)
                                        .await?;
                                    } else {
                                        return Ok(HttpResponse::Ok().json(Response {
                                            result: "deactivated".to_string(),
                                        }));
                                    }
                                }
                            }

                            // Commit the transaction
                            txn.commit().await?;

                            // Check if the email is verified
                            {
                                let email_verified = user.get::<bool, _>("email_verified");

                                if !email_verified {
                                    return Ok(HttpResponse::Ok().json(Response {
                                        result: "email_confirmation".to_string(),
                                    }));
                                }
                            }

                            // Insert additional data to the session
                            {
                                if let Some(ip) = req.connection_info().realip_remote_addr() {
                                    if let Ok(parsed_ip) = ip.parse::<IpAddr>() {
                                        if let Ok(client_location) = serde_json::to_value(
                                            get_client_location(parsed_ip, &data.geo_db),
                                        ) {
                                            let _ = session.insert("location", client_location);
                                        }
                                    }
                                }

                                if let Some(ua_header) = (&req.headers()).get("user-agent") {
                                    if let Ok(ua) = ua_header.to_str() {
                                        if let Ok(client_device) = serde_json::to_value(
                                            get_client_device(ua, &data.ua_parser),
                                        ) {
                                            let _ = session.insert("device", client_device);
                                        }
                                    }
                                }
                            }

                            // TODO: Send a persistent cookie to the client
                            // if payload.remember_me {
                            //     let _ = session.insert("cookie_type", "persistent");
                            // }

                            match Identity::login(&req.extensions(), user.get::<i64, _>("id")) {
                                Ok(_) => Ok(HttpResponse::Ok().json(Response {
                                    result: "success".to_string(),
                                })),
                                Err(_) => Ok(HttpResponse::InternalServerError().finish()),
                            }
                        }
                        Err(_) => Ok(HttpResponse::Unauthorized()
                            .json(ToastErrorResponse::new("Invalid credentials"))),
                    }
                }
                Err(_) => Ok(HttpResponse::InternalServerError().finish()),
            }
        }
        Err(kind) => match kind {
            Error::RowNotFound => Ok(HttpResponse::Unauthorized()
                .json(ToastErrorResponse::new("Invalid e-mail or password"))),
            _ => Ok(HttpResponse::InternalServerError().finish()),
        },
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::assert_form_error_response;
    use crate::{
        test_utils::{assert_response_body_text, assert_toast_error_response, init_app_for_test},
        utils::{get_client_device::ClientDevice, get_client_location::ClientLocation},
    };
    use actix_web::{get, services, test, Responder};
    use argon2::{
        password_hash::{rand_core::OsRng, SaltString},
        PasswordHasher,
    };
    use serde_json::json;
    use sqlx::PgPool;
    use std::net::{Ipv4Addr, SocketAddr, SocketAddrV4};

    /// Only for testing
    #[get("/v1/auth/login")]
    async fn get(session: Session) -> impl Responder {
        let location = session.get::<ClientLocation>("location").unwrap();
        let device = session.get::<ClientDevice>("device").unwrap();
        HttpResponse::Ok().json(json!({
            "location": location,
            "device": device
        }))
    }

    /// Returns sample email and hashed password
    fn get_sample_email_and_password() -> (String, String, String) {
        let password = "sample";
        let email = "someone@example.com";
        let salt = SaltString::generate(&mut OsRng);
        let password_hash = Argon2::default()
            .hash_password(password.as_bytes(), &salt)
            .unwrap()
            .to_string();

        (email.to_string(), password_hash, password.to_string())
    }

    #[sqlx::test]
    async fn can_login_using_valid_credentials(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false).await.0;
        let (email, password_hash, password) = get_sample_email_and_password();

        // Insert the user
        sqlx::query(
            r#"
            INSERT INTO users(name, username, email, password, email_verified)
            VALUES ($1, $2, $3, $4, TRUE)
            "#,
        )
        .bind("Sample user".to_string())
        .bind("sample_user".to_string())
        .bind((&email).to_string())
        .bind(password_hash)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .uri("/v1/auth/login")
            .set_json(Request {
                email: email.to_string(),
                password: password.to_string(),
                remember_me: true,
                code: None,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());
        assert_response_body_text(
            res,
            &serde_json::to_string(&Response {
                result: "success".to_string(),
            })
            .unwrap_or_default(),
        )
        .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_login_using_recovery_code(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false).await.0;
        let (email, password_hash, password) = get_sample_email_and_password();

        // Insert the user
        sqlx::query(
            r#"
            INSERT INTO users(id, name, username, email, password, email_verified, mfa_enabled)
            VALUES ($1, $2, $3, $4, $5, TRUE, TRUE)
            "#,
        )
        .bind(1_i64)
        .bind("Sample user".to_string())
        .bind("sample_user".to_string())
        .bind((&email).to_string())
        .bind(password_hash)
        .execute(&mut *conn)
        .await?;

        // Insert recovery code
        sqlx::query(
            r#"
            INSERT INTO mfa_recovery_codes(code, user_id)
            VALUES ($1, $2)
            "#,
        )
        .bind("0".repeat(8))
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .uri("/v1/auth/login")
            .set_json(Request {
                email: email.to_string(),
                password: password.to_string(),
                remember_me: true,
                code: Some("0".repeat(8)),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());
        assert_response_body_text(
            res,
            &serde_json::to_string(&Response {
                result: "success".to_string(),
            })
            .unwrap_or_default(),
        )
        .await;

        // Should mark the recovery code as used
        let result = sqlx::query(
            r#"
            SELECT used_at FROM mfa_recovery_codes
            WHERE code = $1 AND user_id = $2
            "#,
        )
        .bind("0".repeat(8))
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<Option<OffsetDateTime>, _>("used_at").is_some());

        Ok(())
    }

    #[sqlx::test]
    async fn can_login_using_authentication_code(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false).await.0;
        let (email, password_hash, password) = get_sample_email_and_password();
        let mfa_secret = Secret::generate_secret();

        // Insert the user
        sqlx::query(
            r#"
            INSERT INTO users(
                name,
                username,
                email,
                password,
                email_verified,
                mfa_enabled,
                mfa_secret
            )
            VALUES ($1, $2, $3, $4, TRUE, TRUE, $5)
            "#,
        )
        .bind("Sample user".to_string())
        .bind("sample_user".to_string())
        .bind((&email).to_string())
        .bind(password_hash)
        .bind(mfa_secret.to_encoded().to_string())
        .execute(&mut *conn)
        .await?;

        // Generate a TOTP instance for verification code
        let totp = generate_totp(mfa_secret.to_bytes().unwrap(), "sample_user").unwrap();

        let req = test::TestRequest::post()
            .uri("/v1/auth/login")
            .set_json(Request {
                email: email.to_string(),
                password: password.to_string(),
                remember_me: true,
                code: Some(totp.generate_current().unwrap()),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());
        assert_response_body_text(
            res,
            &serde_json::to_string(&Response {
                result: "success".to_string(),
            })
            .unwrap_or_default(),
        )
        .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_login_with_invalid_email(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false).await.0;
        let (email, password_hash, password) = get_sample_email_and_password();

        // Insert the user
        sqlx::query(
            r#"
            INSERT INTO users(name, username, email, password)
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind("Sample user".to_string())
        .bind("sample_user".to_string())
        .bind((&email).to_string())
        .bind(password_hash)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .uri("/v1/auth/login")
            .set_json(Request {
                email: "some_invalid_email@example.com".to_string(),
                password: password.to_string(),
                remember_me: true,
                code: None,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Invalid e-mail or password").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_login_with_missing_password(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false).await.0;
        let (email, _, password) = get_sample_email_and_password();

        // Insert the user
        sqlx::query(
            r#"
            INSERT INTO users(name, username, email)
            VALUES ($1, $2, $3)
            "#,
        )
        .bind("Sample user".to_string())
        .bind("sample_user".to_string())
        .bind((&email).to_string())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .uri("/v1/auth/login")
            .set_json(Request {
                email: email.to_string(),
                password: password.to_string(),
                remember_me: true,
                code: None,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Invalid credentials").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_login_using_invalid_password(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false).await.0;
        let (email, password_hash, _) = get_sample_email_and_password();

        // Insert the user
        sqlx::query(
            r#"
            INSERT INTO users(name, username, email, password)
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind("Sample user".to_string())
        .bind("sample_user".to_string())
        .bind((&email).to_string())
        .bind(password_hash)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .uri("/v1/auth/login")
            .set_json(Request {
                email: email.to_string(),
                password: "some_invalid_password".to_string(),
                remember_me: true,
                code: None,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Invalid credentials").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_login_when_the_user_is_temporarily_suspended(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false).await.0;
        let (email, password_hash, password) = get_sample_email_and_password();
        let mut flags = Flag::new(0);
        flags.add_flag(UserFlag::TemporarilySuspended);

        // Insert the user
        sqlx::query(
            r#"
            INSERT INTO users(name, username, email, password, public_flags)
            VALUES ($1, $2, $3, $4, $5)
            "#,
        )
        .bind("Sample user".to_string())
        .bind("sample_user".to_string())
        .bind((&email).to_string())
        .bind(password_hash)
        .bind(flags.get_flags() as i32)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .uri("/v1/auth/login")
            .set_json(Request {
                email: email.to_string(),
                password: password.to_string(),
                remember_me: true,
                code: None,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());
        assert_response_body_text(
            res,
            &serde_json::to_string(&Response {
                result: "suspended".to_string(),
            })
            .unwrap(),
        )
        .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_login_when_the_user_is_permanently_suspended(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false).await.0;
        let (email, password_hash, password) = get_sample_email_and_password();
        let mut flags = Flag::new(0);
        flags.add_flag(UserFlag::PermanentlySuspended);

        // Insert the user
        sqlx::query(
            r#"
            INSERT INTO users(name, username, email, password, public_flags)
            VALUES ($1, $2, $3, $4, $5)
            "#,
        )
        .bind("Sample user".to_string())
        .bind("sample_user".to_string())
        .bind((&email).to_string())
        .bind(password_hash)
        .bind(flags.get_flags() as i32)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .uri("/v1/auth/login")
            .set_json(Request {
                email: email.to_string(),
                password: password.to_string(),
                remember_me: true,
                code: None,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());
        assert_response_body_text(
            res,
            &serde_json::to_string(&Response {
                result: "suspended".to_string(),
            })
            .unwrap(),
        )
        .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_login_when_the_user_is_deactivated(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false).await.0;
        let (email, password_hash, password) = get_sample_email_and_password();

        // Insert the user
        sqlx::query(
            r#"
            INSERT INTO users(name, username, email, password)
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind("Sample user".to_string())
        .bind("sample_user".to_string())
        .bind((&email).to_string())
        .bind(password_hash)
        .execute(&mut *conn)
        .await?;

        // Deactivate the user
        sqlx::query(
            r#"
            UPDATE users
            SET deactivated_at = now()
            WHERE email = $1
            "#,
        )
        .bind((&email).to_string())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .uri("/v1/auth/login")
            .set_json(Request {
                email: email.to_string(),
                password: password.to_string(),
                remember_me: true,
                code: None,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());
        assert_response_body_text(
            res,
            &serde_json::to_string(&Response {
                result: "deactivated".to_string(),
            })
            .unwrap(),
        )
        .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_login_when_the_user_is_soft_deleted(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false).await.0;
        let (email, password_hash, password) = get_sample_email_and_password();

        // Insert the user
        sqlx::query(
            r#"
            INSERT INTO users(name, username, email, password)
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind("Sample user".to_string())
        .bind("sample_user".to_string())
        .bind((&email).to_string())
        .bind(password_hash)
        .execute(&mut *conn)
        .await?;

        // Soft-delete the user
        sqlx::query(
            r#"
            UPDATE users
            SET deleted_at = now()
            WHERE email = $1
            "#,
        )
        .bind((&email).to_string())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .uri("/v1/auth/login")
            .set_json(Request {
                email: email.to_string(),
                password: password.to_string(),
                remember_me: true,
                code: None,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());
        assert_response_body_text(
            res,
            &serde_json::to_string(&Response {
                result: "held_for_deletion".to_string(),
            })
            .unwrap(),
        )
        .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_login_if_the_email_is_not_verified(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false).await.0;
        let (email, password_hash, password) = get_sample_email_and_password();

        // Insert the user
        sqlx::query(
            r#"
            INSERT INTO users(name, username, email, password)
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind("Sample user".to_string())
        .bind("sample_user".to_string())
        .bind((&email).to_string())
        .bind(password_hash)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .uri("/v1/auth/login")
            .set_json(Request {
                email: email.to_string(),
                password: password.to_string(),
                remember_me: true,
                code: None,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());
        assert_response_body_text(
            res,
            &serde_json::to_string(&Response {
                result: "email_confirmation".to_string(),
            })
            .unwrap(),
        )
        .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_login_for_missing_verification_code(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false).await.0;
        let (email, _, password) = get_sample_email_and_password();

        // Insert the user
        sqlx::query(
            r#"
            INSERT INTO users(name, username, email, mfa_enabled)
            VALUES ($1, $2, $3, TRUE)
            "#,
        )
        .bind("Sample user".to_string())
        .bind("sample_user".to_string())
        .bind((&email).to_string())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .uri("/v1/auth/login")
            .set_json(Request {
                email: email.to_string(),
                password: password.to_string(),
                remember_me: true,
                code: None,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Missing verification code").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_login_for_invalid_verification_code_length(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false).await.0;
        let (email, _, password) = get_sample_email_and_password();

        // Insert the user
        sqlx::query(
            r#"
            INSERT INTO users(name, username, email, mfa_enabled)
            VALUES ($1, $2, $3, TRUE)
            "#,
        )
        .bind("Sample user".to_string())
        .bind("sample_user".to_string())
        .bind((&email).to_string())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .uri("/v1/auth/login")
            .set_json(Request {
                email: email.to_string(),
                password: password.to_string(),
                remember_me: true,
                code: Some("0".repeat(7)),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(res, vec![("code", "Invalid verification code")]).await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_login_for_invalid_recovery_code(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false).await.0;
        let (email, _, password) = get_sample_email_and_password();

        // Insert the user
        sqlx::query(
            r#"
            INSERT INTO users(name, username, email, mfa_enabled)
            VALUES ($1, $2, $3, TRUE)
            "#,
        )
        .bind("Sample user".to_string())
        .bind("sample_user".to_string())
        .bind((&email).to_string())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .uri("/v1/auth/login")
            .set_json(Request {
                email: email.to_string(),
                password: password.to_string(),
                remember_me: true,
                code: Some("0".repeat(8)),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(res, vec![("code", "Invalid verification code")]).await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_login_for_invalid_authentication_code(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false).await.0;
        let (email, _, password) = get_sample_email_and_password();
        let mfa_secret = Secret::generate_secret();

        // Insert the user
        sqlx::query(
            r#"
            INSERT INTO users(name, username, email, mfa_enabled, mfa_secret)
            VALUES ($1, $2, $3, TRUE, $4)
            "#,
        )
        .bind("Sample user".to_string())
        .bind("sample_user".to_string())
        .bind((&email).to_string())
        .bind(mfa_secret.to_encoded().to_string())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .uri("/v1/auth/login")
            .set_json(Request {
                email: email.to_string(),
                password: password.to_string(),
                remember_me: true,
                code: Some("0".repeat(6)),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(res, vec![("code", "Invalid verification code")]).await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_login_for_used_recovery_code(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false).await.0;
        let (email, password_hash, password) = get_sample_email_and_password();

        // Insert the user
        sqlx::query(
            r#"
            INSERT INTO users(id, name, username, email, password, email_verified, mfa_enabled)
            VALUES ($1, $2, $3, $4, $5, TRUE, TRUE)
            "#,
        )
        .bind(1_i64)
        .bind("Sample user".to_string())
        .bind("sample_user".to_string())
        .bind((&email).to_string())
        .bind(password_hash)
        .execute(&mut *conn)
        .await?;

        // Insert a used recovery code
        sqlx::query(
            r#"
            INSERT INTO mfa_recovery_codes(code, user_id, used_at)
            VALUES ($1, $2, now())
            "#,
        )
        .bind("0".repeat(8))
        .bind(1_i64)
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .uri("/v1/auth/login")
            .set_json(Request {
                email: email.to_string(),
                password: password.to_string(),
                remember_me: true,
                code: Some("0".repeat(8)),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(res, vec![("code", "Invalid verification code")]).await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_insert_client_device_and_location_into_the_session(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(services![get, post], pool, false, false)
            .await
            .0;
        let (email, password_hash, password) = get_sample_email_and_password();

        // Insert the user
        sqlx::query(
            r#"
            INSERT INTO users(name, username, email, password, email_verified)
            VALUES ($1, $2, $3, $4, TRUE)
            "#,
        )
        .bind("Sample user".to_string())
        .bind("sample_user".to_string())
        .bind((&email).to_string())
        .bind(password_hash)
        .execute(&mut *conn)
        .await?;

        let post_req = test::TestRequest::post()
            .peer_addr(SocketAddr::from(SocketAddrV4::new(
                Ipv4Addr::new(8, 8, 8, 8),
                8080,
            )))
            .append_header(("user-agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:40.0) Gecko/20100101 Firefox/40.0"))
            .uri("/v1/auth/login")
            .set_json(Request {
                email: email.to_string(),
                password: password.to_string(),
                remember_me: true,
                code:None
            })
            .to_request();
        let post_res = test::call_service(&app, post_req).await;
        let cookie_value = post_res
            .response()
            .cookies()
            .find(|cookie| cookie.name() == "_storiny_sess");
        assert!(post_res.status().is_success());
        assert!(cookie_value.is_some());

        let get_req = test::TestRequest::get()
            .cookie(cookie_value.unwrap())
            .uri("/v1/auth/login")
            .to_request();
        let get_res = test::call_service(&app, get_req).await;

        #[derive(Deserialize)]
        struct ClientSession {
            device: Option<ClientDevice>,
            location: Option<ClientLocation>,
        }

        let client_session = test::read_body_json::<ClientSession, _>(get_res).await;

        assert!(client_session.device.is_some());
        assert!(client_session.location.is_some());

        Ok(())
    }

    // TODO: Uncomment after writing configurable cookies
    // #[sqlx::test]
    // async fn can_send_non_persistent_cookie_if_remember_me_is_set_to_false(
    //     pool: PgPool,
    // ) -> sqlx::Result<()> {
    //     let mut conn = pool.acquire().await?;
    //     let app = init_app_for_test(services![get, post], pool, false, false)
    //         .await
    //         .0;
    //     let (email, password_hash, password) = get_sample_email_and_password();
    //
    //     // Insert the user
    //     sqlx::query(
    //         r#"
    //         INSERT INTO users(name, username, email, password, email_verified)
    //         VALUES ($1, $2, $3, $4, TRUE)
    //         "#,
    //     )
    //     .bind("Sample user".to_string())
    //     .bind("sample_user".to_string())
    //     .bind((&email).to_string())
    //     .bind(password_hash)
    //     .execute(&mut *conn)
    //     .await?;
    //
    //     let post_req = test::TestRequest::post()
    //         .uri("/v1/auth/login")
    //         .set_json(Request {
    //             email: email.to_string(),
    //             password: password.to_string(),
    //             remember_me: false,
    //             code: None,
    //         })
    //         .to_request();
    //     let post_res = test::call_service(&app, post_req).await;
    //     let cookie_value = post_res
    //         .response()
    //         .cookies()
    //         .find(|cookie| cookie.name() == "_storiny_sess")
    //         .unwrap();
    //     assert!(post_res.status().is_success());
    //
    //     // Should be non-persistent
    //     assert!(cookie_value.max_age().is_none());
    //
    //     Ok(())
    // }
    //
    // #[sqlx::test]
    // async fn can_send_persistent_cookie_if_remember_me_is_set_to_true(
    //     pool: PgPool,
    // ) -> sqlx::Result<()> {
    //     let mut conn = pool.acquire().await?;
    //     let app = init_app_for_test(services![get, post], pool, false, false)
    //         .await
    //         .0;
    //     let (email, password_hash, password) = get_sample_email_and_password();
    //
    //     // Insert the user
    //     sqlx::query(
    //         r#"
    //         INSERT INTO users(name, username, email, password, email_verified)
    //         VALUES ($1, $2, $3, $4, TRUE)
    //         "#,
    //     )
    //     .bind("Sample user".to_string())
    //     .bind("sample_user".to_string())
    //     .bind((&email).to_string())
    //     .bind(password_hash)
    //     .execute(&mut *conn)
    //     .await?;
    //
    //     let post_req = test::TestRequest::post()
    //         .uri("/v1/auth/login")
    //         .set_json(Request {
    //             email: email.to_string(),
    //             password: password.to_string(),
    //             remember_me: true,
    //             code: None,
    //         })
    //         .to_request();
    //     let post_res = test::call_service(&app, post_req).await;
    //     let cookie_value = post_res
    //         .response()
    //         .cookies()
    //         .find(|cookie| cookie.name() == "_storiny_sess")
    //         .unwrap();
    //     assert!(post_res.status().is_success());
    //
    //     // Should be persistent
    //     assert!(cookie_value.max_age().is_some());
    //
    //     Ok(())
    // }

    #[sqlx::test]
    async fn can_restore_and_login_a_soft_deleted_user_on_bypass(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(services![get, post], pool, false, false)
            .await
            .0;
        let (email, password_hash, password) = get_sample_email_and_password();

        // Insert the user
        sqlx::query(
            r#"
            INSERT INTO users(name, username, email, password, email_verified)
            VALUES ($1, $2, $3, $4, TRUE)
            "#,
        )
        .bind("Sample user".to_string())
        .bind("sample_user".to_string())
        .bind((&email).to_string())
        .bind(password_hash)
        .execute(&mut *conn)
        .await?;

        // Soft-delete the user
        sqlx::query(
            r#"
            UPDATE users
            SET deleted_at = now()
            WHERE email = $1
            "#,
        )
        .bind((&email).to_string())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .uri("/v1/auth/login?bypass=true")
            .set_json(Request {
                email: email.to_string(),
                password: password.to_string(),
                remember_me: true,
                code: None,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());
        assert_response_body_text(
            res,
            &serde_json::to_string(&Response {
                result: "success".to_string(),
            })
            .unwrap_or_default(),
        )
        .await;

        // User should be restored
        let user_result = sqlx::query(
            r#"
            SELECT deleted_at FROM users
            WHERE email = $1
            "#,
        )
        .bind((&email).to_string())
        .fetch_one(&mut *conn)
        .await?;

        assert!(user_result
            .get::<Option<OffsetDateTime>, _>("deleted_at")
            .is_none());

        Ok(())
    }

    #[sqlx::test]
    async fn can_reactivate_and_login_a_deactivated_user_on_bypass(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(services![get, post], pool, false, false)
            .await
            .0;
        let (email, password_hash, password) = get_sample_email_and_password();

        // Insert the user
        sqlx::query(
            r#"
            INSERT INTO users(name, username, email, password, email_verified)
            VALUES ($1, $2, $3, $4, TRUE)
            "#,
        )
        .bind("Sample user".to_string())
        .bind("sample_user".to_string())
        .bind((&email).to_string())
        .bind(password_hash)
        .execute(&mut *conn)
        .await?;

        // Deactivate the user
        sqlx::query(
            r#"
            UPDATE users
            SET deactivated_at = now()
            WHERE email = $1
            "#,
        )
        .bind((&email).to_string())
        .execute(&mut *conn)
        .await?;

        let req = test::TestRequest::post()
            .uri("/v1/auth/login?bypass=true")
            .set_json(Request {
                email: email.to_string(),
                password: password.to_string(),
                remember_me: true,
                code: None,
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());
        assert_response_body_text(
            res,
            &serde_json::to_string(&Response {
                result: "success".to_string(),
            })
            .unwrap_or_default(),
        )
        .await;

        // User should be reactivated
        let user_result = sqlx::query(
            r#"
            SELECT deactivated_at FROM users
            WHERE email = $1
            "#,
        )
        .bind((&email).to_string())
        .fetch_one(&mut *conn)
        .await?;

        assert!(user_result
            .get::<Option<OffsetDateTime>, _>("deactivated_at")
            .is_none());

        Ok(())
    }
}
