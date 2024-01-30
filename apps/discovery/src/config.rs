use dotenv::dotenv;
use serde::Deserialize;

/// Environment configuration.
#[derive(Deserialize, Debug, Clone)]
pub struct Config {
    /// Development environment flag
    pub is_dev: bool,
    /// App host
    pub host: String,
    /// App port
    pub port: String,
    /// Public URL of the CDN server
    pub cdn_server_url: String,
    /// Public URL of the font-end web server
    pub web_server_url: String,
    /// The secret key used to sign external image URLs
    pub proxy_key_secret: String,
    /// Redis host
    pub redis_host: String,
    /// Redis port
    pub redis_port: String,
}

/// Returns the application environment configuration.
pub fn get_app_config() -> envy::Result<Config> {
    dotenv().ok();
    envy::from_env()
}
