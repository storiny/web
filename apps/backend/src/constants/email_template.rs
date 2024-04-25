use serde::{
    Deserialize,
    Serialize,
};
use strum::Display;

/// The AWS SES template name.
#[derive(Display, Debug, Serialize, Deserialize, Copy, Clone)]
pub enum EmailTemplate {
    #[strum(serialize = "EmailVerification")]
    EmailVerification,
    #[strum(serialize = "NewEmailVerification")]
    NewEmailVerification,
    #[strum(serialize = "PasswordReset")]
    PasswordReset,
    #[strum(serialize = "PasswordAddVerification")]
    PasswordAddVerification,
    #[strum(serialize = "SubscriptionConfirmation")]
    SubscriptionConfirmation,
    #[strum(serialize = "BlogNewsletter")]
    BlogNewsletter,
}
