use crate::utils::{
    decompress_url,
    resolve_provider,
};
use actix_web::{
    get,
    http::header::ContentType,
    web,
    HttpResponse,
    Responder,
};

#[get("/provider_check/{compressed_url}")]
async fn get(compressed_url: web::Path<String>) -> impl Responder {
    let decompressed_url = decompress_url(&compressed_url.to_string());

    match decompressed_url {
        Some(result) => match result {
            Ok(url) => match resolve_provider(&url) {
                None => HttpResponse::UnprocessableEntity()
                    .content_type(ContentType::plaintext())
                    .body("Provider not supported yet"),
                Some(provider) => HttpResponse::Ok()
                    .content_type(ContentType::plaintext())
                    .body(format!("OK ({})", provider.name)),
            },
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
