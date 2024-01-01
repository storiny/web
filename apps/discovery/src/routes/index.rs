use crate::error::AppError;
use actix_web::{
    get,
    web,
    HttpResponse,
};

#[get("/")]
#[tracing::instrument(name = "GET /", skip_all, err)]
async fn get() -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().body("Discovery - Media proxy service for Storiny"))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}
