use actix_web::web;

pub mod callback;
pub mod spotify;

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    spotify::init_routes(cfg);
    callback::init_routes(cfg);
}
