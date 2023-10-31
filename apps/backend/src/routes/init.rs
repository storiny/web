use actix_web::web;

#[path = "health.rs"]
mod health;

#[path = "index.rs"]
mod index;

#[path = "v1/mod.rs"]
mod v1;

/// Registers common API routes.
///
/// * `cfg` - Web service config
pub fn init_common_routes(cfg: &mut web::ServiceConfig) {
    index::init_routes(cfg);
    health::init_routes(cfg);
}

/// Registers v1 API routes.
///
/// * `cfg` - Web service config
pub fn init_v1_routes(cfg: &mut web::ServiceConfig) {
    // Auth
    v1::auth::login::init_routes(cfg);
    v1::auth::signup::init_routes(cfg);
    v1::auth::reset_password::init_routes(cfg);
    v1::auth::recovery::init_routes(cfg);
    // Feed
    v1::feed::feed::init_routes(cfg);
    // User activity
    v1::me::account_activity::init_routes(cfg);
    // Assets
    v1::me::assets::get::init_routes(cfg);
    v1::me::assets::post::init_routes(cfg);
    v1::me::assets::delete::init_routes(cfg);
    v1::me::assets::alt::init_routes(cfg);
    v1::me::assets::favourite::init_routes(cfg);
    v1::me::assets::rating::init_routes(cfg);
    // Blocked users
    v1::me::blocked_users::get::init_routes(cfg);
    v1::me::blocked_users::post::init_routes(cfg);
    v1::me::blocked_users::delete::init_routes(cfg);
    // Bookmarks
    v1::me::bookmarks::get::init_routes(cfg);
    v1::me::bookmarks::post::init_routes(cfg);
    v1::me::bookmarks::delete::init_routes(cfg);
    // Comments
    v1::me::comments::get::init_routes(cfg);
    v1::me::comments::post::init_routes(cfg);
    v1::me::comments::patch::init_routes(cfg);
    v1::me::comments::delete::init_routes(cfg);
    // Replies
    v1::me::replies::get::init_routes(cfg);
    v1::me::replies::post::init_routes(cfg);
    v1::me::replies::patch::init_routes(cfg);
    v1::me::replies::delete::init_routes(cfg);
    // Drafts
    v1::me::drafts::get::init_routes(cfg);
    v1::me::drafts::recover::init_routes(cfg);
    v1::me::drafts::delete::init_routes(cfg);
    // Flow
    v1::me::flow::onboarding::tags::init_routes(cfg);
    v1::me::flow::onboarding::writers::init_routes(cfg);
    // Followed tags
    v1::me::followed_tags::get::init_routes(cfg);
    v1::me::followed_tags::post::init_routes(cfg);
    v1::me::followed_tags::delete::init_routes(cfg);
    // Followers
    v1::me::followers::get::init_routes(cfg);
    v1::me::followers::delete::init_routes(cfg);
    // Following
    v1::me::following::get::init_routes(cfg);
    v1::me::following::post::init_routes(cfg);
    v1::me::following::delete::init_routes(cfg);
    // Friend requests
    v1::me::friend_requests::get::init_routes(cfg);
    v1::me::friend_requests::post::init_routes(cfg);
    v1::me::friend_requests::delete::init_routes(cfg);
    // Friends
    v1::me::friends::get::init_routes(cfg);
    v1::me::friends::post::init_routes(cfg);
    v1::me::friends::delete::init_routes(cfg);
    // Gallery
    v1::me::gallery::get::init_routes(cfg);
    v1::me::gallery::post::init_routes(cfg);
    // History
    v1::me::history::history::init_routes(cfg);
    // Liked comments
    v1::me::liked_comments::post::init_routes(cfg);
    v1::me::liked_comments::delete::init_routes(cfg);
    // Liked replies
    v1::me::liked_replies::post::init_routes(cfg);
    v1::me::liked_replies::delete::init_routes(cfg);
    // Liked stories
    v1::me::liked_stories::get::init_routes(cfg);
    v1::me::liked_stories::post::init_routes(cfg);
    v1::me::liked_stories::delete::init_routes(cfg);
    // Muted users
    v1::me::muted_users::get::init_routes(cfg);
    v1::me::muted_users::post::init_routes(cfg);
    v1::me::muted_users::delete::init_routes(cfg);
    // Notifications
    v1::me::notifications::get::init_routes(cfg);
    v1::me::notifications::read::init_routes(cfg);
    // Sessions
    v1::me::sessions::destroy::init_routes(cfg);
    v1::me::sessions::logout::init_routes(cfg)
}
