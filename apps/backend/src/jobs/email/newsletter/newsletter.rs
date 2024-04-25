#[cfg(not(test))]
use crate::constants::email_template::EmailTemplate;
use crate::{
    constants::image_size::ImageSize,
    jobs::init::SharedJobState,
    models::email_templates::blog_newsletter::{
        Blog,
        BlogNewsletterEmailTemplateData,
        Story,
        User,
    },
    utils::{
        encode_unsubscribe_fragment::encode_unsubscribe_fragment,
        get_blog_url::get_blog_url,
        get_cdn_url::get_cdn_url,
        get_read_time::get_read_time,
    },
    SesClient,
};
use apalis::prelude::*;
use aws_sdk_sesv2::types::MessageHeader;
#[cfg(not(test))]
use aws_sdk_sesv2::types::{
    Destination,
    EmailContent,
    Template,
};
use chrono::{
    Datelike,
    Local,
};
use futures_util::TryStreamExt;
use lazy_static::lazy_static;
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::Row;
use std::{
    ops::Deref,
    sync::Arc,
};
use time::{
    format_description::FormatItem,
    OffsetDateTime,
};
use tracing::{
    debug,
    warn,
};
use uuid::Uuid;

lazy_static! {
    #[allow(clippy::expect_used)]
    static ref UNSUBSCRIBE_HEADER: MessageHeader = MessageHeader::builder()
        .name("List-Unsubscribe-Post")
        .value("List-Unsubscribe=One-Click")
        .build()
        .expect("unable to build the unsubscribe header");
    //
    #[allow(clippy::expect_used)]
    static ref DATE_FORMAT: Vec<FormatItem<'static>> =
        time::format_description::parse("[day] [month repr:short], [year]")
            .expect("unable to parse the date format");
}

pub const NEWSLETTER_JOB_NAME: &str = "j:n:nws";

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct NewsletterJob {
    /// The ID of the published story.
    pub story_id: i64,
}

impl Job for NewsletterJob {
    const NAME: &'static str = NEWSLETTER_JOB_NAME;
}

/// Sends an email to all the subscribers of the blog's newsletter announcing that the story has
/// been published.
#[tracing::instrument(
    name = "JOB send_newsletter",
    skip_all,
    fields(
        story_id = job.story_id
    ),
    err
)]
pub async fn send_newsletter(
    job: NewsletterJob,
    state: Data<Arc<SharedJobState>>,
) -> Result<i32, Error> {
    let story_id = job.story_id;

    debug!("attempting to send newsletter (`{story_id}`)");

    let result = match sqlx::query(
        r#"
SELECT
    -- Story
    s.title,
    s.slug,
    s.description,
    s.splash_id,
    s.word_count,
    -- User
    u.name      AS "user_name",
    u.username  AS "user_username",
    u.avatar_id AS "user_avatar_id",
    -- Blog
    b.id      AS "blog_id",
    b.name    AS "blog_name",
    b.slug    AS "blog_slug",
    b.domain  AS "blog_domain",
    b.logo_id AS "blog_logo_id",
    -- Timestamps
    bs.accepted_at AS "published_at"
FROM blog_stories AS bs
    -- Join blog
    INNER JOIN blogs AS b
        ON b.id = bs.blog_id
        AND b.deleted_at IS NULL
        AND b.user_id IS NOT NULL
    -- Join story
    INNER JOIN stories AS s
        ON s.id = bs.story_id
        AND s.published_at IS NOT NULL
    -- Join story writer
    INNER JOIN users AS u
        ON u.id = s.user_id
        AND u.deleted_at IS NULL
        AND u.deactivated_at IS NULL
WHERE
    bs.story_id = $1
    AND bs.deleted_at IS NULL
    AND bs.accepted_at IS NOT NULL
"#,
    )
    .bind(story_id)
    // It is not necessary to include this in the transaction.
    .fetch_one(&state.db_pool)
    .await
    {
        Ok(result) => result,
        Err(error) => {
            // The blog-story relation has been deleted since the story was published.
            return if matches!(error, sqlx::Error::RowNotFound) {
                warn!("relevant row not found, skipping job");
                Ok(0)
            } else {
                Err(Error::Failed(Box::new(error)))
            };
        }
    };

    let blog_url = get_blog_url(
        result.get::<String, _>("blog_slug"),
        result.get::<Option<String>, _>("blog_domain"),
    );

    let from = format!(
        "{} <{}@newsletters.storiny.com>",
        result.get::<String, _>("blog_name"),
        result.get::<String, _>("blog_slug")
    );

    // The `unsubscribe_link` and `email` are explicitly set for each subscriber.
    let mut template_data = BlogNewsletterEmailTemplateData {
        unsubscribe_link: "".to_string(),
        email: "".to_string(),
        story: Story {
            title: result.get::<String, _>("title"),
            description: result.get::<Option<String>, _>("description"),
            splash_url: result.get::<Option<Uuid>, _>("splash_id").map(|value| {
                get_cdn_url(
                    &state.config.cdn_server_url,
                    value.to_string().as_str(),
                    Some(ImageSize::W960),
                )
            }),
            published_date: result
                .get::<OffsetDateTime, _>("published_at")
                .format(DATE_FORMAT.deref())
                .unwrap_or_default(),
            read_time: format!(
                "{} min read",
                get_read_time(result.get::<i32, _>("word_count") as u32, None)
            ),
            url: format!(
                "{blog_url}/{}?source=newsletter",
                result.get::<String, _>("slug")
            ),
            user: User {
                name: result.get::<String, _>("user_name"),
                avatar_url: result
                    .get::<Option<Uuid>, _>("user_avatar_id")
                    .map(|value| {
                        get_cdn_url(
                            &state.config.cdn_server_url,
                            value.to_string().as_str(),
                            Some(ImageSize::W64),
                        )
                    }),
                url: format!(
                    "{}/{}?source=newsletter",
                    &state.config.web_server_url,
                    result.get::<String, _>("user_username")
                ),
            },
            blog: Blog {
                name: result.get::<String, _>("blog_name"),
                logo_url: result.get::<Option<Uuid>, _>("blog_logo_id").map(|value| {
                    get_cdn_url(
                        &state.config.cdn_server_url,
                        value.to_string().as_str(),
                        Some(ImageSize::W64),
                    )
                }),
                url: format!("{}?source=newsletter", blog_url),
            },
        },
        copyright_year: Local::now().year().to_string(),
    };

    let mut sent_count = 0;

    let mut subscriber_stream = sqlx::query(
        r#"
SELECT email
FROM subscribers
WHERE blog_id = $1
"#,
    )
    .bind(result.get::<i64, _>("blog_id"))
    .fetch(&state.db_pool);

    while let Some(subscriber) = subscriber_stream
        .try_next()
        .await
        .map_err(Box::new)
        .map_err(|err| Error::Failed(err))?
    {
        let target = subscriber.get::<String, _>("email");

        match encode_unsubscribe_fragment(
            &state.config.newsletter_secret,
            result.get::<i64, _>("blog_id").to_string(),
            &target,
        ) {
            Ok(fragment) => {
                let unsubscribe_link = format!(
                    "{}/v1/newsletters/unsubscribe/{fragment}",
                    &state.config.api_server_url
                );

                template_data.email = target.clone();
                template_data.unsubscribe_link = unsubscribe_link.clone();

                let template_data = serde_json::to_string(&template_data).map_err(|error| {
                    Error::Failed(Box::from(format!(
                        "unable to serialize the template data: {error:?}"
                    )))
                })?;

                send_email(
                    &state.ses_client,
                    &from,
                    &target,
                    template_data,
                    unsubscribe_link,
                )
                .await?;
            }
            Err(error) => return Err(Error::Failed(Box::new(error))),
        }

        sent_count += 1;
    }

    debug!("sent `{sent_count}` emails");

    Ok(sent_count)
}

/// Returns a mock message ID.
#[cfg(test)]
async fn send_email(
    _ses_client: &SesClient,
    _from: impl Into<String>,
    _destination: impl Into<String>,
    _template_data: impl Into<String>,
    _unsubscribe_link: impl Into<String>,
) -> Result<Option<String>, Error> {
    Ok(Some("test".to_string()))
}

/// Sends an email and returns its message ID.
///
/// * `ses_client` - The Ses client instance.
/// * `from` - The source address of the email.
/// * `destination` - The target address of the email.
/// * `template_data` - The newsletter template data.
/// * `unsubscribe_link` - The unsubscribe link for the user.
#[cfg(not(test))]
async fn send_email(
    ses_client: &SesClient,
    from: impl Into<String>,
    destination: impl Into<String>,
    template_data: impl Into<String>,
    unsubscribe_link: impl Into<String>,
) -> Result<Option<String>, Error> {
    let local_unsubscribe_header = MessageHeader::builder()
        .name("List-Unsubscribe")
        .value(format!("<{}>", unsubscribe_link.into()))
        .build()
        .map_err(Box::new)
        .map_err(|err| Error::Failed(err))?;

    ses_client
        .send_email()
        .from_email_address(from)
        // TODO: Make the `Reply-To` opt-in for the writer to avoid leaking their e-mail address.
        // .set_reply_to_addresses(Some(vec!["writer_of_the_story@storiny.com".to_string()]))
        .destination(Destination::builder().to_addresses(destination).build())
        .content(
            EmailContent::builder()
                .template(
                    Template::builder()
                        .template_name(EmailTemplate::BlogNewsletter.to_string())
                        .template_data(template_data)
                        .headers(local_unsubscribe_header)
                        .headers(UNSUBSCRIBE_HEADER.clone())
                        .build(),
                )
                .build(),
        )
        .send()
        .await
        .map_err(|error| Box::new(error.into_service_error()))
        .map_err(|error| Error::Failed(error))
        .map(|output| output.message_id)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::get_job_state_for_test;
    use sqlx::PgPool;

    #[sqlx::test(fixtures("newsletter"))]
    async fn can_send_a_newsletter(pool: PgPool) {
        let state = get_job_state_for_test(pool, None).await;
        let result = send_newsletter(NewsletterJob { story_id: 3_i64 }, state)
            .await
            .expect("unable to send the emails");

        assert_eq!(result, 3);
    }

    #[sqlx::test]
    async fn can_handle_an_unknown_story(pool: PgPool) {
        let state = get_job_state_for_test(pool, None).await;
        let result = send_newsletter(
            NewsletterJob {
                story_id: 12345_i64,
            },
            state,
        )
        .await
        .expect("unable to send the emails");

        assert_eq!(result, 0);
    }
}
