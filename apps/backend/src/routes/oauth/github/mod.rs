use actix_web::web;

pub mod callback;
pub mod github;

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    github::init_routes(cfg);
    callback::init_routes(cfg);
}
