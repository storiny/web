use derive_more::Display;
use std::{
    collections::HashMap,
    fmt::Display,
};

pub type SessionState = HashMap<String, String>;

// We cannot derive the `Error` implementation using `derive_more` for our custom errors:
// `derive_more`'s `#[error(source)]` attribute requires the source implement the `Error` trait,
// while it's actually enough for it to be able to produce a reference to a dyn Error.

/// Possible failures modes for [`SessionStore::load`].
#[derive(Debug, Display)]
pub enum LoadError {
    /// Failed to deserialize session state.
    #[display(fmt = "Failed to deserialize session state")]
    Deserialization(anyhow::Error),
    /// Something went wrong while retrieving the session state.
    #[display(fmt = "Something went wrong while retrieving the session state")]
    Other(anyhow::Error),
}

impl std::error::Error for LoadError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            Self::Deserialization(err) => Some(err.as_ref()),
            Self::Other(err) => Some(err.as_ref()),
        }
    }
}

/// Possible failures modes for [`SessionStore::save`].
#[derive(Debug, Display)]
pub enum SaveError {
    /// Failed to serialize session state.
    #[display(fmt = "Failed to serialize session state")]
    Serialization(anyhow::Error),
    /// Something went wrong while persisting the session state.
    #[display(fmt = "Something went wrong while persisting the session state")]
    Other(anyhow::Error),
}

impl std::error::Error for SaveError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            Self::Serialization(err) => Some(err.as_ref()),
            Self::Other(err) => Some(err.as_ref()),
        }
    }
}

#[derive(Debug, Display)]
/// Possible failures modes for [`SessionStore::update`].
pub enum UpdateError {
    /// Failed to serialize session state.
    #[display(fmt = "Failed to serialize session state")]
    Serialization(anyhow::Error),
    /// Something went wrong while updating the session state.
    #[display(fmt = "Something went wrong while updating the session state.")]
    Other(anyhow::Error),
}

impl std::error::Error for UpdateError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            Self::Serialization(err) => Some(err.as_ref()),
            Self::Other(err) => Some(err.as_ref()),
        }
    }
}
