use crate::{
    constants::{
        email_source::EMAIL_SOURCE,
        email_template::EmailTemplate,
    },
    jobs::init::SharedJobState,
};
use apalis::prelude::*;
use rusoto_ses::{
    Destination,
    SendTemplatedEmailRequest,
    Ses,
};
use serde::{
    Deserialize,
    Serialize,
};
use std::sync::Arc;

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
pub async fn send_templated_email(job: TemplatedEmailJob, ctx: JobContext) -> Result<(), JobError> {
    log::info!(
        "Attempting to send a templated email (`{}`)",
        job.template.to_string()
    );

    let state = ctx.data::<Arc<SharedJobState>>()?;
    let ses_client = &state.ses_client;

    let result = ses_client
        .send_templated_email(SendTemplatedEmailRequest {
            destination: Destination {
                to_addresses: Some(vec![job.destination]),
                ..Default::default()
            },
            source: EMAIL_SOURCE.to_string(),
            template: job.template.to_string(),
            template_data: job.template_data,
            ..Default::default()
        })
        .await
        .map_err(Box::new)
        .map_err(|err| JobError::Failed(err))?;

    log::info!(
        "Sent a templated email with message ID `{}`",
        result.message_id
    );

    Ok(())
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
