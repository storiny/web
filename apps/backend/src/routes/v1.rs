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
    // User activity
    me::account_activity::init_routes(cfg);
    // Assets
    me::assets::assets_get::init_routes(cfg);
    me::assets::assets_post::init_routes(cfg);
    me::assets::assets_delete::init_routes(cfg);
    me::assets::assets_alt::init_routes(cfg);
    me::assets::assets_favourite::init_routes(cfg);
    me::assets::assets_rating::init_routes(cfg);
    // Blocked users
    me::blocked_users::blocked_users_get::init_routes(cfg);
    me::blocked_users::blocked_users_post::init_routes(cfg);
    me::blocked_users::blocked_users_delete::init_routes(cfg);
    // Bookmarks
    me::bookmarks::bookmarks_get::init_routes(cfg);
    me::bookmarks::bookmarks_post::init_routes(cfg);
    me::bookmarks::bookmarks_delete::init_routes(cfg);
    // Comments
    me::comments::comments_get::init_routes(cfg);
    me::comments::comments_post::init_routes(cfg);
    // History
    me::history::history::init_routes(cfg);
    // Muted users
    me::muted_users::muted_users_get::init_routes(cfg);
    me::muted_users::muted_users_post::init_routes(cfg);
    me::muted_users::muted_users_delete::init_routes(cfg);
    // Sessions
    me::sessions::destroy::init_routes(cfg);
    me::sessions::logout::init_routes(cfg)
}
