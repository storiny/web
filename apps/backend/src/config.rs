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
    /// Realms server host
    pub realms_host: String,
    /// Realms server port
    pub realms_port: String,
    /// GRPC service endpoint
    pub grpc_endpoint: String,
    /// RabbitMQ service endpoint
    pub amqp_server_url: String,
    /// MinIO server endpoint (only used locally and during tests)
    pub minio_endpoint: String,
    /// Public URL of the realms server
    pub realms_server_url: String,
    /// Public URL of the API server
    pub api_server_url: String,
    /// Public URL of the CDN server
    pub cdn_server_url: String,
    /// Public URL of the font-end web server
    pub web_server_url: String,
    /// Public URL of the sitemaps server
    pub sitemaps_server_url: String,
    /// Postgres URL
    pub database_url: String,
    /// Redis host
    pub redis_host: String,
    /// Redis port
    pub redis_port: String,
    /// GRPC authentication secret token
    pub grpc_secret_token: String,
    /// Shared secret key used to sign the newsletter unsubscribe links.
    pub newsletter_secret: String,
    /// Shared secret key used to sign the domain verification TXT record values.
    pub domain_verification_secret: String,
    /// Pexels API key
    pub pexels_api_key: String,
    /// Session cookie secret key
    pub session_secret_key: String,
    /// The Base64-encoded salt string for hashing tokens
    pub token_salt: String,
    /// AWS access key ID
    pub aws_access_key_id: String,
    /// AWS secret access key
    pub aws_secret_access_key: String,
    // Google OAuth
    pub google_client_id: String,
    pub google_client_secret: String,
    pub youtube_data_api_key: String,
    // GitHub OAuth
    pub github_client_id: String,
    pub github_client_secret: String,
    // Spotify OAuth
    pub spotify_client_id: String,
    pub spotify_client_secret: String,
    // Discord OAuth
    pub discord_client_id: String,
    pub discord_client_secret: String,
    // Dribbble OAuth
    pub dribbble_client_id: String,
    pub dribbble_client_secret: String,
}

/// Returns the application environment configuration.
pub fn get_app_config() -> envy::Result<Config> {
    dotenv().ok();
    envy::from_env()
}
