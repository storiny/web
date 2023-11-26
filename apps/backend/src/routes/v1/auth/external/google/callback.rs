use crate::{
    constants::account_activity_type::AccountActivityType,
    error::{
        AppError,
        ExternalAuthError,
    },
    middlewares::identity::identity::Identity,
    models::{
        notification::NotificationEntityType,
        user::UserFlag,
    },
    routes::oauth::AuthRequest,
    utils::{
        clear_user_sessions::clear_user_sessions,
        flag::{
            Flag,
            Mask,
        },
        generate_random_username::generate_random_username,
        get_client_device::get_client_device,
        get_client_location::get_client_location,
        get_user_sessions::get_user_sessions,
        truncate_str::truncate_str,
    },
    AppState,
    ExternalAuthTemplate,
};
use actix_extended_session::Session;
use actix_http::HttpMessage;
use actix_web::{
    get,
    http::header::{
        self,
        ContentType,
    },
    web,
    HttpRequest,
    HttpResponse,
};
use actix_web_validator::QsQuery;
use argon2::{
    Argon2,
    PasswordHash,
    PasswordVerifier,
};
use oauth2::{
    reqwest::async_http_client,
    AuthorizationCode,
    TokenResponse,
};
use sailfish::TemplateOnce;
use serde::Deserialize;
use sqlx::Row;
use std::net::IpAddr;
use time::OffsetDateTime;
use validator::Validate;

/// A [Google OAuth V2 API](https://www.googleapis.com/oauth2/v2/userinfo) endpoint response.
#[derive(Debug, Deserialize, Validate)]
struct Response {
    /// The name of the Google account.
    #[validate(length(min = 3))]
    name: String,
    /// The email address of the Google account.
    #[validate(email)]
    #[validate(length(min = 3, max = 300))]
    email: String,
    /// The unique ID that identifies this Google account.
    #[validate(length(min = 3, max = 256))]
    id: String,
}

async fn handle_oauth_request(
    req: HttpRequest,
    data: &web::Data<AppState>,
    session: &Session,
    params: Option<&QsQuery<AuthRequest>>,
    access_token_param: Option<String>,
    user_password: Option<String>,
) -> Result<(), ExternalAuthError> {
    let mut access_token = access_token_param.clone().unwrap_or_default();
    let reqwest_client = &data.reqwest_client;

    if let Some(params) = params {
        let oauth_token = session
            .get::<String>("oauth_token")
            .map_err(|err| ExternalAuthError::Other(err.to_string()))?
            .ok_or(ExternalAuthError::Other(
                "unable to extract the oauth token from the session".to_string(),
            ))?;

        // Check whether the CSRF token has been tampered
        if oauth_token != params.state {
            return Err(ExternalAuthError::StateMismatch);
        }

        // Remove the CSRF token from the session.
        session.remove("oauth_token");

        let code = AuthorizationCode::new(params.code.clone());
        let token_res = (&data.oauth_client_map.google)
            .exchange_code(code)
            .request_async(async_http_client)
            .await
            .map_err(|err| ExternalAuthError::Other(err.to_string()))?;

        // Check if the `userinfo.email` and `userinfo.profile` scopes were granted, required for
        // obtaining the account details.
        let received_scopes = token_res
            .scopes()
            .ok_or(ExternalAuthError::InsufficientScopes)?
            .iter()
            .map(|scope| scope.as_str())
            .collect::<Vec<_>>();

        if !vec![
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
        ]
        .iter()
        .all(|scope| received_scopes.contains(scope))
        {
            return Err(ExternalAuthError::InsufficientScopes);
        }

        access_token = token_res.access_token().secret().to_string();
    }

    // Fetch the account details
    let google_data = reqwest_client
        .get("https://www.googleapis.com/oauth2/v2/userinfo?alt=json")
        .header("Content-type", ContentType::json().to_string())
        .header(header::AUTHORIZATION, format!("Bearer {access_token}"))
        .send()
        .await
        .map_err(|err| {
            if access_token_param.is_some() {
                ExternalAuthError::InvalidAccessToken
            } else {
                ExternalAuthError::Other(err.to_string())
            }
        })?
        .json::<Response>()
        .await
        .map_err(|err| ExternalAuthError::Other(err.to_string()))?;

    // Check if Google returned an invalid response.
    google_data
        .validate()
        .map_err(|err| ExternalAuthError::Other(err.to_string()))?;

    handle_google_profile_data(google_data, req, data, session, access_token, user_password).await
}

/// Handles Google account profile data response. It creates a session if the user has previously
/// signed-in using Google, otherwise inserts a new user with the data based on the Google
/// account profile response into the database.
///
/// If a user already exists with the email address received from Google, the user is redirected to
/// the password verification page. This helps unwanted access to accounts that might have the same
/// email address.
///
/// * `google_data` - The response from the Google OAuth API call.
/// * `req` - The HTTP request.
/// * `data` - The shared API server data.
/// * `session` - The session instance for the user.
/// * `access_token` - The access token received from Google.
/// * `user_password` - The password provided by the user for their Storiny account.
async fn handle_google_profile_data(
    google_data: Response,
    req: HttpRequest,
    data: &web::Data<AppState>,
    session: &Session,
    access_token: String,
    user_password: Option<String>,
) -> Result<(), ExternalAuthError> {
    if let Some(provided_password) = user_password {
        // Verify the password sent by the user.
        match sqlx::query(
            r#"
            SELECT password FROM users
            WHERE
                email = $1
                AND password IS NOT NULL
            "#,
        )
        .bind(&google_data.email)
        .fetch_one(&data.db_pool)
        .await
        {
            Ok(result) => match PasswordHash::new(&result.get::<String, _>("password")) {
                Ok(hash) => {
                    match Argon2::default().verify_password(&provided_password.as_bytes(), &hash) {
                        Ok(_) => {}
                        Err(_) => return Err(ExternalAuthError::InvalidPassword),
                    }
                }
                Err(err) => return Err(ExternalAuthError::Other(err.to_string())),
            },
            Err(error) => match error {
                // Skip password verification if the user with the provided email does not exist or
                // has not set a password.
                sqlx::error::Error::RowNotFound => {}
                _ => return Err(ExternalAuthError::Other(error.to_string())),
            },
        }
    } else {
        // Request to verify the user's password if the user already exist with the email address
        // received from Google.
        match sqlx::query(
            r#"
            SELECT EXISTS (
                SELECT 1 FROM users
                WHERE
                    email = $1
                    AND password IS NOT NULL
            )
            "#,
        )
        .bind(&google_data.email)
        .fetch_one(&data.db_pool)
        .await
        {
            Ok(result) => {
                if result.get::<bool, _>("exists") {
                    return Err(ExternalAuthError::VerifyPassword(access_token));
                }
            }
            Err(error) => {
                if !matches!(error, sqlx::error::Error::RowNotFound) {
                    return Err(ExternalAuthError::Other(error.to_string()));
                }
            }
        }
    }

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool
        .begin()
        .await
        .map_err(|err| ExternalAuthError::Other(err.to_string()))?;
    // `insert` or `update`
    let mut upsert_type: Option<&str> = None;

    let user_data = match sqlx::query(
        r#"
        SELECT
            id,
            public_flags,
            deleted_at,
            deactivated_at
        FROM users
        WHERE login_google_id = $1
        "#,
    )
    .bind(&google_data.id)
    .fetch_one(&mut *txn)
    .await
    {
        Ok(result) => (
            result.get::<i64, _>("id"),
            result.get::<i32, _>("public_flags"),
            result.get::<Option<OffsetDateTime>, _>("deactivated_at"),
            result.get::<Option<OffsetDateTime>, _>("deleted_at"),
        ),
        Err(err) => {
            // Upsert a user
            if matches!(err, sqlx::error::Error::RowNotFound) {
                let upsert_result = sqlx::query(
                    r#"
                    WITH inserted_user AS (
                        INSERT INTO users (name, username, email, login_google_id)
                        VALUES ($1, $2, $3, $4)
                        ON CONFLICT (email) DO NOTHING
                        RETURNING
                            id,
                            public_flags,
                            deleted_at,
                            deactivated_at
                    ),
                    updated_user AS (
                        UPDATE users
                        SET login_google_id = $4
                        WHERE
                            email = $3
                            AND NOT EXISTS (SELECT 1 FROM inserted_user)
                        RETURNING 
                            id,
                            public_flags,
                            deleted_at,
                            deactivated_at
                    )
                    SELECT 
                        COALESCE (
                            (SELECT id FROM updated_user),
                            (SELECT id FROM inserted_user)
                        ) AS "id",
                        COALESCE (
                            (SELECT public_flags FROM updated_user),
                            (SELECT public_flags FROM inserted_user)
                        ) AS "public_flags",
                        COALESCE (
                            (SELECT deleted_at FROM updated_user),
                            (SELECT deleted_at FROM inserted_user)
                        ) AS "deleted_at",
                        COALESCE (
                            (SELECT deactivated_at FROM updated_user),
                            (SELECT deactivated_at FROM inserted_user)
                        ) AS "deactivated_at",
                        CASE WHEN
                            EXISTS (
                                SELECT 1 FROM updated_user
                            )
                        THEN TRUE ELSE FALSE
                        END AS "has_updated"
                    "#,
                )
                .bind(truncate_str(&google_data.name, 32))
                .bind(
                    generate_random_username(&google_data.name, &mut txn)
                        .await
                        .map_err(|_| {
                            ExternalAuthError::Other(
                                "unable to generate a random username".to_string(),
                            )
                        })?,
                )
                .bind(&google_data.email)
                .bind(&google_data.id)
                .fetch_one(&mut *txn)
                .await
                .map_err(|err| ExternalAuthError::Other(err.to_string()))?;

                if upsert_result.get::<bool, _>("has_updated") {
                    upsert_type = Some("update");
                } else {
                    upsert_type = Some("insert")
                }

                (
                    upsert_result.get::<i64, _>("id"),
                    upsert_result.get::<i32, _>("public_flags"),
                    upsert_result.get::<Option<OffsetDateTime>, _>("deactivated_at"),
                    upsert_result.get::<Option<OffsetDateTime>, _>("deleted_at"),
                )
            } else {
                return Err(ExternalAuthError::Other(err.to_string()));
            }
        }
    };

    let user_id = user_data.0;

    // Check if the user is valid
    {
        let (_, public_flags, deactivated_at, deleted_at) = user_data;

        if deleted_at.is_some() {
            return Err(ExternalAuthError::UserDeleted);
        } else if deactivated_at.is_some() {
            return Err(ExternalAuthError::UserDeactivated);
        }

        let user_flags = Flag::new(public_flags as u32);

        // User suspended
        if user_flags.has_any_of(Mask::Multiple(vec![
            UserFlag::TemporarilySuspended,
            UserFlag::PermanentlySuspended,
        ])) {
            return Err(ExternalAuthError::UserSuspended);
        }
    }

    let mut client_device_value = "Unknown device".to_string();
    let mut client_location_value: Option<String> = None;

    // Insert additional data to the session
    {
        if let Some(ip) = req.connection_info().realip_remote_addr() {
            if let Ok(parsed_ip) = ip.parse::<IpAddr>() {
                let client_location_result = get_client_location(parsed_ip, &data.geo_db);
                client_location_value = Some(client_location_result.display_name.to_string());

                if let Ok(client_location) = serde_json::to_value(client_location_result) {
                    session.insert("location", client_location);
                }
            }
        }

        if let Some(ua_header) = (&req.headers()).get("user-agent") {
            if let Ok(ua) = ua_header.to_str() {
                let client_device_result = get_client_device(ua, &data.ua_parser);
                client_device_value = client_device_result.display_name.to_string();

                if let Ok(client_device) = serde_json::to_value(client_device_result) {
                    session.insert("device", client_device);
                }
            }
        }
    }

    if upsert_type == Some("update") {
        // Insert an account activity
        sqlx::query(
            r#"
            INSERT INTO account_activities (type, description, user_id)
            VALUES (
                $2,
                'You added <m>Google</m> as a third-party login method.',
                $1
            )
            "#,
        )
        .bind(user_id)
        .bind(AccountActivityType::ThirdPartyLogin as i16)
        .execute(&mut *txn)
        .await
        .map_err(|err| ExternalAuthError::Other(err.to_string()))?;
    // Do not insert a login notification when a new user is created
    } else if upsert_type.is_none() {
        // Insert a login notification
        sqlx::query(
            r#"
            WITH inserted_notification AS (
                INSERT INTO notifications (entity_type)
                VALUES ($1)
                RETURNING id
            )
            INSERT
            INTO
                notification_outs (
                    notified_id,
                    notification_id,
                    rendered_content
                )
            SELECT
                $2, (SELECT id FROM inserted_notification), $3
            "#,
        )
        .bind(NotificationEntityType::LoginAttempt as i16)
        .bind(user_id)
        .bind(if let Some(location) = client_location_value {
            format!("{client_device_value}:{location}")
        } else {
            client_device_value
        })
        .execute(&mut *txn)
        .await
        .map_err(|err| ExternalAuthError::Other(err.to_string()))?;
    }

    txn.commit()
        .await
        .map_err(|err| ExternalAuthError::Other(err.to_string()))?;

    // Check if the user maintains more than or equal to 10 sessions, and
    // delete all the previous sessions if the current number of active
    // sessions for the user exceeds the per user session limit (10).
    match get_user_sessions(&data.redis, user_id).await {
        Ok(sessions) => {
            if sessions.len() >= 10 {
                match clear_user_sessions(&data.redis, user_id).await {
                    Ok(_) => {}
                    Err(_) => {
                        return Err(ExternalAuthError::Other(
                            "unable to clear user sessions".to_string(),
                        ));
                    }
                };
            }
        }
        Err(_) => {
            return Err(ExternalAuthError::Other(
                "unable to fetch user sessions".to_string(),
            ));
        }
    };

    Identity::login(&req.extensions(), user_id)
        .and_then(|_| Ok(()))
        .map_err(|err| ExternalAuthError::Other(err.to_string()))
}

// Without password verification
#[get("/v1/auth/external/google/callback")]
async fn get(
    req: HttpRequest,
    data: web::Data<AppState>,
    params: QsQuery<AuthRequest>,
    session: Session,
    user: Option<Identity>,
) -> Result<HttpResponse, AppError> {
    // Redirect to the web server if already logged-in
    if user.is_some() {
        return Ok(HttpResponse::Found()
            .append_header((header::LOCATION, data.config.web_server_url.to_string()))
            .finish());
    }

    match handle_oauth_request(req, &data, &session, Some(&params), None, None).await {
        // Redirect to the web server location on successful login.
        Ok(_) => Ok(HttpResponse::Found()
            .append_header((header::LOCATION, data.config.web_server_url.to_string()))
            .finish()),
        Err(error) => Ok(HttpResponse::Ok().content_type(ContentType::html()).body(
            ExternalAuthTemplate {
                access_token: match &error {
                    ExternalAuthError::VerifyPassword(access_token) => access_token.to_string(),
                    _ => "".to_string(),
                },
                provider_id: "google".to_string(),
                provider_name: "Google".to_string(),
                error: if matches!(error, ExternalAuthError::VerifyPassword(_)) {
                    None
                } else {
                    Some(error)
                },
                ..Default::default()
            }
            .render_once()
            .unwrap(),
        )),
    }
}

#[derive(Deserialize, Validate)]
struct VerificationRequest {
    access_token: String,
    password: String,
}

// With password verification
#[get("/v1/auth/external/google/verification")]
async fn verify(
    req: HttpRequest,
    data: web::Data<AppState>,
    session: Session,
    user: Option<Identity>,
    params: QsQuery<VerificationRequest>,
) -> Result<HttpResponse, AppError> {
    // Redirect to the web server if already logged-in
    if user.is_some() {
        return Ok(HttpResponse::Found()
            .append_header((header::LOCATION, data.config.web_server_url.to_string()))
            .finish());
    }

    match handle_oauth_request(
        req,
        &data,
        &session,
        None,
        Some((&params.access_token).to_string()),
        Some((&params.password).to_string()),
    )
    .await
    {
        // Redirect to the web server location on successful login.
        Ok(_) => Ok(HttpResponse::Found()
            .append_header((header::LOCATION, data.config.web_server_url.to_string()))
            .finish()),
        Err(error) => Ok(HttpResponse::Ok().content_type(ContentType::html()).body(
            ExternalAuthTemplate {
                access_token: (&params.access_token).to_string(),
                provider_id: "google".to_string(),
                provider_name: "Google".to_string(),
                is_password_invalid: matches!(error, ExternalAuthError::InvalidPassword),
                error: if matches!(error, ExternalAuthError::InvalidPassword) {
                    None
                } else {
                    Some(error)
                },
            }
            .render_once()
            .unwrap(),
        )),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
    cfg.service(verify);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_response_body_text,
        init_app_for_test,
    };
    use actix_web::{
        test,
        Responder,
    };
    use argon2::{
        password_hash::{
            rand_core::OsRng,
            SaltString,
        },
        PasswordHasher,
    };
    use sqlx::PgPool;

    #[get("/google-login")]
    async fn post(req: HttpRequest, data: web::Data<AppState>, session: Session) -> impl Responder {
        match handle_google_profile_data(
            Response {
                id: "1".to_string(),
                email: "someone@example.com".to_string(),
                name: "Test Google account".to_string(),
            },
            req,
            &data,
            &session,
            "".to_string(),
            None,
        )
        .await
        {
            Ok(_) => HttpResponse::Ok().finish(),
            Err(error) => match error {
                ExternalAuthError::UserDeleted => HttpResponse::BadRequest().body("user_deleted"),
                ExternalAuthError::UserDeactivated => {
                    HttpResponse::BadRequest().body("user_deactivated")
                }
                ExternalAuthError::UserSuspended => {
                    HttpResponse::BadRequest().body("user_suspended")
                }
                ExternalAuthError::VerifyPassword(_) => {
                    HttpResponse::BadRequest().body("verify_password")
                }
                ExternalAuthError::InvalidPassword => {
                    HttpResponse::BadRequest().body("invalid_password")
                }
                _ => HttpResponse::InternalServerError().finish(),
            },
        }
    }

    #[get("/google-login-with-password")]
    async fn post_with_password(
        req: HttpRequest,
        data: web::Data<AppState>,
        session: Session,
    ) -> impl Responder {
        match handle_google_profile_data(
            Response {
                id: "1".to_string(),
                email: "someone@example.com".to_string(),
                name: "Test Google account".to_string(),
            },
            req,
            &data,
            &session,
            "".to_string(),
            Some("some_password".to_string()),
        )
        .await
        {
            Ok(_) => HttpResponse::Ok().finish(),
            Err(error) => match error {
                ExternalAuthError::UserDeleted => HttpResponse::BadRequest().body("user_deleted"),
                ExternalAuthError::UserDeactivated => {
                    HttpResponse::BadRequest().body("user_deactivated")
                }
                ExternalAuthError::UserSuspended => {
                    HttpResponse::BadRequest().body("user_suspended")
                }
                ExternalAuthError::VerifyPassword(_) => {
                    HttpResponse::BadRequest().body("verify_password")
                }
                ExternalAuthError::InvalidPassword => {
                    HttpResponse::BadRequest().body("invalid_password")
                }
                _ => HttpResponse::InternalServerError().finish(),
            },
        }
    }

    #[sqlx::test]
    async fn can_login_using_google(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, _) = init_app_for_test(post, pool, false, false, None).await;

        let req = test::TestRequest::get().uri("/google-login").to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // New user should be present in the database
        let result = sqlx::query(
            r#"
            SELECT EXISTS (
                SELECT 1 FROM users
                WHERE login_google_id = $1
            )
            "#,
        )
        .bind("1")
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("exists"));

        // Should not insert a notification for new user
        let result = sqlx::query(
            r#"
            SELECT
                EXISTS (
                    SELECT
                        1
                    FROM
                        notification_outs
                    WHERE
                        notification_id = (
                            SELECT id FROM notifications
                            WHERE entity_type = $1
                        )
                   )
            "#,
        )
        .bind(NotificationEntityType::LoginAttempt as i16)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_login_using_google_for_an_existing_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Update `login_google_id` for the current user
        let result = sqlx::query(
            r#"
            UPDATE users
            SET login_google_id = $1
            WHERE id = $2
            "#,
        )
        .bind("1")
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get().uri("/google-login").to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // New user should not be inserted in the database
        let result = sqlx::query(r#"SELECT 1 FROM users"#)
            .fetch_all(&mut *conn)
            .await?;

        assert_eq!(result.len(), 1);

        // Should insert a notification
        let result = sqlx::query(
            r#"
            SELECT
                EXISTS (
                    SELECT
                        1
                    FROM
                        notification_outs
                    WHERE
                        notification_id = (
                            SELECT id FROM notifications
                            WHERE entity_type = $1
                        )
                   )
            "#,
        )
        .bind(NotificationEntityType::LoginAttempt as i16)
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_update_login_google_id_for_an_existing_user_without_password(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, user_id) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::get().uri("/google-login").to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // User should get updated in the database
        let result = sqlx::query(
            r#"
            SELECT login_google_id
            FROM users
            WHERE id = $1
            "#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<Option<String>, _>("login_google_id").is_some());

        // Should insert an account activity
        let result = sqlx::query(
            r#"
            SELECT EXISTS (
                SELECT 1
                FROM account_activities
                WHERE type = $1
            )
            "#,
        )
        .bind(AccountActivityType::ThirdPartyLogin as i16)
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_new_google_login_for_an_existing_user_with_no_password_provided(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Add a password for the user
        let result = sqlx::query(
            r#"
            UPDATE users
            SET password = $1
            WHERE id = $2
            "#,
        )
        .bind("some_bad_password")
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get().uri("/google-login").to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "verify_password").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_new_google_login_for_an_existing_user_with_invalid_password(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, user_id) =
            init_app_for_test(post_with_password, pool, true, false, None).await;

        let salt = SaltString::generate(&mut OsRng);
        let password_hash = Argon2::default()
            .hash_password("some_other_password".as_bytes(), &salt)
            .unwrap()
            .to_string();

        // Add a different password for the user
        let result = sqlx::query(
            r#"
            UPDATE users
            SET password = $1
            WHERE id = $2
            "#,
        )
        .bind(password_hash)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .uri("/google-login-with-password")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "invalid_password").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_update_login_google_id_for_an_existing_user_with_password(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, user_id) =
            init_app_for_test(post_with_password, pool, true, false, None).await;

        let salt = SaltString::generate(&mut OsRng);
        let password_hash = Argon2::default()
            .hash_password("some_password".as_bytes(), &salt)
            .unwrap()
            .to_string();

        // Add a valid password for the user
        let result = sqlx::query(
            r#"
            UPDATE users
            SET password = $1
            WHERE id = $2
            "#,
        )
        .bind(password_hash)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .uri("/google-login-with-password")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // User should get updated in the database
        let result = sqlx::query(
            r#"
            SELECT login_google_id
            FROM users WHERE id = $1
            "#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<Option<String>, _>("login_google_id").is_some());

        // Should insert an account activity
        let result = sqlx::query(
            r#"
            SELECT EXISTS (
                SELECT 1
                FROM account_activities
                WHERE type = $1
            )
            "#,
        )
        .bind(AccountActivityType::ThirdPartyLogin as i16)
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.get::<bool, _>("exists"));

        Ok(())
    }

    //

    #[sqlx::test]
    async fn can_reject_google_login_for_a_temporarily_suspended_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, user_id) = init_app_for_test(post, pool, true, false, None).await;
        let mut flags = Flag::new(0);
        flags.add_flag(UserFlag::TemporarilySuspended);

        // Update flags and login ID for the current user
        let result = sqlx::query(
            r#"
            UPDATE users
            SET
                public_flags = $1,
                login_google_id = $2
            WHERE id = $3
            "#,
        )
        .bind(flags.get_flags() as i32)
        .bind("1")
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get().uri("/google-login").to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "user_suspended").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_google_login_for_a_permanently_suspended_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, user_id) = init_app_for_test(post, pool, true, false, None).await;
        let mut flags = Flag::new(0);
        flags.add_flag(UserFlag::PermanentlySuspended);

        // Update flags and login ID for the current user
        let result = sqlx::query(
            r#"
            UPDATE users
            SET
                public_flags = $1,
                login_google_id = $2
            WHERE id = $3
            "#,
        )
        .bind(flags.get_flags() as i32)
        .bind("1")
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get().uri("/google-login").to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "user_suspended").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_google_login_for_a_soft_deleted_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Update `login_google_id` and soft-delete the current user
        let result = sqlx::query(
            r#"
            UPDATE users
            SET
                deleted_at = now(),
                login_google_id = $1
            WHERE id = $2
            "#,
        )
        .bind("1")
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get().uri("/google-login").to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "user_deleted").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_google_login_for_a_deactivated_user(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Update `login_google_id` and deactivate the current user
        let result = sqlx::query(
            r#"
            UPDATE users
            SET
                deactivated_at = now(),
                login_google_id = $1
            WHERE id = $2
            "#,
        )
        .bind("1")
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get().uri("/google-login").to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "user_deactivated").await;

        Ok(())
    }

    //

    #[sqlx::test]
    async fn can_reject_a_new_google_login_for_a_temporarily_suspended_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, user_id) = init_app_for_test(post, pool, true, false, None).await;
        let mut flags = Flag::new(0);
        flags.add_flag(UserFlag::TemporarilySuspended);

        // Update flags for the current user
        let result = sqlx::query(
            r#"
            UPDATE users
            SET public_flags = $1
            WHERE id = $2
            "#,
        )
        .bind(flags.get_flags() as i32)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get().uri("/google-login").to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "user_suspended").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_new_google_login_for_a_permanently_suspended_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, user_id) = init_app_for_test(post, pool, true, false, None).await;
        let mut flags = Flag::new(0);
        flags.add_flag(UserFlag::PermanentlySuspended);

        // Update flags for the current user
        let result = sqlx::query(
            r#"
            UPDATE users
            SET public_flags = $1
            WHERE id = $2
            "#,
        )
        .bind(flags.get_flags() as i32)
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get().uri("/google-login").to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "user_suspended").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_new_google_login_for_a_soft_deleted_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Soft-delete the current user
        let result = sqlx::query(
            r#"
            UPDATE users
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get().uri("/google-login").to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "user_deleted").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_new_google_login_for_a_deactivated_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, _, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Deactivate the current user
        let result = sqlx::query(
            r#"
            UPDATE users
            SET deactivated_at = now()
            WHERE id = $1
            "#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get().uri("/google-login").to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "user_deactivated").await;

        Ok(())
    }
}
