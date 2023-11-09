use actix::Addr;
use actix_redis::RedisActor;
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
    /// Redis connection instance
    pub redis: Option<Addr<RedisActor>>,
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

// GRPC

pub mod comment_def {
    pub mod v1 {
        include!("../proto/comment_def.v1.rs");
        include!("../proto/comment_def.v1.serde.rs");
    }
}

pub mod connection_def {
    pub mod v1 {
        include!("../proto/connection_def.v1.rs");
        include!("../proto/connection_def.v1.serde.rs");
    }
}

pub mod connection_settings_def {
    pub mod v1 {
        include!("../proto/connection_settings_def.v1.rs");
        include!("../proto/connection_settings_def.v1.serde.rs");
    }
}

pub mod credential_settings_def {
    pub mod v1 {
        include!("../proto/credential_settings_def.v1.rs");
        include!("../proto/credential_settings_def.v1.serde.rs");
    }
}

pub mod login_activity_def {
    pub mod v1 {
        include!("../proto/login_activity_def.v1.rs");
        include!("../proto/login_activity_def.v1.serde.rs");
    }
}

pub mod notification_settings_def {
    pub mod v1 {
        include!("../proto/notification_settings_def.v1.rs");
        include!("../proto/notification_settings_def.v1.serde.rs");
    }
}

pub mod privacy_settings_def {
    pub mod v1 {
        include!("../proto/privacy_settings_def.v1.rs");
        include!("../proto/privacy_settings_def.v1.serde.rs");
    }
}

pub mod profile_def {
    pub mod v1 {
        include!("../proto/profile_def.v1.rs");
        include!("../proto/profile_def.v1.serde.rs");
    }
}

pub mod response_def {
    pub mod v1 {
        include!("../proto/response_def.v1.rs");
        include!("../proto/response_def.v1.serde.rs");
    }
}

pub mod story_def {
    pub mod v1 {
        include!("../proto/story_def.v1.rs");
        include!("../proto/story_def.v1.serde.rs");
    }
}

pub mod tag_def {
    pub mod v1 {
        include!("../proto/tag_def.v1.rs");
        include!("../proto/tag_def.v1.serde.rs");
    }
}

pub mod token_def {
    pub mod v1 {
        include!("../proto/token_def.v1.rs");
        include!("../proto/token_def.v1.serde.rs");
    }
}

pub mod user_def {
    pub mod v1 {
        include!("../proto/user_def.v1.rs");
        include!("../proto/user_def.v1.serde.rs");
    }
}
