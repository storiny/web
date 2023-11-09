use actix_web::web;

pub mod callback;
pub mod discord;

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    discord::init_routes(cfg);
    callback::init_routes(cfg);
}
