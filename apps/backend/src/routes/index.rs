use crate::IndexTemplate;
use actix_web::{
    get,
    http::header::ContentType,
    web,
    HttpResponse,
    Responder,
};
use sailfish::TemplateOnce;
use tracing_actix_web::RequestId;

#[get("/")]
async fn get(id: RequestId) -> impl Responder {
    HttpResponse::Ok().content_type(ContentType::html()).body(
        IndexTemplate {
            req_id: id.to_string(),
        }
        .render_once()
        .unwrap(),
    )
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}
