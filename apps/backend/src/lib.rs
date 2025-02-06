#![allow(clippy::module_inception)]
#![deny(clippy::expect_used, clippy::unwrap_used)]
//
#[cfg(target_has_atomic = "ptr")]
//
use crate::error::ExternalAuthError;
use aws_config::{
    BehaviorVersion,
    Region,
};
use hmac::Hmac;
use maxminddb::Reader;
use routes::oauth::ConnectionError;
use sailfish::TemplateOnce;
use sha1::Sha1;
use sqlx::{
    Pool,
    Postgres,
};
use user_agent_parser::UserAgentParser;

// Types
pub type HmacSha1 = Hmac<Sha1>;

// Aliases
use crate::{
    error::AddAccountError,
    oauth::OAuthClient,
};
pub use aws_sdk_s3::Client as S3Client;
pub use aws_sdk_sesv2::Client as SesClient;
pub use deadpool_lapin::Pool as LapinPool;
pub use deadpool_redis::Pool as RedisPool;

pub mod amqp;
pub mod config;
pub mod constants;
pub mod cron;
pub mod error;
pub mod grpc;
pub mod iso8601;
pub mod middlewares;
pub mod models;
pub mod oauth;
pub mod realms;
pub mod routes;
pub mod snowflake_id;
pub mod telemetry;
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
    provider_name: String,
    provider_icon: String,
    error: Option<ConnectionError>,
}

/// Third-party login error template
#[derive(TemplateOnce)]
#[template(path = "external_auth.stpl")]
pub struct ExternalAuthTemplate {
    provider_name: String,
    provider_icon: String,
    error: ExternalAuthError,
}

/// Add external account page template
#[derive(TemplateOnce)]
#[template(path = "add_account.stpl")]
pub struct AddAccountTemplate {
    provider_name: String,
    provider_icon: String,
    error: Option<AddAccountError>,
}

/// Unsubscribe page template
#[derive(TemplateOnce)]
#[template(path = "unsubscribe.stpl")]
pub struct UnsubscribeTemplate {
    message: String,
}

/// Application state
pub struct AppState {
    /// Environment configuration
    pub config: config::Config,
    /// Redis connection pool
    pub redis: RedisPool,
    /// Lapin RabbitMQ connection pool
    pub lapin: LapinPool,
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
    /// Reqwest client instance configured to not follow redirects due to the risk of SSRF attacks.
    pub oauth_client: reqwest::Client,
    /// OAuth client map
    pub oauth_client_map: OAuthClientMap,
}

/// OAuth client instances.
pub struct OAuthClientMap {
    youtube: OAuthClient,
    github: OAuthClient,
    spotify: OAuthClient,
    discord: OAuthClient,
    dribbble: OAuthClient,
    google: OAuthClient,
    /// Google OAuth client for connecting Google accounts to existing Storiny accounts.
    google_alt: OAuthClient,
}

/// Returns the behavior version for AWS services.
pub fn get_aws_behavior_version() -> BehaviorVersion {
    BehaviorVersion::v2024_03_28()
}

/// Returns the region for AWS services.
pub fn get_aws_region() -> Region {
    Region::new("us-east-1")
}
