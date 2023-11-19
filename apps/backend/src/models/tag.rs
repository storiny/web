use lazy_static::lazy_static;
use regex::Regex;
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::FromRow;
use time::OffsetDateTime;

lazy_static! {
    pub static ref TAG_REGEX: Regex = Regex::new(r"^[a-z0-9-]{1,32}$").unwrap();
}

#[derive(Debug, FromRow, Deserialize, Serialize, Clone)]
pub struct Tag {
    pub id: i64,
    pub name: String,
    pub follower_count: i32,
    pub story_count: i32,
    #[serde(with = "crate::iso8601::time")]
    pub created_at: OffsetDateTime,
}
