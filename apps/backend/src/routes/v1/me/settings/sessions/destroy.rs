use actix_session::Session;
use actix_web::{post, web, HttpResponse, Responder};

// TODO: Write tests

#[post("/v1/me/sessions/destroy")]
async fn post(session: Session) -> impl Responder {
    session.purge();
    // TODO: Destroy all sessions
    HttpResponse::Ok().finish()
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}
