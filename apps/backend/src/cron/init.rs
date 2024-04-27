use crate::{
    config,
    config::get_app_config,
    cron::{
        cleanup_blogs::cleanup_blogs,
        cleanup_db::cleanup_db,
        cleanup_s3::cleanup_s3,
        sitemap::refresh_sitemap,
    },
    S3Client,
};
use apalis::{
    cron::{
        CronStream,
        Schedule,
    },
    layers::tracing::TraceLayer,
    prelude::*,
};
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
pub struct SharedCronJobState {
    /// Environment configuration
    pub config: config::Config,
    /// Postgres connection pool
    pub db_pool: Pool<Postgres>,
    /// AWS S3 client instance
    pub s3_client: S3Client,
}

/// Starts the background cron jobs.
///
/// * `db_pool` - A Postgres database connection pool.
/// * `s3_client` - A S3 client instance.
pub fn start_cron_jobs(db_pool: Pool<Postgres>, s3_client: S3Client) {
    #[allow(clippy::expect_used)]
    let config = get_app_config().expect("unable to load the environment configuration");
    let state = Arc::new(SharedCronJobState {
        config,
        db_pool,
        s3_client,
    });

    tokio::spawn(async move {
        Monitor::<TokioExecutor>::new()
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
                    .build(service_fn(refresh_sitemap)),
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
                    .build(service_fn(cleanup_db)),
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
                    .build(service_fn(cleanup_s3)),
            )
            .register(
                WorkerBuilder::new("blogs-cleanup-worker")
                    .layer(TraceLayer::new())
                    .data(state.clone())
                    .stream(
                        CronStream::new(
                            // Run every wednesday
                            #[allow(clippy::expect_used)]
                            Schedule::from_str("0 0 0 * * 3")
                                .expect("unable to parse the cron schedule"),
                        )
                        .into_stream(),
                    )
                    .build(service_fn(cleanup_blogs)),
            )
            .on_event(|event| {
                let worker_id = event.id();
                match event.inner() {
                    Event::Start => info!("[{worker_id}] worker started"),
                    Event::Error(err) => {
                        error!("[{worker_id}] worker encountered an error: {err:?}")
                    }
                    Event::Exit => info!("[{worker_id}] worker exited"),
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
