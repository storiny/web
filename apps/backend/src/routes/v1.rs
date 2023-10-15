use actix_web::web;

#[path = "v1/auth.rs"]
mod auth;

/// Registers v1 API routes
///
/// * `cfg` - Web service config
pub fn init_routes(cfg: &mut web::ServiceConfig) {
    auth::auth_login::init_routes(cfg);
}
