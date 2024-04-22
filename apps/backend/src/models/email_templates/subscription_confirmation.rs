use serde::Serialize;

/// The blog object.
#[derive(Debug, Serialize)]
pub struct Blog {
    /// The name of blog.
    pub name: String,
    /// The optional logo image URL for the blog.
    pub logo_url: Option<String>,
    /// The URL of the blog.
    pub url: String,
}

/// The data for subscription confirmation template.
#[derive(Debug, Serialize)]
pub struct SubscriptionConfirmationEmailTemplateData {
    /// The confirmation link for the user.
    pub link: String,
    /// The year of copyright.
    pub copyright_year: String,
    /// The blog object.
    pub blog: Blog,
}
