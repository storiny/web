use super::assert_response_body_text;
use crate::error::ToastErrorResponse;
use actix_web::dev::ServiceResponse;

/// Asserts toast error response message on a service response.
///
/// * `res` - The service response.
/// * `err_message` - The toast error message string.
pub async fn assert_toast_error_response(res: ServiceResponse, err_message: &str) {
    assert_response_body_text(
        res,
        &serde_json::to_string(&ToastErrorResponse::new(None, err_message)).unwrap_or_default(),
    )
    .await;
}
