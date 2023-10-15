use serde::{
    Deserialize,
    Serialize,
};
use strum::Display;

/// User token type.
#[derive(Display, Debug, Serialize, Deserialize, Copy, Clone)]
pub enum TokenType {
    #[strum(serialize = "email_verify")]
    EmailVerify,
    #[strum(serialize = "pwd_reset")]
    PasswordReset,
}
