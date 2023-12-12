use serde::Serialize;

/// The data for reset password email template.
#[derive(Debug, Serialize)]
pub struct ResetPasswordEmailTemplateData {
    /// The password reset link for the user.
    pub link: String,
}
