use actix_web::{
    get,
    http::header::ContentType,
    web,
    HttpResponse,
    Responder,
};

#[get("/embed/{compressed_url}")]
async fn get(compressed_url: web::Path<String>) -> impl Responder {
    let compressed_url = compressed_url.to_string();
    HttpResponse::Ok()
        .content_type(ContentType::plaintext())
        .body(format!("Compressed: {}", compressed_url))
}

/// Registers embed routes
///
/// * `cfg` - Web service config
pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}
