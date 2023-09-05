use std::io;

use actix_cors::Cors;
use actix_web::{get, HttpResponse, Responder, http::header, middleware::Logger, App, HttpServer};

#[get("/")]
async fn hello() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

#[actix_web::main]
async fn main() -> io::Result<()> {
//    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    log::info!("starting HTTP server at http://localhost:8080");

    HttpServer::new(move || {
        App::new()
            .wrap(
                Cors::default()
                    .allowed_origin("http://localhost:8081")
                    .allowed_methods(vec!["GET"])
                    .allowed_headers(vec![header::CONTENT_TYPE, header::ACCEPT])
                    .max_age(3600),
            )
            .wrap(Logger::default())
            .service(hello)
    })
        .bind(("127.0.0.1", 8080))?
        .workers(2)
        .run()
        .await
}