use actix_cors::Cors;
use actix_extensible_rate_limit::{
    backend::SimpleInputFunctionBuilder,
    RateLimiter,
};
use actix_files as fs;
use actix_request_identifier::RequestIdentifier;
use actix_web::{
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
use dotenv::dotenv;
use redis::aio::ConnectionManager;
use sailfish::TemplateOnce;
use std::{
    env,
    io,
    time::Duration,
};

mod error;
mod middleware;
mod models;
mod routes;

/// Index page template
#[derive(TemplateOnce)]
#[template(path = "index.stpl")]
pub struct IndexTemplate {
    req_id: String,
}

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
    let redis_client = redis::Client::open(format!("redis://{redis_host}:{redis_port}"))
        .expect("Cannot build Redis client");
    let redis_connection_manager = ConnectionManager::new(redis_client)
        .await
        .expect("Cannot build Redis connection manager");
    let backend = middleware::rate_limiter::RedisBackend::builder(redis_connection_manager)
        .key_prefix(Some("dsc_")) // Add prefix to avoid collisions with other servicse
        .build();

    HttpServer::new(move || {
        let input = SimpleInputFunctionBuilder::new(Duration::from_secs(5), 25) // 25 requests / 5s
            .real_ip_key()
            .build();

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
            .configure(routes::init_routes)
            .service(fs::Files::new("/", "./static"))
            .default_service(web::route().to(not_found))
    })
    .bind((host, port))?
    .run()
    .await
}
