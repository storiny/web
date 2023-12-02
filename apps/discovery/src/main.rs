use actix_cors::Cors;
use actix_extensible_rate_limit::{
    backend::SimpleInputFunctionBuilder,
    RateLimiter,
};
use actix_files as fs;
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
use std::{
    io,
    time::Duration,
};
use storiny_discovery::{
    config::get_app_config,
    constants::redis_namespaces::RedisNamespace,
    routes,
};

mod middlewares;

/// The 404 response handler.
async fn not_found() -> impl Responder {
    HttpResponse::NotFound()
        .content_type(ContentType::plaintext())
        .body("Not found")
}

#[actix_web::main]
async fn main() -> io::Result<()> {
    dotenv().ok();

    match get_app_config() {
        Ok(config) => {
            env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

            let host = config.host.to_string();
            let port = config.port.clone().parse::<u16>().unwrap();
            let redis_connection_string =
                format!("redis://{}:{}", &config.redis_host, &config.redis_port);

            log::info!(
                "{}",
                format!(
                    "Starting discovery HTTP server in {} mode at {}:{}",
                    if config.is_dev {
                        "development"
                    } else {
                        "production"
                    },
                    &host,
                    &port
                )
            );

            // Rate-limit
            let redis_client = redis::Client::open(redis_connection_string.clone())
                .expect("Cannot build Redis client");
            let redis_connection_manager = ConnectionManager::new(redis_client)
                .await
                .expect("Cannot build Redis connection manager");
            let rate_limit_backend =
                middlewares::rate_limiter::RedisBackend::builder(redis_connection_manager)
                    .key_prefix(Some(&format!("{}:", RedisNamespace::RateLimit.to_string()))) // Add prefix to avoid collisions with other servicse
                    .build();

            let web_config = web::Data::new(config.clone());

            HttpServer::new(move || {
                let input = SimpleInputFunctionBuilder::new(Duration::from_secs(5), 25) // 25 requests / 5s
                    .real_ip_key()
                    .build();

                App::new()
                    .wrap(
                        RateLimiter::builder(rate_limit_backend.clone(), input)
                            .add_headers()
                            .build(),
                    )
                    .wrap(if config.is_dev {
                        Cors::permissive()
                    } else {
                        Cors::default()
                            .allowed_origin(&(&config).web_server_url)
                            .allowed_methods(vec!["HEAD", "GET"])
                            .allowed_headers(vec![header::CONTENT_TYPE, header::ACCEPT])
                            .max_age(3600)
                    })
                    .wrap(Logger::new(
                        "%a %t \"%r\" %s %b \"%{Referer}i\" \"%{User-Agent}i\" %T",
                    ))
                    .app_data(web_config.clone())
                    .configure(routes::init_routes)
                    .service(fs::Files::new("/", "./static"))
                    .default_service(web::route().to(not_found))
            })
            .bind((host, port))?
            .run()
            .await
        }
        Err(error) => {
            eprintln!("Environment configuration error: {:#?}", error);
            Ok(())
        }
    }
}
