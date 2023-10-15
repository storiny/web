use actix_web::web;

#[path = "routes/health.rs"]
mod health;

#[path = "routes/index.rs"]
mod index;

#[path = "routes/v1.rs"]
mod v1;

/// Registers all the routes
///
/// * `cfg` - Web service config
pub fn init_routes(cfg: &mut web::ServiceConfig) {
    index::init_routes(cfg);
    health::init_routes(cfg);
    v1::init_routes(cfg);
}
