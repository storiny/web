use lazy_static::lazy_static;
use serde::{
    Deserialize,
    Serialize,
};
use std::{
    iter::Iterator,
    string::ToString,
};
use strum::{
    Display,
    IntoEnumIterator,
};
use strum_macros::{
    EnumCount as EnumCountMacro,
    EnumIter,
};

lazy_static! {
    pub static ref STORY_CATEGORY_VEC: Vec<String> = StoryCategory::iter()
        .map(|item| item.to_string())
        .collect::<Vec<_>>();
}

#[derive(Display, Debug, Serialize, Deserialize, Copy, Clone, EnumCountMacro, EnumIter)]
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
