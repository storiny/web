use lazy_static::lazy_static;
use regex::Regex;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use time::OffsetDateTime;

lazy_static! {
    pub static ref USERNAME_REGEX: Regex = Regex::new(r"^[\w_]+$").unwrap();
}

#[derive(Debug, sqlx::Type, Serialize, Deserialize, Copy, Clone)]
pub enum UserFlag {
    Staff = 1,
    TemporarilySuspended = 2,
    PermanentlySuspended = 4,
    Verified = 8,
    EarlyUser = 16,
}

#[derive(Debug, FromRow, Deserialize, Serialize, Clone)]
pub struct User {
    pub id: i64,
    pub name: String,
    pub username: String,
    pub avatar_id: Option<String>,
    pub avatar_hex: Option<String>,
    pub banner_id: Option<String>,
    pub banner_hex: Option<String>,
    pub bio: String,
    pub rendered_bio: String,
    pub location: String,
    pub email: String,
    pub email_verified: bool,
    pub password: Option<String>,
    pub is_private: bool,
    pub public_flags: i32,
    pub wpm: i16,
    // Stats
    pub follower_count: i32,
    pub following_count: i32,
    pub friend_count: i32,
    pub story_count: i32,
    // Privacy settings
    pub incoming_friend_requests: i16,
    pub following_list_visibility: i16,
    pub friend_list_visibility: i16,
    pub disable_read_history: bool,
    // Third-party login credentials
    pub login_apple_id: Option<String>,
    pub login_google_id: Option<String>,
    // Multi-factor auth
    pub mfa_enabled: bool,
    pub mfa_secret: Option<String>,
    #[serde(with = "crate::iso8601::time")]
    pub created_at: OffsetDateTime,
    #[serde(with = "crate::iso8601::time::option")]
    pub username_modified_at: Option<OffsetDateTime>,
    #[serde(with = "crate::iso8601::time::option")]
    pub deleted_at: Option<OffsetDateTime>,
    #[serde(with = "crate::iso8601::time::option")]
    pub deactivated_at: Option<OffsetDateTime>,
}
