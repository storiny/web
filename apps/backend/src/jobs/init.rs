use crate::{
    config,
    config::get_app_config,
    jobs::{
        cron::{
            cleanup_blogs::cleanup_blogs,
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
    layers::tracing::TraceLayer,
    prelude::*,
};
use redis::aio::ConnectionManager;
use sqlx::{
    Pool,
    Postgres,
};
use std::{
    str::FromStr,
    sync::Arc,
    time::Duration,
};
use tracing::{
    error,
    info,
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

/// Storage map for all the jobs. Used to remove done and killed jobs from the cache.
#[derive(Clone)]
pub struct JobStorageMap {
    pub story_add_by_user: JobStorage<NotifyStoryAddByUserJob>,
    pub story_add_by_tag: JobStorage<NotifyStoryAddByTagJob>,
    pub templated_email: JobStorage<TemplatedEmailJob>,
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
    #[allow(clippy::expect_used)]
    let config = get_app_config().expect("unable to load the environment configuration");
    let state = Arc::new(SharedJobState {
        config,
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

        let job_storage_map = JobStorageMap {
            story_add_by_user: story_add_by_user_storage.clone(),
            story_add_by_tag: story_add_by_tag_storage.clone(),
            templated_email: templated_email_storage.clone(),
        };

        Monitor::<TokioExecutor>::new()
            // Push notifications
            .register_with_count(
                4,
                WorkerBuilder::new("notify-story-add-by-user-worker")
                    .layer(TraceLayer::new())
                    .data(story_add_by_user_state.clone())
                    .with_storage(story_add_by_user_storage)
                    .build_fn(notify_story_add_by_user),
            )
            .register_with_count(
                4,
                WorkerBuilder::new("notify-story-add-by-tag-worker")
                    .layer(TraceLayer::new())
                    .data(story_add_by_tag_state.clone())
                    .with_storage(story_add_by_tag_storage)
                    .build_fn(notify_story_add_by_tag),
            )
            // Email
            .register_with_count(
                6,
                WorkerBuilder::new("templated-email-worker")
                    .layer(TraceLayer::new())
                    .data(templated_email_state.clone())
                    .with_storage(templated_email_storage)
                    .build_fn(send_templated_email),
            )
            // Cron
            .register(
                WorkerBuilder::new("cache-cleanup-worker")
                    .layer(TraceLayer::new())
                    .data(job_storage_map)
                    .stream(
                        CronStream::new(
                            // Run every night at 2 AM
                            #[allow(clippy::expect_used)]
                            Schedule::from_str("0 0 02 * * *")
                                .expect("unable to parse the cron schedule"),
                        )
                        .into_stream(),
                    )
                    .build_fn(cleanup_cache),
            )
            .register(
                WorkerBuilder::new("sitemap-worker")
                    .layer(TraceLayer::new())
                    .data(state.clone())
                    .stream(
                        CronStream::new(
                            // Run twice a month
                            #[allow(clippy::expect_used)]
                            Schedule::from_str("0 0 0 1,15 * *")
                                .expect("unable to parse the cron schedule"),
                        )
                        .into_stream(),
                    )
                    .build_fn(refresh_sitemap),
            )
            .register(
                WorkerBuilder::new("db-cleanup-worker")
                    .layer(TraceLayer::new())
                    .data(state.clone())
                    .stream(
                        CronStream::new(
                            // Run every monday
                            #[allow(clippy::expect_used)]
                            Schedule::from_str("0 0 0 * * 1")
                                .expect("unable to parse the cron schedule"),
                        )
                        .into_stream(),
                    )
                    .build_fn(cleanup_db),
            )
            .register(
                WorkerBuilder::new("s3-cleanup-worker")
                    .layer(TraceLayer::new())
                    .data(state.clone())
                    .stream(
                        CronStream::new(
                            // Run every tuesday
                            #[allow(clippy::expect_used)]
                            Schedule::from_str("0 0 0 * * 2")
                                .expect("unable to parse the cron schedule"),
                        )
                        .into_stream(),
                    )
                    .build_fn(cleanup_s3),
            )
            .register(
                WorkerBuilder::new("blogs-cleanup-worker")
                    .layer(TraceLayer::new())
                    .data(state)
                    .stream(
                        CronStream::new(
                            // Run every wednesday
                            #[allow(clippy::expect_used)]
                            Schedule::from_str("0 0 0 * * 3")
                                .expect("unable to parse the cron schedule"),
                        )
                        .into_stream(),
                    )
                    .build_fn(cleanup_blogs),
            )
            .on_event(|event| {
                let worker_id = event.id();

                match event.inner() {
                    Event::Start => {
                        info!("[{worker_id}] worker started");
                    }
                    Event::Error(err) => {
                        error!("[{worker_id}] worker encountered an error: {err:?}");
                    }
                    Event::Exit => {
                        info!("[{worker_id}] worker exited");
                    }
                    _ => {}
                }
            })
            .shutdown_timeout(Duration::from_millis(10_000))
            .run_with_signal(async {
                tokio::signal::ctrl_c().await?;
                info!("monitor starting shutdown");
                Ok(())
            })
            .await
    });
}
