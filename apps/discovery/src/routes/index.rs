use actix_web::{
    get,
    web,
    HttpResponse,
    Responder,
};

#[get("/")]
async fn get() -> impl Responder {
    HttpResponse::Ok().body("Discovery — Media proxy service for Storiny")
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}
