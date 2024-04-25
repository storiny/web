use serde::Serialize;

/// The data for new email verification template.
#[derive(Debug, Serialize)]
pub struct NewEmailVerificationEmailTemplateData {
    /// The e-mail verification link for the user.
    pub link: String,
    /// The year of copyright.
    pub copyright_year: String,
}
