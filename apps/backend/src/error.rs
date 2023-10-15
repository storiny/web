use serde::Serialize;
use std::{
    error,
    fmt::{
        self,
        Display,
    },
    io,
};

/// JSON form error response
#[derive(Debug, Serialize)]
pub struct FormErrorResponse {
    pub errors: Vec<Vec<String>>,
    pub r#type: String,
}

impl FormErrorResponse {
    pub fn new(errors: Vec<Vec<String>>) -> Self {
        Self {
            r#type: "form".to_string(),
            errors,
        }
    }
}

/// Custom JSON error response for validator
impl From<&validator::ValidationErrors> for FormErrorResponse {
    fn from(error: &validator::ValidationErrors) -> Self {
        FormErrorResponse::new(
            error
                .field_errors()
                .iter()
                .filter_map(|(field, value)| {
                    if let Some(error_message) = value.iter().next() {
                        return Some(vec![field.to_string(), error_message.to_string()]);
                    }
                    None
                })
                .collect(),
        )
    }
}

/// JSON toast error response
#[derive(Debug, Serialize)]
pub struct ToastErrorResponse {
    pub error: String,
    pub r#type: String,
}

impl ToastErrorResponse {
    pub fn new(error: String) -> Self {
        Self {
            r#type: "toast".to_string(),
            error,
        }
    }
}

/// Custom IO error type.
#[derive(Debug)]
#[non_exhaustive]
pub struct CustomIoError(pub io::Error);

impl error::Error for CustomIoError {}

impl Display for CustomIoError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Custom IO error: {}", self.0)
    }
}

/// Custom error type.
#[derive(Debug)]
pub enum Error {
    /// Serde JSON error.
    Serde(serde_json::Error),
    /// Custom IO error.
    CustomIo(CustomIoError),
}

impl error::Error for Error {}

impl From<serde_json::Error> for Error {
    fn from(err: serde_json::Error) -> Self {
        Self::Serde(err)
    }
}

impl From<io::Error> for Error {
    fn from(err: io::Error) -> Self {
        Self::CustomIo(CustomIoError(err))
    }
}

impl Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Error::Serde(err) => err.fmt(f),
            Error::CustomIo(err) => err.fmt(f),
        }
    }
}
