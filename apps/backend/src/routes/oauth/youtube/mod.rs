use actix_web::web;
use serde::Deserialize;
use validator::Validate;

pub mod callback;
pub mod youtube;

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    youtube::init_routes(cfg);
    callback::init_routes(cfg);
}
