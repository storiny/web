use serde::Deserialize;
use validator::Validate;

pub mod youtube;

#[derive(Deserialize, Validate)]
pub struct AuthRequest {
    pub code: String,
    pub state: String,
    pub scope: String,
}

/// An error raised during the processing of the connection.
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
