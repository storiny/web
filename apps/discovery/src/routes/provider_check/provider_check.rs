use actix_web::{
    get,
    http::header::ContentType,
    web,
    HttpResponse,
    Responder,
};
use lz_str::decompress_from_encoded_uri_component;

#[path = "../../providers/mod.rs"]
mod providers;

#[get("/provider_check/{compressed_url}")]
async fn get(compressed_url: web::Path<String>) -> impl Responder {
    let decompressed_url = decompress_from_encoded_uri_component(&compressed_url.to_string());

    match decompressed_url {
        Some(decompressed_url) => match String::from_utf16(&decompressed_url) {
            Ok(url) => HttpResponse::Ok()
                .content_type(ContentType::plaintext())
                .body(format!("URL: {}", url)),
            Err(_) => HttpResponse::InternalServerError()
                .content_type(ContentType::plaintext())
                .body("Could not resolve the provider"),
        },
        None => HttpResponse::UnprocessableEntity()
            .content_type(ContentType::plaintext())
            .body("Provider not supported yet"),
    }
}

/// Registers provider check routes
///
/// * `cfg` - Web service config
pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}
