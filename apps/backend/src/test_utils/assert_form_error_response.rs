use super::assert_response_body_text;
use crate::error::FormErrorResponse;
use actix_web::dev::ServiceResponse;

/// Asserts form error response on a service response.
///
/// * `res` - The service response.
/// * `err_data` - The form error data.
pub async fn assert_form_error_response(res: ServiceResponse, err_data: Vec<(&str, &str)>) {
    assert_response_body_text(
        res,
        &serde_json::to_string(&FormErrorResponse::new(None, err_data)).unwrap_or_default(),
    )
    .await;
}
