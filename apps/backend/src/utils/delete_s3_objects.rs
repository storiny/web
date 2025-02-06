use crate::S3Client;
use anyhow::anyhow;
use aws_sdk_s3::{
    config::http::HttpRequest,
    types::{
        Delete,
        ObjectIdentifier,
    },
};
use base64::{
    Engine as _,
    engine::general_purpose,
};

/// Mutates the request to insert a Content-MD5 header and remove any existing flexible checksum
/// headers. TODO: Remove once fixed https://github.com/awslabs/aws-sdk-rust/issues/1240#issuecomment-2635024286
pub fn calculate_md5_checksum_and_remove_other_checksums(http_request: &mut HttpRequest) {
    // Remove the flexibile checksum headers
    let remove_headers = http_request.headers().clone();
    let remove_headers: Vec<(&str, &str)> = remove_headers
        .iter()
        .filter(|(name, _)| {
            name.starts_with("x-amz-checksum") || name.starts_with("x-amz-sdk-checksum")
        })
        .collect();

    for (name, _) in remove_headers {
        http_request.headers_mut().remove(name);
    }

    // Check if the body is present if it isn't (streaming request) we skip adding the header
    if let Some(bytes) = http_request.body().bytes() {
        let md5 = md5::compute(bytes);
        let checksum_value = general_purpose::STANDARD.encode(md5.as_slice());

        http_request
            .headers_mut()
            .append("Content-MD5", checksum_value);
    }
}

/// Deletes the S3 objects in the specified bucket using the provided keys. Returns the number of
/// objects that were successfully deleted.
///
/// * `client` - The S3 client instance.
/// * `bucket_name` - The name of the target bucket containing the objects.
/// * `keys` - The key of objects to delete.
pub async fn delete_s3_objects(
    client: &S3Client,
    bucket_name: &str,
    keys: Vec<String>,
) -> anyhow::Result<u32> {
    let objects_to_delete = keys
        .iter()
        .filter_map(|key| ObjectIdentifier::builder().key(key.clone()).build().ok())
        .collect::<Vec<_>>();

    if objects_to_delete.is_empty() {
        return Ok(0);
    }

    let delete = Delete::builder()
        .set_objects(Some(objects_to_delete))
        .build()
        .map_err(|error| anyhow!("unable to build the delete object: {:?}", error))?;

    // Delete the objects
    let delete_result = client
        .delete_objects()
        .bucket(bucket_name)
        .delete(delete)
        // TODO: Remove once fixed https://github.com/awslabs/aws-sdk-rust/issues/1240#issuecomment-2635024286
        .customize()
        .mutate_request(calculate_md5_checksum_and_remove_other_checksums)
        .send()
        .await
        .map_err(|error| error.into_service_error())
        .map_err(|error| anyhow!("unable to delete objects: {:?}", error))?;

    Ok(delete_result.deleted().len() as u32)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        constants::buckets::S3_BASE_BUCKET,
        test_utils::{
            TestContext,
            get_s3_client,
        },
        utils::delete_s3_objects_using_prefix::delete_s3_objects_using_prefix,
    };
    use aws_sdk_s3::operation::get_object::GetObjectError;
    use storiny_macros::test_context;

    struct LocalTestContext {
        s3_client: S3Client,
    }

    #[async_trait::async_trait]
    impl TestContext for LocalTestContext {
        async fn setup() -> LocalTestContext {
            LocalTestContext {
                s3_client: get_s3_client().await,
            }
        }

        async fn teardown(self) {
            delete_s3_objects_using_prefix(
                &self.s3_client,
                S3_BASE_BUCKET,
                Some("test-".to_string()),
                None,
            )
            .await
            .unwrap();
        }
    }

    mod serial {
        use super::*;

        #[test_context(LocalTestContext)]
        #[tokio::test]
        async fn can_delete_a_single_object(ctx: &mut LocalTestContext) {
            let s3_client = &ctx.s3_client;

            // Insert some objects.
            let result = s3_client
                .put_object()
                .bucket(S3_BASE_BUCKET)
                .key("guava")
                .send()
                .await;

            assert!(result.is_ok());

            let result = s3_client
                .put_object()
                .bucket(S3_BASE_BUCKET)
                .key("apple")
                .send()
                .await;

            assert!(result.is_ok());

            let result = delete_s3_objects(s3_client, S3_BASE_BUCKET, vec!["guava".to_string()])
                .await
                .unwrap();

            assert_eq!(result, 1_u32);

            // Object should get deleted.
            let result = s3_client
                .get_object()
                .bucket(S3_BASE_BUCKET)
                .key("guava")
                .send()
                .await
                .map_err(|error| error.into_service_error());

            assert!(matches!(result.unwrap_err(), GetObjectError::NoSuchKey(_)));

            // Other objects must still be present.
            let result = s3_client
                .get_object()
                .bucket(S3_BASE_BUCKET)
                .key("apple")
                .send()
                .await;

            assert!(result.is_ok());
        }

        #[test_context(LocalTestContext)]
        #[tokio::test]
        async fn can_delete_multiple_objects(ctx: &mut LocalTestContext) {
            let s3_client = &ctx.s3_client;

            // Insert some objects.
            let result = s3_client
                .put_object()
                .bucket(S3_BASE_BUCKET)
                .key("guava")
                .send()
                .await;

            assert!(result.is_ok());

            let result = s3_client
                .put_object()
                .bucket(S3_BASE_BUCKET)
                .key("apple")
                .send()
                .await;

            assert!(result.is_ok());

            let result = delete_s3_objects(
                s3_client,
                S3_BASE_BUCKET,
                vec!["guava".to_string(), "apple".to_string()],
            )
            .await
            .unwrap();

            assert_eq!(result, 2_u32);

            // Objects should get deleted.
            let result = s3_client
                .get_object()
                .bucket(S3_BASE_BUCKET)
                .key("guava")
                .send()
                .await
                .map_err(|error| error.into_service_error());

            assert!(matches!(result.unwrap_err(), GetObjectError::NoSuchKey(_)));

            let result = s3_client
                .get_object()
                .bucket(S3_BASE_BUCKET)
                .key("apple")
                .send()
                .await
                .map_err(|error| error.into_service_error());

            assert!(matches!(result.unwrap_err(), GetObjectError::NoSuchKey(_)));
        }
    }
}
