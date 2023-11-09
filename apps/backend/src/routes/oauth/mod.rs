use serde::Deserialize;
use validator::Validate;

#[derive(Deserialize, Validate)]
pub struct AuthRequest {
    pub code: String,
    pub state: String,
}

/// An error raised during the processing of the connection.
#[allow(dead_code)]
pub enum ConnectionError {
    /// Insufficient scopes were returned on the callback endpoint
    InsufficientScopes,
    /// The CSRF token is tampered
    StateMismatch,
    /// A duplicate entry already exists in the database
    Duplicate,
    /// Other connection error
    Other,
}

pub mod discord;
pub mod dribbble;
pub mod github;
pub mod spotify;
pub mod youtube;
