use actix_web::web;

#[path = "v1/auth.rs"]
mod auth;

#[path = "v1/me.rs"]
mod me;

/// Registers v1 API routes
///
/// * `cfg` - Web service config
pub fn init_routes(cfg: &mut web::ServiceConfig) {
    auth::login::init_routes(cfg);
    auth::signup::init_routes(cfg);
    me::sessions::destroy::init_routes(cfg);
    me::sessions::logout::init_routes(cfg)
}
