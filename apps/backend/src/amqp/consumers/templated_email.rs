use crate::{
    amqp::init::SharedQueueState,
    constants::email_source::EMAIL_SOURCE,
    LapinPool,
    SesClient,
};
use anyhow::anyhow;
use aws_sdk_sesv2::types::{
    Destination,
    EmailContent,
    Template,
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
use serde::{
    Deserialize,
    Serialize,
};
use std::sync::Arc;
use tracing::{
    debug,
    error,
};

pub const TEMPLATED_EMAIL_QUEUE_NAME: &str = "templated_email";

/// The queue message to send a templated email.
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
pub struct TemplatedEmailMessage {
    /// The destination email address to send the email to.
    pub destination: String,
    /// The name of the email template.
    pub template: String,
    /// The email template data, serialized into a string.
    pub template_data: String,
}

/// Sends a templated email.
///
/// * `lapin` - The lapin pool.
/// * `state` - The shared queue state.
/// * `email_dispatcher` - An optional function to use instead of [send_email] for dispatching the
///   emails.
#[tracing::instrument(name = "AMQP templated_email_consumer", skip_all, err)]
pub async fn templated_email_consumer(
    lapin: LapinPool,
    state: Arc<SharedQueueState>,
    email_dispatcher: Option<impl Fn(TemplatedEmailMessage) + Send + Sync + Clone + 'static>,
) -> anyhow::Result<()> {
    let conn = lapin.get().await?;
    let channel = conn.create_channel().await?;

    let _queue = channel
        .queue_declare(
            TEMPLATED_EMAIL_QUEUE_NAME,
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
            TEMPLATED_EMAIL_QUEUE_NAME,
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
                let data = serde_json::from_slice::<TemplatedEmailMessage>(&delivery.data)
                    .map_err(|err| anyhow!("failed to deserialize the message: {err:?}"))?;

                debug!("attempting to send a templated email (`{}`)", data.template);

                if let Some(dispatch) = email_dispatcher {
                    dispatch(data);
                } else {
                    match send_email(&state.ses_client, data).await {
                        Ok(message_id) => {
                            debug!(
                                "sent a templated email with message ID `{}`",
                                message_id.unwrap_or("empty".to_string())
                            );
                        }
                        Err(err) => error!("failed to send the email: {err:?}"),
                    }
                }

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
/// * `ses_client` - The Ses client instance.
/// * `data` - The templated email message data.
async fn send_email(
    ses_client: &SesClient,
    data: TemplatedEmailMessage,
) -> anyhow::Result<Option<String>> {
    ses_client
        .send_email()
        .from_email_address(EMAIL_SOURCE)
        .destination(
            Destination::builder()
                .to_addresses(data.destination)
                .build(),
        )
        .content(
            EmailContent::builder()
                .template(
                    Template::builder()
                        .template_name(data.template.to_string())
                        .template_data(data.template_data)
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
        constants::email_template::EmailTemplate,
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
        ops::Deref,
        sync::Mutex,
        time::Duration,
    };

    #[sqlx::test]
    async fn can_send_a_templated_email(pool: PgPool) {
        let state = get_queue_state_for_test(pool, None).await;
        let lapin = get_lapin_pool();
        let is_success = Arc::new(Mutex::new(false));
        let message = TemplatedEmailMessage {
            destination: "someone@storiny.com".to_string(),
            template: EmailTemplate::EmailVerification.to_string(),
            template_data: "{x:1}".to_string(),
        };

        templated_email_consumer(
            lapin.clone(),
            state,
            Some({
                let is_success = is_success.clone();
                let message = message.clone();

                move |data: TemplatedEmailMessage| {
                    let mut value = is_success.lock().unwrap();
                    *value = data == message;
                }
            }),
        )
        .await
        .expect("unable to start the consumer");

        let connection = lapin.get().await.unwrap();
        let channel = connection.create_channel().await.unwrap();
        let message = serde_json::to_vec(&message).expect("unable to build the binary message");

        channel
            .basic_publish(
                "",
                TEMPLATED_EMAIL_QUEUE_NAME,
                BasicPublishOptions::default(),
                &message,
                BasicProperties::default(),
            )
            .await
            .unwrap();

        tokio::time::sleep(Duration::from_secs(5)).await;

        assert!(is_success.lock().unwrap().deref());
    }
}
