#[path = "session/config.rs"]
pub mod config;

#[path = "session/middleware.rs"]
mod middleware;

#[path = "session/session.rs"]
mod session;

#[path = "session/session_ext.rs"]
mod session_ext;

#[path = "session/redis.rs"]
pub mod storage;

#[path = "session/interface.rs"]
pub mod interface;

#[path = "session/session_key.rs"]
pub mod session_key;

#[path = "session/utils.rs"]
pub mod utils;

pub use self::{
    middleware::SessionMiddleware,
    session::{
        Session,
        SessionStatus,
    },
    session_ext::SessionExt,
};

#[cfg(test)]
pub mod tests {
    use actix_web::cookie::Key;

    /// Generate a random cookie signing/encryption key.
    pub fn key() -> Key {
        Key::generate()
    }
}
