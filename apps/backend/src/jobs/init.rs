use crate::{
    config,
    config::get_app_config,
    jobs::{
        cron::{
            cleanup_cache::cleanup_cache,
            cleanup_db::cleanup_db,
            cleanup_s3::cleanup_s3,
            sitemap::refresh_sitemap,
        },
        email::templated_email::{
            send_templated_email,
            TemplatedEmailJob,
        },
        notify::{
            story_add_by_tag::{
                notify_story_add_by_tag,
                NotifyStoryAddByTagJob,
            },
            story_add_by_user::{
                notify_story_add_by_user,
                NotifyStoryAddByUserJob,
            },
        },
        storage::JobStorage,
    },
    RedisPool,
    S3Client,
    SesClient,
};
use apalis::{
    cron::{
        CronStream,
        Schedule,
    },
    layers::{
        Extension,
        TraceLayer,
    },
    prelude::{
        timer::TokioTimer,
        *,
    },
};
use redis::aio::ConnectionManager;
use sqlx::{
    Pool,
    Postgres,
};
use std::{
    str::FromStr,
    sync::Arc,
};

/// State common to all the jobs
#[derive(Clone)]
pub struct SharedJobState {
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

/// Starts the background jobs.
///
/// * `connection_manager` - The Redis async connection manager instance.
/// * `redis_pool` - A Redis connection pool.
/// * `db_pool` - A Postgres database connection pool.
/// * `ses_client` - A SES client instance.
/// * `s3_client` - A S3 client instance.
pub async fn start_jobs(
    connection_manager: ConnectionManager,
    redis_pool: RedisPool,
    db_pool: Pool<Postgres>,
    ses_client: SesClient,
    s3_client: S3Client,
) {
    let state = Arc::new(SharedJobState {
        config: get_app_config().unwrap(),
        redis: redis_pool,
        db_pool,
        ses_client,
        s3_client,
    });

    tokio::spawn(async move {
        let story_add_by_user_state = state.clone();
        let story_add_by_user_storage: JobStorage<NotifyStoryAddByUserJob> =
            JobStorage::new(connection_manager.clone());

        let story_add_by_tag_state = state.clone();
        let story_add_by_tag_storage: JobStorage<NotifyStoryAddByTagJob> =
            JobStorage::new(connection_manager.clone());

        let templated_email_state = state.clone();
        let templated_email_storage: JobStorage<TemplatedEmailJob> =
            JobStorage::new(connection_manager);

        Monitor::new()
            // Push notifications
            .register_with_count(4, move |x| {
                WorkerBuilder::new(format!("notify-story-add-by-user-worker-{x}"))
                    .layer(TraceLayer::new())
                    .layer(Extension(story_add_by_user_state.clone()))
                    .with_storage(story_add_by_user_storage.clone())
                    .build_fn(notify_story_add_by_user)
            })
            .register_with_count(4, move |x| {
                WorkerBuilder::new(format!("notify-story-add-by-tag-worker-{x}"))
                    .layer(TraceLayer::new())
                    .layer(Extension(story_add_by_tag_state.clone()))
                    .with_storage(story_add_by_tag_storage.clone())
                    .build_fn(notify_story_add_by_tag)
            })
            // Email
            .register_with_count(6, move |x| {
                WorkerBuilder::new(format!("templated-email-worker-{x}"))
                    .layer(TraceLayer::new())
                    .layer(Extension(templated_email_state.clone()))
                    .with_storage(templated_email_storage.clone())
                    .build_fn(send_templated_email)
            })
            // Cron
            .register(
                WorkerBuilder::new("cache-cleanup-worker")
                    .layer(TraceLayer::new())
                    .layer(Extension(state.clone()))
                    .stream(
                        CronStream::new(
                            // Run every night at 2 AM
                            Schedule::from_str("0 0 02 * * *")
                                .expect("Unable to parse the cron schedule"),
                        )
                        .timer(TokioTimer)
                        .to_stream(),
                    )
                    .build_fn(cleanup_cache),
            )
            .register(
                WorkerBuilder::new("sitemap-worker")
                    .layer(TraceLayer::new())
                    .layer(Extension(state.clone()))
                    .stream(
                        CronStream::new(
                            // Run every month
                            Schedule::from_str("0 0 0 1 * *")
                                .expect("Unable to parse the cron schedule"),
                        )
                        .timer(TokioTimer)
                        .to_stream(),
                    )
                    .build_fn(refresh_sitemap),
            )
            .register(
                WorkerBuilder::new("db-cleanup-worker")
                    .layer(TraceLayer::new())
                    .layer(Extension(state.clone()))
                    .stream(
                        CronStream::new(
                            // Run every monday
                            Schedule::from_str("0 0 0 * * 1")
                                .expect("Unable to parse the cron schedule"),
                        )
                        .timer(TokioTimer)
                        .to_stream(),
                    )
                    .build_fn(cleanup_db),
            )
            .register(
                WorkerBuilder::new("s3-cleanup-worker")
                    .layer(TraceLayer::new())
                    .layer(Extension(state.clone()))
                    .stream(
                        CronStream::new(
                            // Run every tuesday
                            Schedule::from_str("0 0 0 * * 2")
                                .expect("Unable to parse the cron schedule"),
                        )
                        .timer(TokioTimer)
                        .to_stream(),
                    )
                    .build_fn(cleanup_s3),
            )
            .run()
            .await
    });
}
