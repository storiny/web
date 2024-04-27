use crate::{
    amqp::consumers::{
        newsletter::newsletter_consumer,
        notify_story_add::notify_story_add_consumer,
        templated_email::templated_email_consumer,
    },
    config,
    config::get_app_config,
    models::email_templates::blog_newsletter::BlogNewsletterEmailTemplateData,
    LapinPool,
    RedisPool,
    S3Client,
    SesClient,
};
use sqlx::{
    Pool,
    Postgres,
};
use std::sync::Arc;

/// State common to all the message queues.
#[derive(Clone)]
pub struct SharedQueueState {
    /// Environment configuration
    pub config: config::Config,
    /// Redis connection pool
    pub redis: RedisPool,
    /// Postgres connection pool
    pub db_pool: Pool<Postgres>,
    /// AWS SES client instance
    pub ses_client: SesClient,
    /// AWS S3 client instance
    pub s3_client: S3Client,
}

pub async fn init_mq_consumers(
    lapin_pool: LapinPool,
    redis_pool: RedisPool,
    db_pool: Pool<Postgres>,
    ses_client: SesClient,
    s3_client: S3Client,
) -> anyhow::Result<()> {
    #[allow(clippy::expect_used)]
    let config = get_app_config().expect("unable to load the environment configuration");
    let state = Arc::new(SharedQueueState {
        config,
        redis: redis_pool,
        db_pool,
        ses_client,
        s3_client,
    });

    templated_email_consumer(lapin_pool.clone(), state.clone(), None::<fn(_) -> _>).await?;
    newsletter_consumer(
        lapin_pool.clone(),
        state.clone(),
        None::<fn(&str, &BlogNewsletterEmailTemplateData) -> _>,
    )
    .await?;
    notify_story_add_consumer(lapin_pool.clone(), state.clone()).await?;

    Ok(())
}
