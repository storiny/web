use crate::utils::{
    decompress_url::decompress_url,
    resolve_provider::resolve_provider,
};
use actix_web::{
    get,
    web,
    HttpResponse,
    Responder,
};

#[get("/provider_check/{compressed_url}")]
async fn get(compressed_url: web::Path<String>) -> impl Responder {
    match decompress_url(&compressed_url.to_string()) {
        Some(result) => match result {
            Ok(url) => match resolve_provider(&url) {
                Some(provider) => HttpResponse::Ok().body(format!("OK ({})", provider.name)),
                None => HttpResponse::UnprocessableEntity().body("Provider not supported yet"),
            },
            Err(_) => HttpResponse::InternalServerError().body("Could not resolve the provider"),
        },
        None => HttpResponse::UnprocessableEntity().body("Provider not supported yet"),
    }
}

/// Registers provider check routes
///
/// * `cfg` - Web service config
pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}
