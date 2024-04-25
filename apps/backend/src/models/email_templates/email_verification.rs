use serde::Serialize;

/// The data for email verification template.
#[derive(Debug, Serialize)]
pub struct EmailVerificationEmailTemplateData {
    /// The display name of the user.
    pub name: String,
    /// The e-mail address of the user.
    pub email: String,
    /// The e-mail verification link for the user.
    pub link: String,
    /// The year of copyright.
    pub copyright_year: String,
}
