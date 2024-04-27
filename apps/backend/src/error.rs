use crate::{
    middlewares::identity::error::GetIdentityError,
    utils::incr_resource_lock_attempts::IncrResourceLockError,
};
use actix_web::{
    http::StatusCode,
    HttpResponse,
    ResponseError,
};
use serde::{
    Deserialize,
    Serialize,
};
use std::{
    fmt,
    fmt::{
        Display,
        Formatter,
    },
};

// Form error

/// The JSON form error response object.
#[derive(Debug, Serialize)]
pub struct FormErrorResponse {
    /// The form errors. First element of the tuple is the form field and the second element is the
    /// error message.
    pub errors: Vec<(String, String)>,
    /// The type of the error.
    pub r#type: String,
    /// The HTTP [StatusCode] for this error.
    #[serde(skip)]
    pub status_code: StatusCode,
}

impl FormErrorResponse {
    /// Ctor
    ///
    /// * `status_code` - The optional HTTP [StatusCode] for this error. Defaults to
    ///   [StatusCode::BAD_REQUEST].
    /// * `errors` - The error data.
    pub fn new(status_code: Option<StatusCode>, errors: Vec<(&str, &str)>) -> Self {
        Self {
            r#type: "form".to_string(),
            errors: errors
                .iter()
                .map(|(field, message)| (field.to_string(), message.to_string()))
                .collect(),
            status_code: status_code.unwrap_or(StatusCode::BAD_REQUEST),
        }
    }

    /// Creates a [FormErrorResponse] from `Vec(String, String)` with the default status code
    /// ([StatusCode::BAD_REQUEST]).
    ///
    /// * `errors` - The error data.
    pub fn from_errors(errors: Vec<(String, String)>) -> Self {
        Self {
            r#type: "form".to_string(),
            errors,
            status_code: StatusCode::BAD_REQUEST,
        }
    }
}

impl From<&validator::ValidationErrors> for FormErrorResponse {
    fn from(error: &validator::ValidationErrors) -> Self {
        FormErrorResponse::from_errors(
            error
                .field_errors()
                .iter()
                .filter_map(|(&field, value)| {
                    if let Some(error_message) = value.iter().next() {
                        return Some((field.to_owned(), error_message.to_string()));
                    }

                    None
                })
                .collect(),
        )
    }
}

// Toast error

/// The JSON toast error response object.
#[derive(Debug, Serialize, Deserialize)]
pub struct ToastErrorResponse {
    /// The error message.
    pub error: String,
    /// The type of the error.
    pub r#type: String,
    /// The HTTP [StatusCode] for this error.
    #[serde(skip)]
    pub status_code: StatusCode,
}

impl ToastErrorResponse {
    /// Ctor
    ///
    /// * `status_code` - The optional HTTP [StatusCode] for this error. Defaults to
    ///   [StatusCode::BAD_REQUEST].
    /// * `error` - The error message.
    pub fn new(status_code: Option<StatusCode>, error: &str) -> Self {
        Self {
            r#type: "toast".to_string(),
            error: error.to_string(),
            status_code: status_code.unwrap_or(StatusCode::BAD_REQUEST),
        }
    }
}

// Application error

/// The application error object.
#[derive(Debug)]
pub enum AppError {
    /// The error raised by [sqlx].
    SqlxError(sqlx::Error),
    /// The error raised by [deadpool_redis] when trying to acquire a connection from the pool.
    RedisPoolError(deadpool_redis::PoolError),
    /// The error raised by [deadpool_lapin] when trying to acquire a connection from the pool.
    LapinPoolError(deadpool_lapin::PoolError),
    /// The error raised by [deadpool_lapin::lapin] crate.
    LapinError(deadpool_lapin::lapin::Error),
    /// Internal server error. The string value of this variant is not sent to the client.
    InternalError(String),
    /// The error raised due to bad data sent by the client. The first element of the tuple is the
    /// HTTP [StatusCode] and the second element is the
    /// string message that is sent to the client.
    ///
    /// # Caution
    ///
    /// The string value of this variant is sent to the client. It must not contain any sensitive
    /// details.
    ClientError(StatusCode, String),
    /// The [ToastErrorResponse] variant.
    ToastError(ToastErrorResponse),
    /// The [FormErrorResponse] variant.
    FormError(FormErrorResponse),
}

impl AppError {
    /// Constructs a new [AppError::ClientError] variant with the default [StatusCode::BAD_REQUEST]
    /// status code using the provided message.
    ///
    /// * `message` - The message string for the error.
    pub fn new_client_error(message: &str) -> Self {
        AppError::ClientError(StatusCode::BAD_REQUEST, message.to_string())
    }

    /// Constructs a new [AppError::ClientError] variant with the provided status code and message.
    ///
    /// * `status_code` - The HTTP [StatusCode] for the error.
    /// * `message` - The message string for the error.
    pub fn new_client_error_with_status(status_code: StatusCode, message: &str) -> Self {
        AppError::ClientError(status_code, message.to_string())
    }
}

impl Display for AppError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}

impl ResponseError for AppError {
    /// Returns the HTTP [StatusCode] for the error.
    fn status_code(&self) -> StatusCode {
        match self {
            AppError::InternalError(_)
            | AppError::SqlxError(_)
            | AppError::RedisPoolError(_)
            | AppError::LapinPoolError(_)
            | AppError::LapinError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::ClientError(status_code, _) => *status_code,
            AppError::ToastError(error) => error.status_code,
            AppError::FormError(error) => error.status_code,
        }
    }

    /// Returns the [HttpResponse] for the error.
    fn error_response(&self) -> HttpResponse {
        let mut response_builder = HttpResponse::build(self.status_code());

        match self {
            AppError::InternalError(_)
            | AppError::SqlxError(_)
            | AppError::RedisPoolError(_)
            | AppError::LapinPoolError(_)
            | AppError::LapinError(_) => response_builder.body("Internal server error"),
            AppError::ClientError(_, message) => response_builder.body(message.to_string()),
            AppError::ToastError(error) => response_builder.json(error),
            AppError::FormError(error) => response_builder.json(error),
        }
    }
}

// Allows creating simple client errors from a string slice.
impl From<&str> for AppError {
    fn from(value: &str) -> Self {
        AppError::new_client_error(value)
    }
}

// Allows creating simple client errors from a string value.
impl From<String> for AppError {
    fn from(value: String) -> Self {
        AppError::new_client_error(&value)
    }
}

// This can be raised when the identity cannot be fetched from the Redis cache. We simply return an
// internal server error response to the client.
impl From<GetIdentityError> for AppError {
    fn from(error: GetIdentityError) -> Self {
        AppError::InternalError(error.to_string())
    }
}

impl From<anyhow::Error> for AppError {
    fn from(error: anyhow::Error) -> Self {
        AppError::InternalError(error.to_string())
    }
}

impl From<sqlx::Error> for AppError {
    fn from(error: sqlx::Error) -> Self {
        AppError::SqlxError(error)
    }
}

impl From<deadpool_redis::PoolError> for AppError {
    fn from(error: deadpool_redis::PoolError) -> Self {
        AppError::RedisPoolError(error)
    }
}

impl From<deadpool_lapin::PoolError> for AppError {
    fn from(error: deadpool_lapin::PoolError) -> Self {
        AppError::LapinPoolError(error)
    }
}

impl From<deadpool_lapin::lapin::Error> for AppError {
    fn from(error: deadpool_lapin::lapin::Error) -> Self {
        AppError::LapinError(error)
    }
}

impl From<ToastErrorResponse> for AppError {
    fn from(error: ToastErrorResponse) -> Self {
        AppError::ToastError(error)
    }
}

impl From<FormErrorResponse> for AppError {
    fn from(error: FormErrorResponse) -> Self {
        AppError::FormError(error)
    }
}

impl From<IncrResourceLockError> for AppError {
    fn from(error: IncrResourceLockError) -> Self {
        AppError::InternalError(format!(
            "unable to increment to resource lock attempts: {error:?}"
        ))
    }
}

// External authentication error

/// An error raised during authentication flow originated from a third-party service, such as
/// "Continue with Google".
#[derive(Debug)]
pub enum ExternalAuthError {
    /// Insufficient scopes were returned on the callback endpoint.
    InsufficientScopes,
    /// The CSRF token is tampered.
    StateMismatch,
    /// The user associated with the third-party account is deleted.
    UserDeleted,
    /// The user associated with the third-party account is deactivated.
    UserDeactivated,
    /// The user associated with the third-party account is suspended.
    UserSuspended,
    /// The email associated with the vendor account is already in use by some other Storiny
    /// account.
    DuplicateEmail,
    /// Other connection error.
    Other(String),
}

impl From<sqlx::Error> for ExternalAuthError {
    fn from(value: sqlx::Error) -> Self {
        ExternalAuthError::Other(value.to_string())
    }
}

impl fmt::Display for ExternalAuthError {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

// Add external account error

/// An error raised while adding an external login account (such as "Google login") to a Storiny
/// account.
#[derive(Debug)]
pub enum AddAccountError {
    /// Insufficient scopes were returned on the callback endpoint.
    InsufficientScopes,
    /// The CSRF token is tampered.
    StateMismatch,
    /// The Storiny account is already connected to a relevant vendor account.
    DuplicateAccount,
    /// The ID of the account returned from the vendor is already associated with another Storiny
    /// account.
    DuplicateVendorID,
    /// The email of the account returned from the vendor is already associated with another
    /// Storiny account.
    DuplicateVendorEmail,
    /// Other connection error.
    Other(String),
}

impl From<sqlx::Error> for AddAccountError {
    fn from(value: sqlx::Error) -> Self {
        AddAccountError::Other(value.to_string())
    }
}

impl fmt::Display for AddAccountError {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}
