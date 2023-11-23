use crate::config::get_app_config;
use rusoto_s3::S3Client;
use rusoto_signature::Region;

/// Initializes and returns an S3 client instance for tests
pub fn get_s3_client() -> S3Client {
    let config = get_app_config().unwrap();
    S3Client::new(Region::Custom {
        name: "us-east-1".to_string(),
        endpoint: config.minio_endpoint,
    })
}
