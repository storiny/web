use super::{
    favicon,
    oauth,
    robots,
};
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
    favicon::init_routes(cfg);
    robots::init_routes(cfg);
}

/// Registers oauth API routes.
///
/// * `cfg` - Web service config
pub fn init_oauth_routes(cfg: &mut web::ServiceConfig) {
    oauth::youtube::init_routes(cfg);
    oauth::youtube::callback::init_routes(cfg);
    //
    oauth::github::init_routes(cfg);
    oauth::github::callback::init_routes(cfg);
    //
    oauth::spotify::init_routes(cfg);
    oauth::spotify::callback::init_routes(cfg);
    //
    oauth::discord::init_routes(cfg);
    oauth::discord::callback::init_routes(cfg);
    //
    oauth::dribbble::init_routes(cfg);
    oauth::dribbble::callback::init_routes(cfg);
}

/// Registers v1 API routes.
///
/// * `cfg` - Web service config
pub fn init_v1_routes(cfg: &mut web::ServiceConfig) {
    // Auth
    v1::auth::login::init_routes(cfg);
    v1::auth::mfa_preflight::init_routes(cfg);
    v1::auth::signup::init_routes(cfg);
    v1::auth::reset_password::init_routes(cfg);
    v1::auth::recovery::init_routes(cfg);
    v1::auth::resend_verification_email::init_routes(cfg);
    v1::auth::external::google::init_routes(cfg);
    v1::auth::external::google::callback::init_routes(cfg);
    // Feed
    v1::feed::init_routes(cfg);
    // Me
    v1::me::get::init_routes(cfg);
    // Me - User activity
    v1::me::account_activity::init_routes(cfg);
    // Me - Assets
    v1::me::assets::get::init_routes(cfg);
    v1::me::assets::post::init_routes(cfg);
    v1::me::assets::delete::init_routes(cfg);
    v1::me::assets::alt::init_routes(cfg);
    v1::me::assets::favourite::init_routes(cfg);
    v1::me::assets::rating::init_routes(cfg);
    // Me - Blocked users
    v1::me::blocked_users::get::init_routes(cfg);
    v1::me::blocked_users::post::init_routes(cfg);
    v1::me::blocked_users::delete::init_routes(cfg);
    // Me - Bookmarks
    v1::me::bookmarks::get::init_routes(cfg);
    v1::me::bookmarks::post::init_routes(cfg);
    v1::me::bookmarks::delete::init_routes(cfg);
    // Me - Comments
    v1::me::comments::get::init_routes(cfg);
    v1::me::comments::post::init_routes(cfg);
    v1::me::comments::patch::init_routes(cfg);
    v1::me::comments::delete::init_routes(cfg);
    // Me - Replies
    v1::me::replies::get::init_routes(cfg);
    v1::me::replies::post::init_routes(cfg);
    v1::me::replies::patch::init_routes(cfg);
    v1::me::replies::delete::init_routes(cfg);
    // Me - Drafts
    v1::me::drafts::get::init_routes(cfg);
    v1::me::drafts::recover::init_routes(cfg);
    v1::me::drafts::delete::init_routes(cfg);
    // Me - Flow
    v1::me::flow::onboarding::tags::init_routes(cfg);
    v1::me::flow::onboarding::writers::init_routes(cfg);
    // Me - Followed tags
    v1::me::followed_tags::get::init_routes(cfg);
    v1::me::followed_tags::post::init_routes(cfg);
    v1::me::followed_tags::delete::init_routes(cfg);
    // Me - Followers
    v1::me::followers::get::init_routes(cfg);
    v1::me::followers::delete::init_routes(cfg);
    // Me - Following
    v1::me::following::get::init_routes(cfg);
    v1::me::following::post::init_routes(cfg);
    v1::me::following::delete::init_routes(cfg);
    // Me - Friend requests
    v1::me::friend_requests::get::init_routes(cfg);
    v1::me::friend_requests::post::init_routes(cfg);
    v1::me::friend_requests::delete::init_routes(cfg);
    v1::me::friend_requests::cancel::init_routes(cfg);
    // Me - Friends
    v1::me::friends::get::init_routes(cfg);
    v1::me::friends::post::init_routes(cfg);
    v1::me::friends::delete::init_routes(cfg);
    // Me - Gallery
    v1::me::gallery::get::init_routes(cfg);
    v1::me::gallery::post::init_routes(cfg);
    // Me - History
    v1::me::history::init_routes(cfg);
    // Me - Liked comments
    v1::me::liked_comments::post::init_routes(cfg);
    v1::me::liked_comments::delete::init_routes(cfg);
    // Me - Liked replies
    v1::me::liked_replies::post::init_routes(cfg);
    v1::me::liked_replies::delete::init_routes(cfg);
    // Me - Liked stories
    v1::me::liked_stories::get::init_routes(cfg);
    v1::me::liked_stories::post::init_routes(cfg);
    v1::me::liked_stories::delete::init_routes(cfg);
    // Me - Muted users
    v1::me::muted_users::get::init_routes(cfg);
    v1::me::muted_users::post::init_routes(cfg);
    v1::me::muted_users::delete::init_routes(cfg);
    // Me - Notifications
    v1::me::notifications::get::init_routes(cfg);
    v1::me::notifications::read::init_routes(cfg);
    v1::me::notifications::read_all::init_routes(cfg);
    // Me - Settings - Accounts
    v1::me::settings::accounts::remove::init_routes(cfg);
    v1::me::settings::accounts::add::google::init_routes(cfg);
    v1::me::settings::accounts::add::google::callback::init_routes(cfg);
    // Me - Settings - Avatar
    v1::me::settings::avatar::init_routes(cfg);
    // Me - Settings - Banner
    v1::me::settings::banner::init_routes(cfg);
    // Me - Settings - Connections
    v1::me::settings::connections::visibility::init_routes(cfg);
    v1::me::settings::connections::remove::init_routes(cfg);
    // Me - Settings - MFA
    v1::me::settings::mfa::generate_codes::init_routes(cfg);
    v1::me::settings::mfa::recovery_codes::init_routes(cfg);
    v1::me::settings::mfa::request::init_routes(cfg);
    v1::me::settings::mfa::verify::init_routes(cfg);
    v1::me::settings::mfa::remove::init_routes(cfg);
    // Me - Settings - Notifications
    v1::me::settings::notifications::mail::init_routes(cfg);
    v1::me::settings::notifications::site::init_routes(cfg);
    v1::me::settings::notifications::unsubscribe::init_routes(cfg);
    // Me - Settings - Email
    v1::me::settings::email::init_routes(cfg);
    // Me - Settings - Password
    v1::me::settings::password::add::init_routes(cfg);
    v1::me::settings::password::update::init_routes(cfg);
    v1::me::settings::password::request_verification::init_routes(cfg);
    // Me - Settings - Privacy
    v1::me::settings::privacy::delete_account::init_routes(cfg);
    v1::me::settings::privacy::disable_account::init_routes(cfg);
    v1::me::settings::privacy::following_list::init_routes(cfg);
    v1::me::settings::privacy::friend_list::init_routes(cfg);
    v1::me::settings::privacy::incoming_friend_requests::init_routes(cfg);
    v1::me::settings::privacy::private_account::init_routes(cfg);
    v1::me::settings::privacy::read_history::init_routes(cfg);
    v1::me::settings::privacy::sensitive_content::init_routes(cfg);
    // Me - Settings - Profile
    v1::me::settings::profile::init_routes(cfg);
    // Me - Settings - Sessions
    v1::me::settings::sessions::destroy::init_routes(cfg);
    v1::me::settings::sessions::logout::init_routes(cfg);
    v1::me::settings::sessions::acknowledge::init_routes(cfg);
    // Me - Settings - Username
    v1::me::settings::username::init_routes(cfg);
    // Me - Stats
    v1::me::stats::account::init_routes(cfg);
    v1::me::stats::stories::init_routes(cfg);
    // Me - Status
    v1::me::status::post::init_routes(cfg);
    v1::me::status::delete::init_routes(cfg);
    // Me - Stories
    v1::me::stories::get::init_routes(cfg);
    v1::me::stories::metadata::init_routes(cfg);
    v1::me::stories::publish::init_routes(cfg);
    v1::me::stories::recover::init_routes(cfg);
    v1::me::stories::unpublish::init_routes(cfg);
    v1::me::stories::delete::init_routes(cfg);
    v1::me::stories::stats::init_routes(cfg);
    // Me - Subscriptions
    v1::me::subscriptions::post::init_routes(cfg);
    v1::me::subscriptions::delete::init_routes(cfg);
    // Me - Unread notifications
    v1::me::unread_notifications::init_routes(cfg);
    // Public - Comments
    v1::public::comments::replies::init_routes(cfg);
    v1::public::comments::visibility::init_routes(cfg);
    // Public - Explore
    v1::public::explore::stories::init_routes(cfg);
    v1::public::explore::tags::init_routes(cfg);
    v1::public::explore::writers::init_routes(cfg);
    // Public - Preview
    v1::public::preview::init_routes(cfg);
    // Public - Replies
    v1::public::replies::visibility::init_routes(cfg);
    // Public - Reports
    v1::public::reports::init_routes(cfg);
    // Public - Stories
    v1::public::stories::read::init_routes(cfg);
    v1::public::stories::comments::init_routes(cfg);
    v1::public::stories::recommendations::init_routes(cfg);
    // Public - Tags
    v1::public::tags::init_routes(cfg);
    // Public - Validation - Username
    v1::public::validation::username::init_routes(cfg);
    // Right sidebar content
    v1::rsb_content::init_routes(cfg);
    // Tag
    v1::tag::stories::init_routes(cfg);
    v1::tag::writers::init_routes(cfg);
    // User
    v1::user::stories::init_routes(cfg);
    v1::user::followers::init_routes(cfg);
    v1::user::following::init_routes(cfg);
    v1::user::friends::init_routes(cfg);
}
