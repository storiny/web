#![forbid(unsafe_code)]
#[cfg(target_has_atomic = "ptr")]
//
use crate::error::ExternalAuthError;
use aws_config::{
    BehaviorVersion,
    Region,
};
use maxminddb::Reader;
use oauth2::basic::BasicClient;
use routes::oauth::ConnectionError;
use sailfish::TemplateOnce;
use sqlx::{
    Pool,
    Postgres,
};
use user_agent_parser::UserAgentParser;

// Aliases
pub use aws_sdk_s3::Client as S3Client;
pub use aws_sdk_sesv2::Client as SesClient;
pub use deadpool_redis::Pool as RedisPool;

pub mod alpha_identity;
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

/// Returns the behavior version for AWS services.
pub fn get_aws_behavior_version() -> BehaviorVersion {
    BehaviorVersion::v2023_11_09()
}

/// Returns the region for AWS services.
pub fn get_aws_region() -> Region {
    Region::new("us-east-1")
}

/// Snowflake ID serializer and deserializer. This enables the deserialization of Snowflake IDs
/// from an integer or string value, as well as the serialization of Snowflake IDs into a string
/// value to prevent the big-int values from losing precision when they are sent to the client.
pub mod snowflake_id {
    use serde::{
        de,
        Deserialize,
        Deserializer,
        Serializer,
    };
    use std::fmt;

    pub fn serialize<T, S>(value: &T, serializer: S) -> Result<S::Ok, S::Error>
    where
        T: fmt::Display,
        S: Serializer,
    {
        serializer.collect_str(value)
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<i64, D::Error>
    where
        D: Deserializer<'de>,
    {
        #[derive(Deserialize)]
        #[serde(untagged)]
        enum StringOrInt {
            String(String),
            Int(i64),
        }

        match StringOrInt::deserialize(deserializer)? {
            StringOrInt::String(val) => val.parse().map_err(de::Error::custom),
            StringOrInt::Int(int) => Ok(int),
        }
    }

    pub mod option {
        use serde::{
            de,
            Deserialize,
            Deserializer,
            Serializer,
        };
        use std::fmt;

        pub fn serialize<T, S>(value: &T, serializer: S) -> Result<S::Ok, S::Error>
        where
            T: fmt::Display,
            S: Serializer,
        {
            serializer.collect_str(value)
        }

        pub fn deserialize<'de, D>(deserializer: D) -> Result<Option<i64>, D::Error>
        where
            D: Deserializer<'de>,
        {
            #[derive(Deserialize)]
            #[serde(untagged)]
            enum StringOrIntOrNull {
                String(String),
                Int(i64),
                None,
            }

            match StringOrIntOrNull::deserialize(deserializer)? {
                StringOrIntOrNull::String(val) => {
                    let parsed: Result<i64, _> = val.parse().map_err(de::Error::custom);
                    match parsed {
                        Ok(value) => Ok(Some(value)),
                        Err(error) => Err(error),
                    }
                }
                StringOrIntOrNull::Int(int) => Ok(Some(int)),
                StringOrIntOrNull::None => Ok(None),
            }
        }
    }
}
