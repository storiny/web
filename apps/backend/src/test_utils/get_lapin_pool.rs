use crate::{
    config::get_app_config,
    LapinPool,
};

/// Initializes and returns a Lapin connection pool for tests
pub fn get_lapin_pool() -> LapinPool {
    let config = get_app_config().unwrap();
    let mut cfg = deadpool_lapin::Config::default();
    cfg.url = Some(config.amqp_server_url.to_string());
    cfg.create_pool(Some(deadpool_lapin::Runtime::Tokio1))
        .unwrap()
}
