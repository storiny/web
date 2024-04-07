use actix_web::web;

mod embed;
mod favicon;
mod health;
mod index;
mod provider_check;
mod robots;

/// Registers API routes.
///
/// * `cfg` - Web service config
pub fn init_routes(cfg: &mut web::ServiceConfig) {
    index::init_routes(cfg);
    embed::init_routes(cfg);
    health::init_routes(cfg);
    favicon::init_routes(cfg);
    robots::init_routes(cfg);
    provider_check::init_routes(cfg);
}
