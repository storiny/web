#![forbid(unsafe_code)]

use crate::error::ExternalAuthError;
use deadpool_redis::Pool as RedisPool;
use maxminddb::Reader;
use oauth2::basic::BasicClient;
use routes::oauth::ConnectionError;
use rusoto_s3::S3Client;
use sailfish::TemplateOnce;
use sqlx::{
    Pool,
    Postgres,
};
use user_agent_parser::UserAgentParser;

pub mod config;
pub mod constants;
pub mod error;
pub mod grpc;
pub mod iso8601;
pub mod jobs;
pub mod middlewares;
pub mod models;
pub mod oauth;
pub mod realms;
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

/// Third-party login error template
#[derive(TemplateOnce, Default)]
#[template(path = "external_auth.stpl")]
pub struct ExternalAuthTemplate {
    provider_name: String,
    provider_id: String,
    access_token: String,
    error: Option<ExternalAuthError>,
    is_password_invalid: bool,
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
    google: BasicClient,
}
