use actix_web::{
    http::StatusCode,
    HttpResponse,
    ResponseError,
};
use serde::Serialize;
use std::fmt::{
    Display,
    Formatter,
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

impl Into<AppError> for FormErrorResponse {
    fn into(self) -> AppError {
        AppError::FormError(self)
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
#[derive(Debug, Serialize)]
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

impl Into<AppError> for ToastErrorResponse {
    fn into(self) -> AppError {
        AppError::ToastError(self)
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
    /// Internal server error.
    InternalError,
    /// The error raised due to bad data sent by the client.
    ClientError(String),
    /// The [ToastErrorResponse] variant.
    ToastError(ToastErrorResponse),
    /// The [FormErrorResponse] variant.
    FormError(FormErrorResponse),
}

impl Display for AppError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}

impl ResponseError for AppError {
    /// Returns the HTTP [StatusCode] for the error.
    fn status_code(&self) -> StatusCode {
        match &*self {
            AppError::InternalError | AppError::SqlxError(_) | AppError::RedisPoolError(_) => {
                StatusCode::INTERNAL_SERVER_ERROR
            }
            AppError::ClientError(_) => StatusCode::BAD_REQUEST,
            AppError::ToastError(error) => error.status_code.clone(),
            AppError::FormError(error) => error.status_code.clone(),
        }
    }

    /// Returns the [HttpResponse] for the error.
    fn error_response(&self) -> HttpResponse {
        let mut response_builder = HttpResponse::build(self.status_code());

        match &*self {
            AppError::InternalError | AppError::SqlxError(_) | AppError::RedisPoolError(_) => {
                response_builder.body("Internal server error")
            }
            AppError::ClientError(message) => response_builder.body(message.to_string()),
            AppError::ToastError(error) => response_builder.json(error),
            AppError::FormError(error) => response_builder.json(error),
        }
    }
}

impl Into<AppError> for std::str {
    fn into(self) -> AppError {
        AppError::ClientError(self.to_string())
    }
}

impl Into<AppError> for String {
    fn into(self) -> AppError {
        AppError::ClientError(self)
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
    /// The user must verify its password before proceeding. The user must also return the access
    /// token with the verification request.
    VerifyPassword(String),
    /// The user provided an invalid password.
    InvalidPassword,
    /// The user provided an invalid access token during verification.
    InvalidAccessToken,
    /// Other connection error.
    Other(String),
}
