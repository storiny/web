use crate::{
    middleware::session::{
        config::CookieContentSecurity,
        storage::RedisSessionStore,
        SessionMiddleware,
    },
    AppState,
};
use actix_http::Request;
use actix_identity::IdentityMiddleware;
use actix_web::{
    cookie::{
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
    let secret_key = Key::generate();
    let redis_store = RedisSessionStore::new(format!("redis://{redis_host}:{redis_port}"))
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
                    .cookie_name("_storiny_sess".to_string())
                    .cookie_same_site(SameSite::None)
                    .cookie_domain("storiny.com".to_string())
                    .cookie_path("/".to_string())
                    .cookie_secure(true)
                    .cookie_http_only(true)
                    .cookie_content_security(CookieContentSecurity::Signed)
                    .build(),
            )
            .app_data(web::Data::new(AppState {
                db_pool,
                geo_db,
                ua_parser,
            }))
            .service(service_factory),
    )
    .await
}
