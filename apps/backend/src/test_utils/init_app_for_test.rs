use crate::{
    config::Config,
    middleware::identity::{identity::Identity, middleware::IdentityMiddleware},
    oauth::get_oauth_client_map,
    AppState,
};
use actix_http::{HttpMessage, Request};
use actix_session::config::{CookieContentSecurity, PersistentSession};
use actix_session::{storage::RedisSessionStore, SessionMiddleware};
use actix_web::{
    cookie::{Cookie, Key, SameSite},
    dev::{HttpServiceFactory, Service, ServiceResponse},
    post, test, web, App, Error, HttpRequest, HttpResponse, Responder,
};
use rusoto_mock::{MockCredentialsProvider, MockRequestDispatcher};
use rusoto_s3::S3Client;
use rusoto_ses::SesClient;
use rusoto_signature::Region;
use sqlx::PgPool;
use user_agent_parser::UserAgentParser;

// Private login route
#[post("/__login__")]
async fn post(req: HttpRequest) -> impl Responder {
    Identity::login(&req.extensions(), 1_i64).unwrap();
    HttpResponse::Ok().finish()
}

/// Initializes the server application for tests
///
/// * `service_factory` - Service factory
/// * `db_pool` - Postgres pool
/// * `logged_in` - Whether to create a session for the user.
/// * `skip_inserting_user` - Whether to skip inserting the user into the database when
///   `logged_in` is enabled.
pub async fn init_app_for_test(
    service_factory: impl HttpServiceFactory + 'static,
    db_pool: PgPool,
    logged_in: bool,
    skip_inserting_user: bool,
) -> (
    impl Service<Request, Response = ServiceResponse, Error = Error>,
    Option<Cookie<'static>>,
    Option<i64>, // User ID
) {
    let config = envy::from_env::<Config>().expect("Unable to load environment configuration");
    let redis_connection_string = format!("redis://{}:{}", config.redis_host, config.redis_port);
    let secret_key = Key::generate();
    let redis_store = RedisSessionStore::new(&redis_connection_string)
        .await
        .unwrap();

    // GeoIP service
    let geo_db = maxminddb::Reader::open_readfile("geo/db/GeoLite2-City.mmdb").unwrap();

    // User-agent parser
    let ua_parser = UserAgentParser::from_path("./data/ua_parser/regexes.yaml")
        .expect("Cannot build user-agent parser");

    let service = test::init_service(
        App::new()
            .wrap(IdentityMiddleware::default())
            .wrap(
                SessionMiddleware::builder(redis_store.clone(), secret_key.clone())
                    .session_lifecycle(
                        PersistentSession::default().session_ttl(time::Duration::weeks(1)),
                    )
                    .cookie_content_security(CookieContentSecurity::Signed)
                    .cookie_name("_storiny_sess".into())
                    .cookie_same_site(SameSite::None)
                    .cookie_domain(None)
                    .cookie_path("/".to_string())
                    .cookie_secure(true)
                    .cookie_http_only(true)
                    .build(),
            )
            .wrap(actix_web::middleware::NormalizePath::trim())
            .app_data(web::Data::new(AppState {
                config,
                redis: None,
                db_pool: db_pool.clone(),
                geo_db,
                ua_parser,
                ses_client: SesClient::new_with(
                    MockRequestDispatcher::default(),
                    MockCredentialsProvider,
                    Region::UsEast1,
                ),
                s3_client: S3Client::new_with(
                    MockRequestDispatcher::default(),
                    MockCredentialsProvider,
                    Region::UsEast1,
                ),
                reqwest_client: reqwest::Client::new(),
                oauth_client_map: get_oauth_client_map(envy::from_env::<Config>().unwrap()),
            }))
            .service(post)
            .service(service_factory),
    )
    .await;

    if logged_in {
        if !skip_inserting_user {
            // Insert the user
            sqlx::query(
                r#"
                INSERT INTO users(id, name, username, email)
                VALUES ($1, $2, $3, $4)
                "#,
            )
            .bind(1_i64)
            .bind("Some user".to_string())
            .bind("some_user".to_string())
            .bind("someone@example.com".to_string())
            .execute(&db_pool)
            .await
            .unwrap();
        }

        // Log the user in
        let req = test::TestRequest::post().uri("/__login__").to_request();
        let res = test::call_service(&service, req).await;
        let cookie = res
            .response()
            .cookies()
            .find(|cookie| cookie.name() == "_storiny_sess")
            .unwrap();

        return (service, Some(cookie.into_owned()), Some(1_i64));
    }

    (service, None, None)
}
