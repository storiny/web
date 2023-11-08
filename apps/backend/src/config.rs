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
    /// Allowed client origin (CORS)
    pub allowed_origin: String,
    /// Postgres URL
    pub database_url: String,
    /// Redis host
    pub redis_host: String,
    /// Redis port
    pub redis_port: String,
    /// Pexels API key
    pub pexels_api_key: String,
    /// Session cookie secret key
    pub session_secret_key: String,
    /// AWS access key ID
    pub aws_access_key_id: String,
    /// AWS secret access key
    pub aws_secret_access_key: String,
    /// Google OAuth
    pub google_client_id: String,
    pub google_client_secret: String,
    pub youtube_data_api_key: String,
}
