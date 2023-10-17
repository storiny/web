use actix::Addr;
use actix_redis::RedisActor;
use maxminddb::Reader;
use rusoto_ses::SesClient;
use sailfish::TemplateOnce;
use sqlx::{
    Pool,
    Postgres,
};
use user_agent_parser::UserAgentParser;

#[path = "error.rs"]
pub mod error;

#[path = "models.rs"]
pub mod models;

#[path = "routes.rs"]
pub mod routes;

#[path = "utils.rs"]
pub mod utils;

#[path = "middleware.rs"]
pub mod middleware;

#[path = "constants.rs"]
pub mod constants;

/// Index page template
#[derive(TemplateOnce)]
#[template(path = "index.stpl")]
pub struct IndexTemplate {
    req_id: String,
}

/// Application state
pub struct AppState {
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
}

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
