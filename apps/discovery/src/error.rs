use actix_web::{
    error::ResponseError,
    http::{
        header::ContentType,
        StatusCode,
    },
    HttpResponse,
};
use derive_more::{
    Display,
    Error,
};

/// Custom error
#[derive(Debug, Display, Error)]
pub enum ServiceError {
    #[display(fmt = "Internal server error")]
    InternalError,

    #[display(fmt = "Bad request")]
    BadClientData,

    #[display(fmt = "Gateway timeout")]
    Timeout,
}

impl ResponseError for ServiceError {
    fn status_code(&self) -> StatusCode {
        match *self {
            ServiceError::InternalError => StatusCode::INTERNAL_SERVER_ERROR,
            ServiceError::BadClientData => StatusCode::BAD_REQUEST,
            ServiceError::Timeout => StatusCode::GATEWAY_TIMEOUT,
        }
    }

    fn error_response(&self) -> HttpResponse {
        HttpResponse::build(self.status_code())
            .insert_header(ContentType::plaintext())
            .body(self.to_string())
    }
}
