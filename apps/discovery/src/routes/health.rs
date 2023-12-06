use actix_web::{
    get,
    web,
    HttpResponse,
    Responder,
};

#[get("/health")]
async fn get() -> impl Responder {
    HttpResponse::Ok().body("OK")
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}
