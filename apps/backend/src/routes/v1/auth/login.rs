use crate::{
    error::ToastErrorResponse,
    middleware::session::Session,
    models::user::UserFlag,
    utils::{
        flag::{
            Flag,
            Mask,
        },
        get_client_device::{
            get_client_device,
            ClientDevice,
        },
        get_client_location::{
            get_client_location,
            ClientLocation,
        },
    },
    AppState,
};
use actix_http::HttpMessage;
use actix_identity::Identity;
use actix_web::{
    get,
    http::header::ContentType,
    post,
    web,
    HttpRequest,
    HttpResponse,
    Responder,
};
use actix_web_validator::Json;
use argon2::{
    Argon2,
    PasswordHash,
    PasswordVerifier,
};
use serde::{
    Deserialize,
    Serialize,
};
use serde_json::json;
use sqlx::{
    Error,
    Row,
};
use std::net::IpAddr;
use time::OffsetDateTime;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(email(message = "Invalid e-mail"))]
    #[validate(length(min = 3, max = 300, message = "Invalid e-mail length"))]
    email: String,
    #[validate(length(min = 6, max = 64, message = "Invalid password length"))]
    password: String,
    remember_me: bool,
}

#[derive(Debug, Clone, Serialize)]
struct Response {
    result: String,
}

#[derive(Deserialize)]
struct QueryParams {
    bypass: Option<String>,
}

/// Only for testing
#[get("/v1/auth/login")]
async fn get(session: Session) -> impl Responder {
    let location = session.get::<ClientLocation>("location").unwrap();
    let device = session.get::<ClientDevice>("device").unwrap();
    HttpResponse::Ok()
        .content_type(ContentType::json())
        .json(json!({
            "location": location,
            "device": device
        }))
}

#[post("/v1/auth/login")]
async fn post(
    payload: Json<Request>,
    req: HttpRequest,
    query: web::Query<QueryParams>,
    data: web::Data<AppState>,
    session: Session,
) -> impl Responder {
    let should_bypass = query.bypass.is_some();
    let query_result = sqlx::query(
        r#"
        SELECT id, password, email_verified, public_flags, deactivated_at, deleted_at FROM users
        WHERE email = $1
        "#,
    )
    .bind(&payload.email)
    .fetch_one(&data.db_pool)
    .await;

    match query_result {
        Ok(user) => {
            let user_password = user.get::<Option<String>, _>("password");
            // User has created account using a third-party service, such as Apple or Google
            if user_password.is_none() {
                return HttpResponse::Unauthorized()
                    .content_type(ContentType::json())
                    .json(ToastErrorResponse::new("Invalid credentials".to_string()));
            }

            return match PasswordHash::new(&user_password.unwrap()) {
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
                                    return HttpResponse::Ok()
                                        .content_type(ContentType::json())
                                        .json(Response {
                                            result: "suspended".to_string(),
                                        });
                                }
                            }

                            // Check if the user is soft-deleted
                            {
                                let deleted_at =
                                    user.get::<Option<OffsetDateTime>, _>("deleted_at");

                                if deleted_at.is_some() {
                                    if should_bypass {
                                        // Restore the user
                                        match sqlx::query(
                                            r#"
                                            UPDATE users
                                            SET deleted_at = NULL
                                            WHERE email = $1
                                            "#,
                                        )
                                        .bind(&payload.email)
                                        .execute(&data.db_pool)
                                        .await
                                        {
                                            Ok(_) => {}
                                            Err(_) => {
                                                return HttpResponse::InternalServerError()
                                                    .finish();
                                            }
                                        };
                                    } else {
                                        return HttpResponse::Ok()
                                            .content_type(ContentType::json())
                                            .json(Response {
                                                result: "held_for_deletion".to_string(),
                                            });
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
                                        match sqlx::query(
                                            r#"
                                            UPDATE users
                                            SET deactivated_at = NULL
                                            WHERE email = $1
                                            "#,
                                        )
                                        .bind(&payload.email)
                                        .execute(&data.db_pool)
                                        .await
                                        {
                                            Ok(_) => {}
                                            Err(_) => {
                                                return HttpResponse::InternalServerError()
                                                    .finish();
                                            }
                                        };
                                    } else {
                                        return HttpResponse::Ok()
                                            .content_type(ContentType::json())
                                            .json(Response {
                                                result: "deactivated".to_string(),
                                            });
                                    }
                                }
                            }

                            // Check if the email is verified
                            {
                                let email_verified = user.get::<bool, _>("email_verified");

                                if !email_verified {
                                    return HttpResponse::Ok()
                                        .content_type(ContentType::json())
                                        .json(Response {
                                            result: "email_confirmation".to_string(),
                                        });
                                }
                            }

                            // Insert additional data to the session
                            {
                                if let Some(ip) = req.connection_info().realip_remote_addr() {
                                    if let Ok(parsed_ip) = ip.parse::<IpAddr>() {
                                        session
                                            .insert(
                                                "location",
                                                get_client_location(parsed_ip, &data.geo_db),
                                            )
                                            .unwrap_or_default();
                                    }
                                }

                                if let Some(ua_header) = (&req.headers()).get("user-agent") {
                                    if let Ok(ua) = ua_header.to_str() {
                                        session
                                            .insert(
                                                "device",
                                                get_client_device(ua, &data.ua_parser),
                                            )
                                            .unwrap_or_default();
                                    }
                                }
                            }

                            // Renew the session with the new user ID
                            session
                                .insert("user_id", user.get::<i64, _>("id").to_string())
                                .unwrap_or_default();

                            // Send a persistent cookie to the client
                            if payload.remember_me {
                                session
                                    .insert("cookie_type", "persistent")
                                    .unwrap_or_default();
                            }

                            match Identity::login(
                                &req.extensions(),
                                user.get::<i64, _>("id").to_string(),
                            ) {
                                Ok(_) => HttpResponse::Ok().content_type(ContentType::json()).json(
                                    Response {
                                        result: "success".to_string(),
                                    },
                                ),
                                Err(_) => HttpResponse::InternalServerError().finish(),
                            }
                        }
                        Err(_) => HttpResponse::Unauthorized()
                            .content_type(ContentType::json())
                            .json(ToastErrorResponse::new("Invalid credentials".to_string())),
                    }
                }
                Err(_) => HttpResponse::InternalServerError().finish(),
            };
        }
        Err(kind) => match kind {
            Error::RowNotFound => HttpResponse::Unauthorized()
                .content_type(ContentType::json())
                .json(ToastErrorResponse::new(
                    "Invalid e-mail or password".to_string(),
                )),
            _ => HttpResponse::InternalServerError().finish(),
        },
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
    use actix_web::{
        services,
        test,
    };
    use argon2::{
        password_hash::{
            rand_core::OsRng,
            SaltString,
        },
        PasswordHasher,
    };
    use sqlx::PgPool;
    use std::net::{
        Ipv4Addr,
        SocketAddr,
        SocketAddrV4,
    };

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
        let app = init_app_for_test(post, pool).await;
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
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());
        assert_eq!(
            to_bytes(res.into_body()).await.unwrap_or_default(),
            serde_json::to_string(&Response {
                result: "success".to_string()
            })
            .unwrap_or_default()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_login_with_invalid_email(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool).await;
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
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_eq!(
            to_bytes(res.into_body()).await.unwrap(),
            serde_json::to_string(&ToastErrorResponse::new(
                "Invalid e-mail or password".to_string()
            ))
            .unwrap()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_login_with_missing_password(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool).await;
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
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_eq!(
            to_bytes(res.into_body()).await.unwrap(),
            serde_json::to_string(&ToastErrorResponse::new("Invalid credentials".to_string()))
                .unwrap()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_login_using_invalid_password(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool).await;
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
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_eq!(
            to_bytes(res.into_body()).await.unwrap(),
            serde_json::to_string(&ToastErrorResponse::new("Invalid credentials".to_string()))
                .unwrap()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_login_when_the_user_is_temporarily_suspended(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool).await;
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
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());
        assert_eq!(
            to_bytes(res.into_body()).await.unwrap(),
            serde_json::to_string(&Response {
                result: "suspended".to_string()
            })
            .unwrap()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_login_when_the_user_is_permanently_suspended(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool).await;
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
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());
        assert_eq!(
            to_bytes(res.into_body()).await.unwrap(),
            serde_json::to_string(&Response {
                result: "suspended".to_string()
            })
            .unwrap()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_login_when_the_user_is_deactivated(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool).await;
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
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());
        assert_eq!(
            to_bytes(res.into_body()).await.unwrap(),
            serde_json::to_string(&Response {
                result: "deactivated".to_string()
            })
            .unwrap()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_login_when_the_user_is_soft_deleted(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool).await;
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
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());
        assert_eq!(
            to_bytes(res.into_body()).await.unwrap(),
            serde_json::to_string(&Response {
                result: "held_for_deletion".to_string()
            })
            .unwrap()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_login_if_the_email_is_not_verified(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool).await;
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
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());
        assert_eq!(
            to_bytes(res.into_body()).await.unwrap(),
            serde_json::to_string(&Response {
                result: "email_confirmation".to_string()
            })
            .unwrap()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_insert_client_device_and_location_into_the_session(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(services![get, post], pool).await;
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

    #[sqlx::test]
    async fn can_send_non_persistent_cookie_if_remember_me_is_set_to_false(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(services![get, post], pool).await;
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
            .uri("/v1/auth/login")
            .set_json(Request {
                email: email.to_string(),
                password: password.to_string(),
                remember_me: false,
            })
            .to_request();
        let post_res = test::call_service(&app, post_req).await;
        let cookie_value = post_res
            .response()
            .cookies()
            .find(|cookie| cookie.name() == "_storiny_sess")
            .unwrap();
        assert!(post_res.status().is_success());

        // Should be non-persistent
        assert!(cookie_value.max_age().is_none());

        Ok(())
    }

    #[sqlx::test]
    async fn can_send_persistent_cookie_if_remember_me_is_set_to_true(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(services![get, post], pool).await;
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
            .uri("/v1/auth/login")
            .set_json(Request {
                email: email.to_string(),
                password: password.to_string(),
                remember_me: true,
            })
            .to_request();
        let post_res = test::call_service(&app, post_req).await;
        let cookie_value = post_res
            .response()
            .cookies()
            .find(|cookie| cookie.name() == "_storiny_sess")
            .unwrap();
        assert!(post_res.status().is_success());

        // Should be persistent
        assert!(cookie_value.max_age().is_some());

        Ok(())
    }
}
