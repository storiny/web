use actix_web::web;

#[path = "embed/mod.rs"]
mod embed;
#[path = "health/mod.rs"]
mod health;
#[path = "index/mod.rs"]
mod index;
#[path = "provider_check/mod.rs"]
mod provider_check;

/// Registers all the routes
///
/// * `cfg` - Web service config
pub fn init_routes(cfg: &mut web::ServiceConfig) {
    index::init_routes(cfg);
    embed::init_routes(cfg);
    health::init_routes(cfg);
    provider_check::init_routes(cfg);
}
