use actix_cors::Cors;
use actix_governor::{
    Governor,
    GovernorConfigBuilder,
};
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
use std::{
    env,
    io,
    net::IpAddr,
    str::FromStr,
};

mod error;
mod middleware;
mod providers;
mod routes;

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
    log::info!("starting HTTP server at http://localhost:8080");

    let reverse_proxy_ip =
        IpAddr::from_str(&env::var("REVERSE_PROXY_IP").expect("Reverse proxy IP not set")).unwrap(); //
    let host = env::var("HOST").expect("Host not set");
    let port: u16 = (env::var("PORT").expect("Port not set")).parse().unwrap();
    let allowed_origin = env::var("ALLOWED_ORIGIN").expect("Allowed origin not set");

    // TODO: Initialize store
    // Allow bursts with up to five requests per IP address
    // and replenishes one element every two seconds
    let governor_conf = GovernorConfigBuilder::default()
        .per_second(3)
        .burst_size(30)
        .key_extractor(middleware::rate_limiter::RealIpKeyExtractor)
        .use_headers()
        .finish()
        .unwrap();

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(reverse_proxy_ip))
            .wrap(Governor::new(&governor_conf))
            .wrap(
                Cors::default()
                    .allowed_origin(&allowed_origin)
                    .allowed_methods(vec!["HEAD", "GET"])
                    .allowed_headers(vec![header::CONTENT_TYPE, header::ACCEPT])
                    .max_age(3600),
            )
            .wrap(Logger::new(
                "%a %t \"%r\" %s %b \"%{Referer}i\" \"%{User-Agent}i\" %T",
            ))
            .configure(routes::init_routes)
            .default_service(web::route().to(not_found))
    })
    .bind((host, port))?
    .run()
    .await
}
