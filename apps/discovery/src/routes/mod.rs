use actix_web::web;

mod embed;
mod health;
mod index;
mod provider_check;

/// Registers common API routes.
///
/// * `cfg` - Web service config
pub fn init_common_routes(cfg: &mut web::ServiceConfig) {
    index::init_routes(cfg);
    health::init_routes(cfg);
}

/// Registers API routes.
///
/// * `cfg` - Web service config
pub fn init_routes(cfg: &mut web::ServiceConfig) {
    index::init_routes(cfg);
    embed::init_routes(cfg);
    health::init_routes(cfg);
    provider_check::init_routes(cfg);
}
