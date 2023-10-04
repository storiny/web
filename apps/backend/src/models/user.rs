use serde::{
    Deserialize,
    Serialize,
};
use sqlx::{
    types::chrono::{
        DateTime,
        Utc,
    },
    FromRow,
};

#[derive(Debug, FromRow, Deserialize, Serialize, Clone)]
pub struct User {
    pub id: String,
    pub name: String,
    pub username: String,
    pub bio: String,
    pub rendered_bio: String,
    pub location: String,
    pub public_flags: u64,
    pub avatar_id: Option<String>,
    pub avatar_hex: Option<String>,
    pub banner_id: Option<String>,
    pub banner_hex: Option<String>,
    pub is_private: bool,
    pub wpm: u16,
    pub created_at: DateTime<Utc>,
}
