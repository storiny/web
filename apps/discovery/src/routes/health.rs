use actix_web::{
    get,
    http::header::ContentType,
    web,
    HttpResponse,
    Responder,
};

#[get("/health")]
async fn get() -> impl Responder {
    HttpResponse::Ok()
        .content_type(ContentType::plaintext())
        .body("OK")
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}
