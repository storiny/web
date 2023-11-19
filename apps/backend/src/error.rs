use actix_web::{
    HttpResponse,
    ResponseError,
};
use serde::Serialize;
use std::fmt::{
    Display,
    Formatter,
};

/// JSON form error response
#[derive(Debug, Serialize)]
pub struct FormErrorResponse {
    pub errors: Vec<(String, String)>,
    pub r#type: String,
}

impl FormErrorResponse {
    pub fn new(errors: Vec<(&str, &str)>) -> Self {
        Self {
            r#type: "form".to_string(),
            errors: errors
                .iter()
                .map(|(field, message)| (field.to_string(), message.to_string()))
                .collect(),
        }
    }

    pub fn from_errors(errors: Vec<(String, String)>) -> Self {
        Self {
            r#type: "form".to_string(),
            errors,
        }
    }
}

/// Custom JSON error response for validator
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

/// JSON toast error response
#[derive(Debug, Serialize)]
pub struct ToastErrorResponse {
    pub error: String,
    pub r#type: String,
}

impl ToastErrorResponse {
    pub fn new(error: &str) -> Self {
        Self {
            r#type: "toast".to_string(),
            error: error.to_string(),
        }
    }
}

/// Database errors.
#[derive(Debug)]
pub struct AppError(sqlx::Error);

impl Display for AppError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "Application error: {}", self.0)
    }
}

impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        HttpResponse::InternalServerError().finish()
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        AppError(err)
    }
}
