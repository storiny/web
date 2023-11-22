use anyhow::anyhow;
use async_recursion::async_recursion;
use rusoto_s3::{
    Delete,
    DeleteObjectsRequest,
    ListObjectsV2Request,
    ObjectIdentifier,
    S3Client,
    S3,
};

/// Deletes all the S3 objects with the provided prefix.
///
/// * `client` - The S3 client instance.
/// * `bucket_name` - The name of the target bucket containing the objects.
/// * `prefix` - The string prefix of the object keys.
/// * `continuation_token` - (Private) A token used during recursion if there are more than 1000
///   keys with the provided prefix.
#[async_recursion]
pub async fn delete_s3_objects_with_prefix(
    client: &S3Client,
    bucket_name: &str,
    prefix: &str,
    continuation_token: Option<String>,
) -> anyhow::Result<()> {
    let list_objects_result = client
        .list_objects_v2(ListObjectsV2Request {
            bucket: bucket_name.to_string(),
            continuation_token,
            max_keys: Some(1_000_i64),
            prefix: Some(prefix.to_string()),
            ..Default::default()
        })
        .await
        .map_err(|err| anyhow!("Unable to list objects: {:?}", err))?;

    let mut objects_to_delete: Vec<ObjectIdentifier> = vec![];

    if let Some(contents) = list_objects_result.contents {
        for obj in contents {
            if let Some(obj_key) = obj.key {
                objects_to_delete.push(ObjectIdentifier {
                    key: obj_key,
                    ..Default::default()
                });
            }
        }
    }

    // Delete the objects
    client
        .delete_objects(DeleteObjectsRequest {
            bucket: bucket_name.to_string(),
            bypass_governance_retention: Some(true),
            delete: Delete {
                objects: objects_to_delete,
                quiet: Some(true), // Disable verbose response
            },
            ..Default::default()
        })
        .await
        .map_err(|err| anyhow!("Unable to delete objects: {:?}", err))?;

    // Recurse until there are no more keys left
    if list_objects_result.is_truncated.unwrap_or_default() {
        delete_s3_objects_with_prefix(
            client,
            bucket_name,
            prefix,
            list_objects_result.next_continuation_token,
        )
        .await?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        config::Config,
        constants::buckets::S3_BASE_BUCKET,
    };
    use dotenv::dotenv;
    use rusoto_signature::Region;

    /// Returns an S3 client instance.
    fn get_s3_client() -> S3Client {
        dotenv().ok();

        let config = envy::from_env::<Config>().unwrap();
        S3Client::new(Region::Custom {
            name: "us-east-1".to_string(),
            endpoint: config.minio_endpoint,
        })
    }

    #[tokio::test]
    async fn can_delete_objects_with_prefix() {
        let s3_client = get_s3_client();
        let result =
            delete_s3_objects_with_prefix(&s3_client, S3_BASE_BUCKET, "guava/", None).await;

        assert!(result.is_ok());
    }
}
