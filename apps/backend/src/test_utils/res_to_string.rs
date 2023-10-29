use actix_http::body::to_bytes;
use actix_web::dev::ServiceResponse;

/// Converts the response body to string.
///
/// * `res` - The service response.
pub async fn res_to_string(res: ServiceResponse) -> String {
    let bytes = to_bytes(res.into_body()).await.unwrap().to_vec();
    String::from_utf8(bytes).unwrap()
}
