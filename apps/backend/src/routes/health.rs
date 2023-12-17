use crate::error::AppError;
use actix_web::{
    get,
    http::header::ContentType,
    web,
    HttpResponse,
};

#[get("/health")]
#[tracing::instrument(name = "GET /health", skip_all, err)]
async fn get() -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok()
        .content_type(ContentType::plaintext())
        .body("OK"))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}
