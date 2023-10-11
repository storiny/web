use crate::privacy_settings_def::v1::IncomingFriendRequest;
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::FromRow;
use time::OffsetDateTime;

#[derive(Debug, Serialize, Deserialize, Copy, Clone)]
pub enum FollowingListVisibility {
    Everyone,
    Friends,
    None,
}

#[derive(Debug, Serialize, Deserialize, Copy, Clone)]
pub enum FriendListVisibility {
    Everyone,
    Friends,
    None,
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
    pub incoming_friend_requests: IncomingFriendRequest,
    pub following_list_visibility: FollowingListVisibility,
    pub friend_list_visibility: FriendListVisibility,
    pub disable_read_history: bool,
    // Third-party login credentials
    pub login_apple_id: Option<String>,
    pub login_google_id: Option<String>,
    // Multi-factor auth
    pub mfa_enabled: bool,
    pub mfa_secret: Option<String>,
    #[serde(with = "time::serde::iso8601")]
    pub created_at: OffsetDateTime,
    #[serde(with = "time::serde::iso8601::option")]
    pub username_modified_at: Option<OffsetDateTime>,
    #[serde(with = "time::serde::iso8601::option")]
    pub deleted_at: Option<OffsetDateTime>,
}
