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
    Ok(HttpResponse::Ok().content_type(ContentType::html()).body(
        IndexTemplate {
            req_id: id.to_string(),
        }
        .render_once()
        .unwrap(),
    ))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}
