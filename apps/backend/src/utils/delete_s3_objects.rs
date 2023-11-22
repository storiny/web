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

/// Deletes all the S3 objects in the specified bucket. Returns the number of objects that were
/// successfully deleted.
///
/// * `client` - The S3 client instance.
/// * `bucket_name` - The name of the target bucket containing the objects.
/// * `prefix` - An optional string prefix to match keys and limit the objects.
/// * `continuation_token` - (Private) A token used during recursion if there are more than 1000
///   keys with the provided prefix.
#[async_recursion]
pub async fn delete_s3_objects(
    client: &S3Client,
    bucket_name: &str,
    prefix: Option<&str>,
    continuation_token: Option<String>,
) -> anyhow::Result<u32> {
    let list_objects_result = client
        .list_objects_v2(ListObjectsV2Request {
            bucket: bucket_name.to_string(),
            continuation_token,
            max_keys: Some(1_000_i64),
            prefix: prefix.and_then(|value| Some(value.to_string())),
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

    if objects_to_delete.is_empty() {
        return Ok(0);
    }

    // Delete the objects
    let delete_result = client
        .delete_objects(DeleteObjectsRequest {
            bucket: bucket_name.to_string(),
            bypass_governance_retention: Some(true),
            delete: Delete {
                objects: objects_to_delete,
                quiet: Some(false), // Return all the deleted keys
            },
            ..Default::default()
        })
        .await
        .map_err(|err| anyhow!("Unable to delete objects: {:?}", err))?;

    let mut num_deleted = match delete_result.deleted {
        Some(deleted) => deleted.len() as u32,
        None => 0,
    };

    // Recurse until there are no more keys left
    if list_objects_result.is_truncated.unwrap_or_default() {
        num_deleted = num_deleted
            + delete_s3_objects(
                client,
                bucket_name,
                prefix,
                list_objects_result.next_continuation_token,
            )
            .await?;
    }

    Ok(num_deleted)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        config::Config,
        constants::buckets::S3_BASE_BUCKET,
    };
    use dotenv::dotenv;
    use futures::future;
    use rusoto_core::RusotoError;
    use rusoto_s3::{
        GetObjectError,
        GetObjectRequest,
        PutObjectRequest,
    };
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

        // Insert an object
        let result = s3_client
            .put_object(PutObjectRequest {
                bucket: S3_BASE_BUCKET.to_string(),
                key: "fruits/guava".to_string(),
                ..Default::default()
            })
            .await;

        assert!(result.is_ok());

        let result = delete_s3_objects(&s3_client, S3_BASE_BUCKET, Some("fruits/"), None)
            .await
            .unwrap();

        assert_eq!(result, 1_u32);

        // Object should get deleted
        let result = s3_client
            .get_object(GetObjectRequest {
                bucket: S3_BASE_BUCKET.to_string(),
                key: "fruits/guava".to_string(),
                ..Default::default()
            })
            .await;

        assert!(matches!(
            result.unwrap_err(),
            RusotoError::Service(GetObjectError::NoSuchKey(..))
        ));
    }

    #[tokio::test]
    async fn can_delete_more_than_1000_objects_with_prefix() {
        let s3_client = get_s3_client();
        let mut put_futures = vec![];

        // Insert 1200 objects
        for i in 0..1_200 {
            put_futures.push(s3_client.put_object(PutObjectRequest {
                bucket: S3_BASE_BUCKET.to_string(),
                key: format!("integers/{}", i),
                ..Default::default()
            }));
        }

        future::join_all(put_futures).await;

        let result = delete_s3_objects(&s3_client, S3_BASE_BUCKET, Some("integers/"), None)
            .await
            .unwrap();

        assert_eq!(result, 1_200_u32);
    }

    #[tokio::test]
    async fn should_not_delete_objects_not_starting_with_the_prefix() {
        let s3_client = get_s3_client();

        // Insert an object
        let result = s3_client
            .put_object(PutObjectRequest {
                bucket: S3_BASE_BUCKET.to_string(),
                key: "trees/oak".to_string(),
                ..Default::default()
            })
            .await;

        assert!(result.is_ok());

        // Insert another object with a different prefix
        let result = s3_client
            .put_object(PutObjectRequest {
                bucket: S3_BASE_BUCKET.to_string(),
                key: "beverages/latte".to_string(),
                ..Default::default()
            })
            .await;

        assert!(result.is_ok());

        let result = delete_s3_objects(&s3_client, S3_BASE_BUCKET, Some("trees/"), None)
            .await
            .unwrap();

        assert_eq!(result, 1_u32);
    }
}
