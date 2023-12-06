use crate::{
    error::AppError,
    utils::{
        decompress_url::decompress_url,
        resolve_provider::resolve_provider,
    },
};
use actix_web::{
    get,
    web,
    HttpResponse,
};

// TODO: Write tests

#[get("/provider_check/{compressed_url}")]
#[tracing::instrument(
    name = "GET /provider_check/{compressed_url}",
    skip_all,
    fields(
        compressed_url,
        decompressed_url = tracing::field::Empty,
        resolved_provider = tracing::field::Empty
    ),
    err
)]
async fn get(compressed_url: web::Path<String>) -> Result<HttpResponse, AppError> {
    let decompressed_url = decompress_url(&compressed_url.to_string())
        .ok_or(AppError::from("Invalid provider URL"))?;

    tracing::Span::current().record("decompressed_url", &decompressed_url);

    let provider =
        resolve_provider(&decompressed_url).ok_or(AppError::from("Provider not supported yet"))?;
    let provider_name = provider.name;

    tracing::Span::current().record("resolved_provider", provider_name);

    Ok(HttpResponse::Ok().body(format!("OK ({provider_name})")))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}
