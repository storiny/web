use deadpool_redis::Pool as RedisPool;
use maxminddb::Reader;
use oauth2::basic::BasicClient;
use routes::oauth::ConnectionError;
use rusoto_s3::S3Client;
use rusoto_ses::SesClient;
use sailfish::TemplateOnce;
use sqlx::{Pool, Postgres};
use user_agent_parser::UserAgentParser;

pub mod config;
pub mod constants;
pub mod error;
pub mod grpc;
pub mod iso8601;
pub mod middleware;
pub mod models;
pub mod oauth;
pub mod routes;
pub mod utils;

#[cfg(test)]
pub mod test_utils;

/// Index page template
#[derive(TemplateOnce)]
#[template(path = "index.stpl")]
pub struct IndexTemplate {
    req_id: String,
}

/// Connection page template
#[derive(TemplateOnce)]
#[template(path = "connection.stpl")]
pub struct ConnectionTemplate {
    provider_icon: String,
    provider_name: String,
    error: Option<ConnectionError>,
}

/// Application state
pub struct AppState {
    /// Environment configuration
    pub config: config::Config,
    /// Redis connection pool
    pub redis: RedisPool,
    /// Postgres connection pool
    pub db_pool: Pool<Postgres>,
    /// GeoIP database instance
    pub geo_db: Reader<Vec<u8>>,
    /// User-agent parser instance
    pub ua_parser: UserAgentParser,
    /// AWS SES client instance
    pub ses_client: SesClient,
    /// AWS S3 client instance
    pub s3_client: S3Client,
    /// Reqwest client instance
    pub reqwest_client: reqwest::Client,
    /// OAuth client map
    pub oauth_client_map: OAuthClientMap,
}

/// OAuth client instances.
pub struct OAuthClientMap {
    youtube: BasicClient,
    github: BasicClient,
    spotify: BasicClient,
    discord: BasicClient,
    dribbble: BasicClient,
}
