use actix_http::body::to_bytes;
use actix_web::dev::ServiceResponse;

/// Asserts text string on a service response body.
///
/// * `res` - The service response.
/// * `expected_text` - The expected body text string.
pub async fn assert_response_body_text(res: ServiceResponse, expected_text: &str) {
    assert_eq!(
        to_bytes(res.into_body()).await.unwrap_or_default(),
        expected_text.to_string()
    );
}
