use serde::Serialize;

/// The data for add-password verification email template.
#[derive(Debug, Serialize)]
pub struct PasswordAddVerificationEmailTemplateData {
    /// The verification code for the request.
    pub verification_code: String,
    /// The year of copyright.
    pub copyright_year: String,
}
