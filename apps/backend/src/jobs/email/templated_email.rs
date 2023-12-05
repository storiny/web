#[cfg(not(test))]
use crate::constants::email_source::EMAIL_SOURCE;
use crate::{
    constants::email_template::EmailTemplate,
    jobs::init::SharedJobState,
    SesClient,
};
use apalis::prelude::*;
#[cfg(not(test))]
use aws_sdk_sesv2::types::{
    Destination,
    EmailContent,
    Template,
};
use serde::{
    Deserialize,
    Serialize,
};
use std::sync::Arc;
use tracing::debug;

pub const TEMPLATED_EMAIL_JOB_NAME: &'static str = "j:n:tmpl_email";

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct TemplatedEmailJob {
    /// The destination email address to send the email to.
    pub destination: String,
    /// The email template variant.
    pub template: EmailTemplate,
    /// The email template data, serialized into a string.
    pub template_data: String,
}

impl Job for TemplatedEmailJob {
    const NAME: &'static str = TEMPLATED_EMAIL_JOB_NAME;
}

/// Sends a templated email.
#[tracing::instrument(
    name = "JOB send_templated_email",
    skip_all,
    fields(
        template_name = job.template.to_string()
    ),
    err
)]
pub async fn send_templated_email(job: TemplatedEmailJob, ctx: JobContext) -> Result<(), JobError> {
    let template_name = job.template.to_string();

    debug!("attempting to send a templated email (`{template_name}`)");

    let state = ctx.data::<Arc<SharedJobState>>()?;
    let message_id = send_email(&state.ses_client, job).await?;

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
    _job: TemplatedEmailJob,
) -> Result<Option<String>, JobError> {
    Ok(Some("test".to_string()))
}

/// Sends an email and returns its message ID.
///
/// * `ses_client` - The Ses client instance.
/// * `job` - The templated email job.
#[cfg(not(test))]
async fn send_email(
    ses_client: &SesClient,
    job: TemplatedEmailJob,
) -> Result<Option<String>, JobError> {
    ses_client
        .send_email()
        .from_email_address(EMAIL_SOURCE)
        .destination(Destination::builder().to_addresses(job.destination).build())
        .content(
            EmailContent::builder()
                .template(
                    Template::builder()
                        .template_name(job.template.to_string())
                        .template_data(job.template_data)
                        .build(),
                )
                .build(),
        )
        .send()
        .await
        .map_err(|error| Box::new(error.into_service_error()))
        .map_err(|error| JobError::Failed(error))
        .map(|output| output.message_id)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        constants::email_template::EmailTemplate,
        test_utils::get_job_ctx_for_test,
    };
    use sqlx::PgPool;

    #[sqlx::test]
    async fn can_send_a_templated_email(pool: PgPool) {
        let ctx = get_job_ctx_for_test(pool, None).await;
        let result = send_templated_email(
            TemplatedEmailJob {
                destination: "someone@storiny.com".to_string(),
                template: EmailTemplate::EmailVerification,
                template_data: "".to_string(),
            },
            ctx,
        )
        .await;

        assert!(result.is_ok());
    }
}
