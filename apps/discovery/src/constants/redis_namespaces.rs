use serde::Serialize;
use strum::Display;

/// Redis cache namespace prefix. Refer to `redis_namespaces.md` at the project root.
#[derive(Display, Debug, Serialize)]
pub enum RedisNamespace {
    #[strum(serialize = "d:l")]
    RateLimit,
}
