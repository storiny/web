use crate::IndexTemplate;
use actix_web::{
    get,
    http::header::ContentType,
    web,
    HttpResponse,
    Responder,
};
use sailfish::TemplateOnce;

#[get("/")]
async fn get() -> impl Responder {
    HttpResponse::Ok().content_type(ContentType::html()).body(
        IndexTemplate {
            text: "API server".to_string(),
        }
        .render_once()
        .unwrap(),
    )
}

/// Registers index routes
///
/// * `cfg` - Web service config
pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}
