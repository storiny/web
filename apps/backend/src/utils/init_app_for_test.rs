use crate::{
    middleware::{
        identity::middleware::IdentityMiddleware,
        session::{
            middleware::SessionMiddleware,
            storage::RedisSessionStore,
        },
    },
    AppState,
};
use actix_http::Request;
use actix_web::{
    cookie::{
        time::Duration,
        Key,
        SameSite,
    },
    dev::{
        HttpServiceFactory,
        Service,
        ServiceResponse,
    },
    test,
    web,
    App,
    Error,
};
use rusoto_signature::Region;

use rusoto_mock::{
    MockCredentialsProvider,
    MockRequestDispatcher,
};
use rusoto_ses::SesClient;
use sqlx::PgPool;
use std::env;
use user_agent_parser::UserAgentParser;

/// Initializes the server application for tests
///
/// * `service_factory` - Service factory
/// * `db_pool` - Postgres pool
pub async fn init_app_for_test(
    service_factory: impl HttpServiceFactory + 'static,
    db_pool: PgPool,
) -> impl Service<Request, Response = ServiceResponse, Error = Error> {
    let redis_host = env::var("REDIS_HOST").unwrap_or("localhost".to_string());
    let redis_port = env::var("REDIS_PORT").unwrap_or("7000".to_string());
    let redis_connection_string = format!("redis://{redis_host}:{redis_port}");
    let secret_key = Key::generate();
    let redis_store = RedisSessionStore::new(&redis_connection_string)
        .await
        .unwrap();

    // GeoIP service
    let geo_db = maxminddb::Reader::open_readfile("geo/db/GeoLite2-City.mmdb").unwrap();

    // User-agent parser
    let ua_parser = UserAgentParser::from_path("./data/ua_parser/regexes.yaml")
        .expect("Cannot build user-agent parser");

    test::init_service(
        App::new()
            .wrap(IdentityMiddleware::default())
            .wrap(
                SessionMiddleware::builder(redis_store.clone(), secret_key.clone())
                    .cookie_name("_storiny_sess".into())
                    .cookie_same_site(SameSite::None)
                    .cookie_domain("storiny.com".into())
                    .cookie_path("/".to_string())
                    .cookie_max_age(Duration::weeks(1))
                    .cookie_secure(true)
                    .cookie_http_only(true)
                    .build(),
            )
            .app_data(web::Data::new(AppState {
                redis: None,
                db_pool,
                geo_db,
                ua_parser,
                ses_client: SesClient::new_with(
                    MockRequestDispatcher::default(),
                    MockCredentialsProvider,
                    Region::UsEast1,
                ),
            }))
            .service(service_factory),
    )
    .await
}
