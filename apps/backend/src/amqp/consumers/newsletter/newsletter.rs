use crate::{
    amqp::init::SharedQueueState,
    constants::{
        email_template::EmailTemplate,
        image_size::ImageSize,
    },
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
    LapinPool,
    SesClient,
};
use anyhow::anyhow;
use aws_sdk_sesv2::types::{
    Destination,
    EmailContent,
    MessageHeader,
    Template,
};
use chrono::{
    Datelike,
    Local,
};
use deadpool_lapin::lapin::{
    options::{
        BasicAckOptions,
        BasicConsumeOptions,
        QueueDeclareOptions,
    },
    types::FieldTable,
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
    static ref UNSUBSCRIBE_HEADER: MessageHeader =
        #[allow(clippy::expect_used)]
        MessageHeader::builder()
            .name("List-Unsubscribe-Post")
            .value("List-Unsubscribe=One-Click")
            .build()
            .expect("unable to build the unsubscribe header");
    //
    static ref DATE_FORMAT: Vec<FormatItem<'static>> =
        #[allow(clippy::expect_used)]
        time::format_description::parse("[day] [month repr:short], [year]")
            .expect("unable to parse the date format");
}

pub const NEWSLETTER_QUEUE_NAME: &str = "newsletter";

/// The queue message to send newsletter emails for a blog.
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct NewsletterMessage {
    /// The ID of the published story.
    pub story_id: i64,
}

/// Sends an email to all the subscribers of the blog's newsletter announcing that the story has
/// been published.
///
/// * `lapin` - The lapin pool.
/// * `state` - The shared queue state.
/// * `email_dispatcher` - An optional function to use instead of [send_email] for dispatching the
///   emails.
#[tracing::instrument(name = "AMQP newsletter_consumer", skip_all, err)]
pub async fn newsletter_consumer(
    lapin: LapinPool,
    state: Arc<SharedQueueState>,
    email_dispatcher: Option<
        impl Fn(&str, &BlogNewsletterEmailTemplateData) + Send + Sync + Clone + 'static,
    >,
) -> anyhow::Result<()> {
    let conn = lapin.get().await?;
    let channel = conn.create_channel().await?;

    let _queue = channel
        .queue_declare(
            NEWSLETTER_QUEUE_NAME,
            QueueDeclareOptions {
                passive: false,
                durable: true,
                exclusive: false,
                auto_delete: false,
                nowait: false,
            },
            FieldTable::default(),
        )
        .await?;

    let mut consumer = channel
        .basic_consume(
            NEWSLETTER_QUEUE_NAME,
            "",
            BasicConsumeOptions::default(),
            FieldTable::default(),
        )
        .await?;

    tokio::spawn(async move {
        while let Ok(Some(delivery)) = consumer.try_next().await {
            let state = state.clone();
            let email_dispatcher = email_dispatcher.clone();

            tokio::spawn(async move {
                let data = serde_json::from_slice::<NewsletterMessage>(&delivery.data)
                    .map_err(|err| anyhow!("failed to deserialize the message: {err:?}"))?;
                let story_id = data.story_id;

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
                    Err(err) => {
                        // The blog-story relation has been deleted since the story was
                        // published.
                        return if matches!(err, sqlx::Error::RowNotFound) {
                            warn!("relevant row not found, skipping job");
                            Ok(())
                        } else {
                            Err(anyhow!("database error: {err:?}"))
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

                // The `unsubscribe_link` and `email` are explicitly set for each
                // subscriber.
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
                            avatar_url: result.get::<Option<Uuid>, _>("user_avatar_id").map(
                                |value| {
                                    get_cdn_url(
                                        &state.config.cdn_server_url,
                                        value.to_string().as_str(),
                                        Some(ImageSize::W64),
                                    )
                                },
                            ),
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
                            url: format!("{blog_url}?source=newsletter"),
                        },
                    },
                    copyright_year: Local::now().year().to_string(),
                };

                let mut subscriber_stream = sqlx::query(
                    r#"
SELECT email
FROM subscribers
WHERE blog_id = $1
ORDER BY created_at
"#,
                )
                .bind(result.get::<i64, _>("blog_id"))
                .fetch(&state.db_pool);

                while let Some(subscriber) = subscriber_stream
                    .try_next()
                    .await
                    .map_err(|err| anyhow!("unable to find the next subscriber: {err:?}"))?
                {
                    let target = subscriber.get::<String, _>("email");
                    let fragment = encode_unsubscribe_fragment(
                        &state.config.newsletter_secret,
                        result.get::<i64, _>("blog_id").to_string(),
                        &target,
                    )
                    .map_err(|error| {
                        anyhow!("unable to generate the unsubscribe fragment: {error:?}")
                    })?;

                    let unsubscribe_link = format!(
                        "{}/v1/newsletters/unsubscribe/{fragment}",
                        &state.config.api_server_url
                    );

                    template_data.email.clone_from(&target);
                    template_data.unsubscribe_link.clone_from(&unsubscribe_link);

                    if let Some(dispatch) = email_dispatcher.clone() {
                        dispatch(&from, &template_data);
                    } else {
                        let template_data =
                            serde_json::to_string(&template_data).map_err(|error| {
                                anyhow!("unable to serialize the template data: {error:?}")
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
                }

                debug!("sent emails");

                delivery
                    .ack(BasicAckOptions::default())
                    .await
                    .map_err(|err| anyhow!("failed to send the acknowledgement: {err:?}"))
            });
        }
    });

    Ok(())
}

/// Sends an email and returns its message ID.
///
/// * `ses_client` - The SES client instance.
/// * `from` - The source address of the email.
/// * `destination` - The target address of the email.
/// * `template_data` - The newsletter template data.
/// * `unsubscribe_link` - The unsubscribe link for the user.
async fn send_email(
    ses_client: &SesClient,
    from: impl Into<String>,
    destination: impl Into<String>,
    template_data: impl Into<String>,
    unsubscribe_link: impl Into<String>,
) -> anyhow::Result<Option<String>> {
    let local_unsubscribe_header = MessageHeader::builder()
        .name("List-Unsubscribe")
        .value(format!("<{}>", unsubscribe_link.into()))
        .build()
        .map_err(|error| anyhow!("unable to generate the header: {error:?}"))?;

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
        .map_err(|error| error.into_service_error())
        .map_err(|error| anyhow!("unable to send the email: {error:?}"))
        .map(|output| output.message_id)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        config::get_app_config,
        test_utils::{
            get_lapin_pool,
            get_queue_state_for_test,
        },
    };
    use deadpool_lapin::lapin::{
        options::BasicPublishOptions,
        BasicProperties,
    };
    use sqlx::PgPool;
    use std::{
        sync::Mutex,
        time::Duration,
    };

    #[sqlx::test(fixtures("newsletter"))]
    async fn can_send_a_newsletter(pool: PgPool) {
        let config = get_app_config().unwrap();
        let state = get_queue_state_for_test(pool, None).await;
        let lapin = get_lapin_pool();
        let items = Arc::new(Mutex::new(Vec::<BlogNewsletterEmailTemplateData>::new()));

        // Valid result for each iteration. The `unsubscribe_link` and `copyright_year` fields are
        // intentionally left with their default values because they are not compared by the
        // `BlogNewsletterEmailTemplateData`'s `PartialEq` trait, as they are subject to changes
        // and do not hold importance here.
        let valid_items: Vec<BlogNewsletterEmailTemplateData> = {
            let blog_url = get_blog_url("test-blog".to_string(), None);

            let blog = Blog {
                name: "Test blog".to_string(),
                logo_url: Some(get_cdn_url(
                    &config.cdn_server_url,
                    "f4fd9bb4-f81b-454e-83f7-76cad3eba176",
                    Some(ImageSize::W64),
                )),
                url: format!("{blog_url}?source=newsletter"),
            };

            let user = User {
                name: "Test user".to_string(),
                avatar_url: Some(get_cdn_url(
                    &config.cdn_server_url,
                    "f4fd9bb4-f81b-454e-83f7-76cad3eba176",
                    Some(ImageSize::W64),
                )),
                url: format!("{}/test_user?source=newsletter", &config.web_server_url),
            };

            let story = Story {
                title: "Some story".to_string(),
                description: Some("Test description".to_string()),
                splash_url: Some(get_cdn_url(
                    &config.cdn_server_url,
                    "f4fd9bb4-f81b-454e-83f7-76cad3eba176",
                    Some(ImageSize::W960),
                )),
                published_date: "15 Feb, 2024".to_string(),
                read_time: format!("{} min read", get_read_time(6653, None)),
                url: format!("{blog_url}/test-story?source=newsletter"),
                user,
                blog,
            };

            vec![
                BlogNewsletterEmailTemplateData {
                    email: "subscriber-3@example.com".to_string(),
                    unsubscribe_link: "".to_string(),
                    copyright_year: "".to_string(),
                    story: story.clone(),
                },
                BlogNewsletterEmailTemplateData {
                    email: "subscriber-2@example.com".to_string(),
                    unsubscribe_link: "".to_string(),
                    copyright_year: "".to_string(),
                    story: story.clone(),
                },
                BlogNewsletterEmailTemplateData {
                    email: "subscriber-1@example.com".to_string(),
                    unsubscribe_link: "".to_string(),
                    copyright_year: "".to_string(),
                    story,
                },
            ]
        };

        newsletter_consumer(
            lapin.clone(),
            state,
            Some({
                let items = items.clone();
                move |from: &str, data: &BlogNewsletterEmailTemplateData| {
                    let mut items = items.lock().unwrap();

                    // Also check the `from` value.
                    if from == "Test blog <test-blog@newsletters.storiny.com>" {
                        items.push(data.clone());
                    }
                }
            }),
        )
        .await
        .expect("unable to start the consumer");

        let connection = lapin.get().await.unwrap();
        let channel = connection.create_channel().await.unwrap();
        let message = serde_json::to_vec(&NewsletterMessage { story_id: 3_i64 })
            .expect("unable to build the binary message");

        channel
            .basic_publish(
                "",
                NEWSLETTER_QUEUE_NAME,
                BasicPublishOptions::default(),
                &message,
                BasicProperties::default(),
            )
            .await
            .unwrap();

        tokio::time::sleep(Duration::from_secs(5)).await;

        let items = items.lock().unwrap();
        let items = items.deref();

        assert_eq!(items.len(), 3);

        let is_valid_items = items
            .iter()
            .zip(&valid_items)
            .filter(|&(a, b)| a == b)
            .count()
            == items.len();

        assert!(is_valid_items);
    }

    #[sqlx::test]
    async fn can_handle_an_unknown_story(pool: PgPool) {
        let state = get_queue_state_for_test(pool, None).await;
        let lapin = get_lapin_pool();
        let items = Arc::new(Mutex::new(Vec::<BlogNewsletterEmailTemplateData>::new()));

        newsletter_consumer(
            lapin.clone(),
            state,
            Some({
                let items = items.clone();
                move |_from: &str, data: &BlogNewsletterEmailTemplateData| {
                    let mut items = items.lock().unwrap();
                    items.push(data.clone());
                }
            }),
        )
        .await
        .expect("unable to start the consumer");

        let connection = lapin.get().await.unwrap();
        let channel = connection.create_channel().await.unwrap();
        let message = serde_json::to_vec(&NewsletterMessage {
            story_id: 12345_i64,
        })
        .expect("unable to build the binary message");

        channel
            .basic_publish(
                "",
                NEWSLETTER_QUEUE_NAME,
                BasicPublishOptions::default(),
                &message,
                BasicProperties::default(),
            )
            .await
            .unwrap();

        tokio::time::sleep(Duration::from_secs(5)).await;

        assert_eq!(items.lock().unwrap().deref().len(), 0);
    }
}
