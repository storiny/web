use serde::Serialize;

/// The blog in which this story was published.
#[derive(Debug, Serialize)]
pub struct Blog {
    /// The name of blog.
    pub name: String,
    /// The optional logo image URL for the blog.
    pub logo_url: Option<String>,
    /// The URL of the blog.
    pub url: String,
}

/// The writer of the story.
#[derive(Debug, Serialize)]
pub struct User {
    /// The name of user.
    pub name: String,
    /// The optional avatar image URL for the user.
    pub avatar_url: Option<String>,
    /// The URL of the user.
    pub url: String,
}

/// The story object for the newsletter.
#[derive(Debug, Serialize)]
pub struct Story {
    /// The title of story.
    pub title: String,
    /// The optional description of story.
    pub description: Option<String>,
    /// The optional splash image URL for the story.
    pub splash_url: Option<String>,
    /// The date on which the story was published.
    ///
    /// Format: DD MMM, YYYY
    pub published_date: String,
    /// The read time of the story in minutes.
    pub read_time: String,
    /// The URL of the story.
    pub url: String,
    /// The writer of the story.
    pub user: User,
    /// The blog in which this story was published.
    pub blog: Blog,
}

/// The data for blog newsletter template.
#[derive(Debug, Serialize)]
pub struct BlogNewsletterEmailTemplateData {
    /// The e-mail address of the user.
    pub email: String,
    /// The link to unsubscribe this user from mailing list.
    pub unsubscribe_link: String,
    /// The year of copyright.
    pub copyright_year: String,
    /// The story object.
    pub story: Story,
}
