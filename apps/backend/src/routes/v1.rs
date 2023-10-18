use actix_web::web;

#[path = "v1/auth.rs"]
mod auth;

#[path = "v1/me.rs"]
mod me;

#[path = "v1/feed.rs"]
mod feed;

/// Registers v1 API routes.
///
/// * `cfg` - Web service config
pub fn init_routes(cfg: &mut web::ServiceConfig) {
    // Auth
    auth::login::init_routes(cfg);
    auth::signup::init_routes(cfg);
    auth::reset_password::init_routes(cfg);
    auth::recovery::init_routes(cfg);
    // Feed
    feed::feed::init_routes(cfg);
    // User settings
    me::sessions::destroy::init_routes(cfg);
    me::sessions::logout::init_routes(cfg)
}
