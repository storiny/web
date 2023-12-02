use std::{
    error,
    fmt::{
        self,
        Display,
    },
    io,
};

/// The custom IO error type.
#[derive(Debug)]
#[non_exhaustive]
pub struct CustomIoError(pub io::Error);

impl error::Error for CustomIoError {}

impl Display for CustomIoError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Custom IO error: {}", self.0)
    }
}

/// The custom error type.
#[derive(Debug)]
pub enum Error {
    /// Serde JSON error.
    Serde(serde_json::Error),
    /// Reqwest HTTP request error.
    Reqwest(reqwest::Error),
    /// URL parsing error.
    Url(url::ParseError),
    /// Custom IO error.
    CustomIo(CustomIoError),
}

impl error::Error for Error {}

impl From<serde_json::Error> for Error {
    fn from(err: serde_json::Error) -> Self {
        Self::Serde(err)
    }
}

impl From<reqwest::Error> for Error {
    fn from(err: reqwest::Error) -> Self {
        Self::Reqwest(err)
    }
}

impl From<url::ParseError> for Error {
    fn from(err: url::ParseError) -> Self {
        Self::Url(err)
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
            Error::Reqwest(err) => err.fmt(f),
            Error::Url(err) => err.fmt(f),
            Error::CustomIo(err) => err.fmt(f),
        }
    }
}
