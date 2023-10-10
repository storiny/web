use serde::{
    Deserialize,
    Serialize,
};
use sqlx::FromRow;
use time::OffsetDateTime;

#[derive(Debug, FromRow, Deserialize, Serialize, Clone)]
pub struct Comment {
    pub id: i64,
    pub content: String,
    pub rendered_content: String,
    pub hidden: bool,
    pub story_id: i64,
    pub user_id: i64,
    // Stats
    pub like_count: i32,
    pub reply_count: i32,
    // Timestamps
    #[serde(with = "time::serde::iso8601")]
    pub created_at: OffsetDateTime,
    #[serde(with = "time::serde::iso8601::option")]
    pub edited_at: Option<OffsetDateTime>,
    #[serde(with = "time::serde::iso8601::option")]
    pub deleted_at: Option<OffsetDateTime>,
}
