use serde::Deserialize;
use std::{
    fmt,
    fmt::Formatter,
};
use validator::Validate;

#[derive(Deserialize, Validate)]
pub struct AuthRequest {
    pub code: String,
    pub state: String,
}

/// The error raised during the processing of the connection.
#[allow(dead_code)]
#[derive(Debug)]
pub enum ConnectionError {
    /// Insufficient scopes were returned on the callback endpoint.
    InsufficientScopes,
    /// The CSRF token is tampered.
    StateMismatch,
    /// A duplicate entry already exists in the database.
    Duplicate,
    /// Other connection error.
    Other(String),
}

impl From<sqlx::Error> for ConnectionError {
    fn from(value: sqlx::Error) -> Self {
        ConnectionError::Other(value.to_string())
    }
}

impl fmt::Display for ConnectionError {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

pub mod discord;
pub mod dribbble;
pub mod github;
pub mod spotify;
pub mod youtube;
