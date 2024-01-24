use crate::{
    error::AppError,
    IndexTemplate,
};
use actix_web::{
    get,
    http::header::ContentType,
    web,
    HttpResponse,
};
use sailfish::TemplateOnce;
use tracing_actix_web::RequestId;

#[get("/")]
#[tracing::instrument(name = "GET /", skip_all, err)]
async fn get(id: RequestId) -> Result<HttpResponse, AppError> {
    IndexTemplate {
        req_id: id.to_string(),
    }
    .render_once()
    .map(|body| {
        HttpResponse::Ok()
            .content_type(ContentType::html())
            .body(body)
    })
    .map_err(|error| AppError::InternalError(error.to_string()))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}
