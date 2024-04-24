#[cfg(not(test))]
use crate::constants::email_source::EMAIL_SOURCE;
use crate::{
    constants::{
        email_template::EmailTemplate,
        image_size::ImageSize,
    },
    error::AppError,
    jobs::init::SharedJobState,
    models::email_templates::{
        blog_newsletter::BlogNewsletterEmailTemplateData,
        subscription_confirmation::{
            Blog,
            SubscriptionConfirmationEmailTemplateData,
        },
    },
    utils::{
        get_blog_url::get_blog_url,
        get_cdn_url::get_cdn_url,
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
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::Row;
use std::sync::Arc;
use tracing::{
    debug,
    warn,
};
use uuid::Uuid;

pub const NEWSLETTER_JOB_NAME: &str = "j:n:nws";

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct NewsletterJob {
    /// The ID of the published story.
    pub story_id: String,
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
) -> Result<(), Error> {
    let story_id = job.story_id;
    let db_pool = &state.db_pool;

    debug!("attempting to send newsletter (`{template_name}`)");

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
    -- Join story
    INNER JOIN stories AS s
        ON s.id = bs.story_id
    -- Join story writer
    INNER JOIN users AS u
        ON u.id = s.user_id
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
                Ok(())
            } else {
                Err(Error::Failed(Box::new(error)))
            };
        }
    };

    let blog_url = get_blog_url(
        result.get::<String, _>("blog_slug"),
        result.get::<Option<String>, _>("blog_domain"),
    );

    let template_data = serde_json::to_string(&BlogNewsletterEmailTemplateData {
        link: format!("{blog_url}/newsletter/{token_id}"),
        blog: Blog {
            name: blog.get::<String, _>("name"),
            url: blog_url,
            logo_url: blog.get::<Option<Uuid>, _>("logo_id").map(|value| {
                get_cdn_url(
                    &data.config.cdn_server_url,
                    value.to_string().as_str(),
                    Some(ImageSize::W128),
                )
            }),
        },
        copyright_year: Local::now().year().to_string(),
    })
    .map_err(|error| {
        AppError::InternalError(format!("unable to serialize the template data: {error:?}"))
    })?;

    let mut sent_count = 0;
    let mut txn = db_pool
        .begin()
        .await
        .map_err(Box::new)
        .map_err(|err| Error::Failed(err))?;

    let mut subscriber_stream = sqlx::query(
        r#"
SELECT email
FROM subscribers
WHERE blog_id = $1
"#,
    )
    .bind(result.get::<i64, _>("blog_id"))
    .fetch(&mut *txn);

    while let Some(subscriber) = subscriber_stream
        .try_next()
        .await
        .map_err(Box::new)
        .map_err(|err| Error::Failed(err))?
    {
        let from = format!(
            "{} <{}@newsletters.storiny.com>",
            result.get::<String, _>("blog_name"),
            result.get::<String, _>("blog_slug")
        );

        send_mail(
            &state.ses_client,
            &from,
            subscriber.get::<String, _>("email").as_str(),
            "__TEMPLATE_DATA__",
        )
        .await?;

        sent_count += 1;
    }

    txn.commit()
        .await
        .map_err(Box::new)
        .map_err(|err| Error::Failed(err))?;

    debug!(
        "sent a templated email with message ID `{}`",
        message_id.unwrap_or("empty message id".to_string())
    );

    Ok(())
}

/// Returns a mock message ID.
#[cfg(test)]
async fn send_email(
    _ses_client: &SesClient,
    _from: impl Into<String>,
    _destination: impl Into<String>,
    _template_data: impl Into<String>,
) -> Result<Option<String>, Error> {
    Ok(Some("test".to_string()))
}

/// Sends an email and returns its message ID.
///
/// * `ses_client` - The Ses client instance.
/// * `from` - The source address of the email.
/// * `destination` - The target address of the email.
/// * `template_data` - The newsletter template data.
#[cfg(not(test))]
async fn send_mail(
    ses_client: &SesClient,
    from: impl Into<String>,
    destination: impl Into<String>,
    template_data: impl Into<String>,
) -> Result<Option<String>, Error> {
    ses_client
        .send_email()
        .from_email_address(from)
        // TODO: Make the `Reply-To` opt-in for the writer to avoid leaking their e-mail address.
        // .set_reply_to_addresses(Some(vec!["write_of_the_story@storiny.com".to_string()]))
        .destination(Destination::builder().to_addresses(destination).build())
        .content(
            EmailContent::builder()
                .template(
                    Template::builder()
                        .template_name(EmailTemplate::BlogNewsletter.to_string())
                        .template_data(template_data)
                        .headers(MessageHeader {
                            name: "List-Unsubscribe".to_string(),
                            value: format!(
                                "<https://api.storiny.com/v1/newsletters/unsubscribe/{}>"
                            ),
                        })
                        .headers(MessageHeader {
                            name: "List-Unsubscribe-Post".to_string(),
                            value: "List-Unsubscribe=One-Click".to_string(),
                        })
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
    use crate::{
        constants::email_template::EmailTemplate,
        test_utils::get_job_state_for_test,
    };
    use sqlx::PgPool;

    #[sqlx::test]
    async fn can_send_a_templated_email(pool: PgPool) {
        let state = get_job_state_for_test(pool, None).await;
        let result = send_templated_email(
            TemplatedEmailJob {
                destination: "someone@storiny.com".to_string(),
                template: EmailTemplate::EmailVerification,
                template_data: "".to_string(),
            },
            state,
        )
        .await;

        assert!(result.is_ok());
    }
}
