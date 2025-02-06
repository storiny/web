use crate::{
    S3Client,
    config::get_app_config,
    get_aws_behavior_version,
    get_aws_region,
};

/// Initializes and returns an S3 client instance for tests
pub async fn get_s3_client() -> S3Client {
    let config = get_app_config().unwrap();
    let shared_aws_config = aws_config::defaults(get_aws_behavior_version())
        .region(get_aws_region())
        .load()
        .await;

    S3Client::from_conf({
        let config_builder = aws_sdk_s3::config::Builder::from(&shared_aws_config);

        config_builder
            .endpoint_url(config.minio_endpoint)
            // Minio requires `force_path_style` set to `true`.
            .force_path_style(true)
            .build()
    })
}
