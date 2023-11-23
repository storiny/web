use anyhow::anyhow;
use async_recursion::async_recursion;
use rusoto_s3::{
    ListObjectsV2Request,
    S3Client,
    S3,
};

/// Counts the number of S3 objects in the specified bucket.
///
/// * `client` - The S3 client instance.
/// * `bucket_name` - The name of the target bucket containing the objects.
/// * `prefix` - An optional string prefix to match keys and limit the objects.
/// * `continuation_token` - (Private) A token used during recursion if there are more than 1000
///   keys with the provided prefix.
#[async_recursion]
pub async fn count_s3_objects(
    client: &S3Client,
    bucket_name: &str,
    prefix: Option<String>,
    continuation_token: Option<String>,
) -> anyhow::Result<u32> {
    let mut num_objects: u32 = 0;
    let list_objects_result = client
        .list_objects_v2(ListObjectsV2Request {
            bucket: bucket_name.to_string(),
            max_keys: Some(1_000_i64),
            prefix: prefix.clone(),
            continuation_token,
            ..Default::default()
        })
        .await
        .map_err(|err| anyhow!("unable to list objects: {:?}", err))?;

    if let Some(contents) = list_objects_result.contents {
        num_objects = num_objects + contents.len() as u32;
    }

    // Recurse until there are no more keys left
    if list_objects_result.is_truncated.unwrap_or_default() {
        num_objects = num_objects
            + count_s3_objects(
                client,
                bucket_name,
                prefix,
                list_objects_result.next_continuation_token,
            )
            .await?;
    }

    Ok(num_objects)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        constants::buckets::S3_BASE_BUCKET,
        test_utils::{
            get_s3_client,
            TestContext,
        },
        utils::delete_s3_objects::delete_s3_objects,
    };
    use futures::future;
    use rusoto_s3::PutObjectRequest;
    use serial_test::serial;
    use storiny_macros::test_context;

    struct LocalTestContext {
        s3_client: S3Client,
    }

    #[async_trait::async_trait]
    impl TestContext for LocalTestContext {
        async fn setup() -> LocalTestContext {
            LocalTestContext {
                s3_client: get_s3_client(),
            }
        }

        async fn teardown(self) {
            delete_s3_objects(
                &self.s3_client,
                S3_BASE_BUCKET,
                Some("test-".to_string()),
                None,
            )
            .await
            .unwrap();
        }
    }

    #[test_context(LocalTestContext)]
    #[tokio::test]
    #[serial]
    async fn can_count_objects_with_prefix(ctx: &mut LocalTestContext) {
        let s3_client = &ctx.s3_client;

        // Insert an object
        let result = s3_client
            .put_object(PutObjectRequest {
                bucket: S3_BASE_BUCKET.to_string(),
                key: "fruits/guava".to_string(),
                ..Default::default()
            })
            .await;

        assert!(result.is_ok());

        let result = count_s3_objects(
            &s3_client,
            S3_BASE_BUCKET,
            Some("fruits/".to_string()),
            None,
        )
        .await
        .unwrap();

        assert_eq!(result, 1_u32);
    }

    #[test_context(LocalTestContext)]
    #[tokio::test]
    #[serial]
    async fn can_count_more_than_1000_objects_with_prefix(ctx: &mut LocalTestContext) {
        let s3_client = &ctx.s3_client;
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

        let result = count_s3_objects(
            &s3_client,
            S3_BASE_BUCKET,
            Some("integers/".to_string()),
            None,
        )
        .await
        .unwrap();

        assert_eq!(result, 1_200_u32);
    }

    #[tokio::test]
    async fn should_not_count_objects_not_starting_with_the_prefix() {
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

        let result = count_s3_objects(&s3_client, S3_BASE_BUCKET, Some("trees/".to_string()), None)
            .await
            .unwrap();

        assert_eq!(result, 1_u32);
    }
}
