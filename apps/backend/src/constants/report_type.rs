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
    pub static ref REPORT_TYPE_VEC: Vec<String> = ReportType::iter()
        .map(|item| item.to_string())
        .collect::<Vec<_>>();
}

#[derive(Display, Debug, Serialize, Deserialize, Copy, Clone, EnumCountMacro, EnumIter)]
pub enum ReportType {
    #[strum(serialize = "spam")]
    Spam,
    #[strum(serialize = "nudity")]
    Nudity,
    #[strum(serialize = "hate_speech_discrimination")]
    HateSpeechDiscrimination,
    #[strum(serialize = "harassment_bullying")]
    HarassmentBullying,
    #[strum(serialize = "violence_threats")]
    ViolenceThreats,
    #[strum(serialize = "selfharm_suicide")]
    SelfharmSuicide,
    #[strum(serialize = "misinformation")]
    Misinformation,
    #[strum(serialize = "copyright_infringement")]
    CopyrightInfringement,
    #[strum(serialize = "impersonation")]
    Impersonation,
    #[strum(serialize = "privacy_violation")]
    PrivacyViolation,
    #[strum(serialize = "other")]
    Other,
}
