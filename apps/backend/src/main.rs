use actix_cors::Cors;
use actix_extensible_rate_limit::{
    backend::SimpleInputFunctionBuilder,
    RateLimiter,
};
use actix_files as fs;
use actix_redis::RedisActor;
use actix_request_identifier::RequestIdentifier;
use actix_web::{
    cookie::{
        Key,
        SameSite,
    },
    http::{
        header,
        header::ContentType,
    },
    middleware::Logger,
    web,
    App,
    HttpResponse,
    HttpServer,
    Responder,
};
use actix_web_validator::{
    JsonConfig,
    QsQueryConfig,
};
use dotenv::dotenv;
use middleware::session::{
    middleware::SessionMiddleware,
    storage::RedisSessionStore,
};
use redis::aio::ConnectionManager;
use rusoto_ses::SesClient;
use rusoto_signature::Region;
use sqlx::postgres::PgPoolOptions;
use std::{
    env,
    io,
    time::Duration,
};
use storiny::{
    error::FormErrorResponse,
    middleware::identity::middleware::IdentityMiddleware,
    *,
};
use user_agent_parser::UserAgentParser;

mod middleware;

/// 404 response
async fn not_found() -> impl Responder {
    HttpResponse::NotFound()
        .content_type(ContentType::plaintext())
        .body("Not found")
}

#[actix_web::main]
async fn main() -> io::Result<()> {
    dotenv().ok();
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    let host = env::var("HOST").expect("Host not set");
    let port = (env::var("PORT").expect("Port not set"))
        .parse::<u16>()
        .unwrap();

    log::info!(
        "{}",
        format!("Starting back-end HTTP server at http://{host}:{port}")
    );

    let allowed_origin = env::var("ALLOWED_ORIGIN").expect("Allowed origin not set");

    let redis_host = env::var("REDIS_HOST").unwrap_or("localhost".to_string());
    let redis_port = env::var("REDIS_PORT").unwrap_or("7000".to_string());
    let redis_connection_string = format!("redis://{redis_host}:{redis_port}");

    // Rate-limit
    let redis_client =
        redis::Client::open(redis_connection_string.clone()).expect("Cannot build Redis client");
    let redis_connection_manager = ConnectionManager::new(redis_client)
        .await
        .expect("Cannot build Redis connection manager");
    let backend = middleware::rate_limiter::rate_limiter::RedisBackend::builder(
        redis_connection_manager.clone(),
    )
    .key_prefix(Some("lim:a:")) // Add prefix to avoid collisions with other servicse
    .build();

    // Session
    // TODO: The secret key would usually be read from a configuration file/environment variables.
    let secret_key = Key::generate();
    let redis_store = RedisSessionStore::new(&redis_connection_string.clone())
        .await
        .unwrap();

    // Postgres
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL not set");
    let db_pool = match PgPoolOptions::new()
        .max_connections(15)
        .connect(&database_url)
        .await
    {
        Ok(pool) => {
            println!("Connected to Postgres");
            pool
        }
        Err(err) => {
            println!("Failed to connect to Postgres: {:?}", err);
            std::process::exit(1);
        }
    };

    HttpServer::new(move || {
        let input = SimpleInputFunctionBuilder::new(Duration::from_secs(5), 25) // 25 requests / 5s
            .real_ip_key()
            .build();

        // GeoIP service
        let geo_db = maxminddb::Reader::open_readfile("geo/db/GeoLite2-City.mmdb").unwrap();

        // User-agent parser
        let ua_parser = UserAgentParser::from_path("./data/ua_parser/regexes.yaml")
            .expect("Cannot build user-agent parser");

        // JSON validation error handler
        let json_config = JsonConfig::default().error_handler(|err, _| {
            let json_error = match &err {
                actix_web_validator::Error::Validate(error) => FormErrorResponse::from(error),
                _ => FormErrorResponse::new(Vec::new()),
            };

            actix_web::error::InternalError::from_response(
                err,
                HttpResponse::Conflict().json(json_error),
            )
            .into()
        });

        // Query validation error handler
        let qs_query_config = QsQueryConfig::default().error_handler(|err, _| {
            actix_web::error::InternalError::from_response(
                err,
                HttpResponse::Conflict().body("Invalid query parameters".to_string()),
            )
            .into()
        });

        App::new()
            .wrap(
                RateLimiter::builder(backend.clone(), input)
                    .add_headers()
                    .build(),
            )
            .wrap(
                Cors::default()
                    .allowed_origin(&allowed_origin)
                    .allowed_headers(vec![
                        header::CONTENT_TYPE,
                        header::AUTHORIZATION,
                        header::ACCEPT,
                    ])
                    .supports_credentials()
                    .max_age(3600),
            )
            .wrap(RequestIdentifier::with_uuid())
            .wrap(Logger::new(
                "%a %t \"%r\" %s %b \"%{Referer}i\" \"%{User-Agent}i\" %T",
            ))
            .wrap(IdentityMiddleware::default())
            .wrap(
                SessionMiddleware::builder(redis_store.clone(), secret_key.clone())
                    .cookie_name("_storiny_sess".into())
                    .cookie_same_site(SameSite::None)
                    .cookie_domain("storiny.com".into())
                    .cookie_path("/".to_string())
                    .cookie_max_age(actix_web::cookie::time::Duration::weeks(1))
                    .cookie_secure(true)
                    .cookie_http_only(true)
                    .build(),
            )
            .app_data(json_config)
            .app_data(qs_query_config)
            .app_data(web::Data::new(AppState {
                redis: Some(RedisActor::start(format!("{redis_host}:{redis_port}"))),
                db_pool: db_pool.clone(),
                geo_db,
                ua_parser,
                ses_client: SesClient::new(Region::UsEast1),
            }))
            .configure(routes::init_routes)
            .service(fs::Files::new("/", "./static"))
            .default_service(web::route().to(not_found))
    })
    .bind((host, port))?
    .run()
    .await
}
