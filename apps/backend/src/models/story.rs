use crate::story_def::v1::{
    StoryAgeRestriction,
    StoryLicense,
    StoryVisibility,
};
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::FromRow;
use strum::Display;
use time::OffsetDateTime;

#[derive(Display, Debug, Serialize, Deserialize, Copy, Clone)]
pub enum StoryCategory {
    #[strum(serialize = "business-and-finance")]
    BusinessAndFinance,
    #[strum(serialize = "digital-graphics")]
    DigitalGraphics,
    #[strum(serialize = "diy")]
    DIY,
    #[strum(serialize = "entertainment")]
    Entertainment,
    #[strum(serialize = "gaming")]
    Gaming,
    #[strum(serialize = "health-and-wellness")]
    HealthAndWellness,
    #[strum(serialize = "learning")]
    Learning,
    #[strum(serialize = "lifestyle")]
    Lifestyle,
    #[strum(serialize = "music")]
    Music,
    #[strum(serialize = "news")]
    News,
    #[strum(serialize = "others")]
    Others,
    #[strum(serialize = "programming")]
    Programming,
    #[strum(serialize = "science-and-technology")]
    ScienceAndTechnology,
    #[strum(serialize = "sports")]
    Sports,
    #[strum(serialize = "travel")]
    Travel,
}

#[derive(Debug, FromRow, Deserialize, Serialize, Clone)]
pub struct Story {
    pub id: i64,
    pub title: String,
    pub slug: Option<String>,
    pub description: Option<String>,
    pub splash_id: Option<String>,
    pub splash_hex: Option<String>,
    pub doc_key: String,
    pub category: StoryCategory,
    pub license: StoryLicense,
    pub visibility: StoryVisibility,
    pub age_restriction: StoryAgeRestriction,
    pub user_id: i64,
    // SEO
    pub seo_title: Option<String>,
    pub seo_description: Option<String>,
    pub canonical_url: Option<String>,
    pub preview_image: Option<String>,
    // Stats
    pub word_count: i32,
    pub read_count: i64,
    pub like_count: i64,
    pub comment_count: i32,
    // Settings
    pub disable_public_revision_history: bool,
    pub disable_comments: bool,
    pub disable_toc: bool,
    // Timestamps
    #[serde(with = "time::serde::iso8601")]
    pub created_at: OffsetDateTime,
    #[serde(with = "time::serde::iso8601::option")]
    pub first_published_at: Option<OffsetDateTime>,
    #[serde(with = "time::serde::iso8601::option")]
    pub published_at: Option<OffsetDateTime>,
    #[serde(with = "time::serde::iso8601::option")]
    pub edited_at: Option<OffsetDateTime>,
    #[serde(with = "time::serde::iso8601::option")]
    pub deleted_at: Option<OffsetDateTime>,
}
