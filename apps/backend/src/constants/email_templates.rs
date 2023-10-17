use serde::{
    Deserialize,
    Serialize,
};
use strum::Display;

/// AWS SES template name
#[derive(Display, Debug, Serialize, Deserialize)]
pub enum EmailTemplate {
    #[strum(serialize = "EmailVerification")]
    EmailVerification,
    #[strum(serialize = "PasswordReset")]
    PasswordReset,
}
