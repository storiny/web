use crate::{
    S3Client,
    utils::delete_s3_objects::delete_s3_objects,
};
use anyhow::anyhow;
use async_recursion::async_recursion;

/// Deletes all the S3 objects in the specified bucket matching the provided prefix. Returns the
/// number of objects that were successfully deleted.
///
/// * `client` - The S3 client instance.
/// * `bucket_name` - The name of the target bucket containing the objects.
/// * `prefix` - An optional string prefix to match keys and limit the objects.
/// * `continuation_token` - (Private) A token used during recursion if there are more than 1000
///   keys with the provided prefix.
#[async_recursion]
pub async fn delete_s3_objects_using_prefix(
    client: &S3Client,
    bucket_name: &str,
    prefix: Option<String>,
    continuation_token: Option<String>,
) -> anyhow::Result<u32> {
    let mut num_deleted: u32;

    let list_objects_result = client
        .list_objects_v2()
        .bucket(bucket_name)
        .max_keys(1_000_i32)
        .set_prefix(prefix.clone())
        .set_continuation_token(continuation_token)
        .send()
        .await
        .map_err(|error| error.into_service_error())
        .map_err(|error| anyhow!("unable to list objects: {:?}", error))?;

    {
        let object_keys = list_objects_result
            .contents()
            .iter()
            .filter_map(|obj| obj.key.clone())
            .collect::<Vec<_>>();

        num_deleted = delete_s3_objects(client, bucket_name, object_keys).await?;
    }

    // Recurse until there are no more keys left
    if list_objects_result.is_truncated.unwrap_or_default() {
        let next_continuation_token = list_objects_result.next_continuation_token.clone();
        drop(list_objects_result);

        num_deleted +=
            delete_s3_objects_using_prefix(client, bucket_name, prefix, next_continuation_token)
                .await?;
    }

    Ok(num_deleted)
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
    };
    use aws_sdk_s3::operation::get_object::GetObjectError;
    use futures::future;
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
        async fn can_delete_objects_with_prefix(ctx: &mut LocalTestContext) {
            let s3_client = &ctx.s3_client;

            // Insert an object
            let result = s3_client
                .put_object()
                .bucket(S3_BASE_BUCKET)
                .key("test-fruits/guava")
                .send()
                .await;

            assert!(result.is_ok());

            let result = delete_s3_objects_using_prefix(
                s3_client,
                S3_BASE_BUCKET,
                Some("test-fruits/".to_string()),
                None,
            )
            .await
            .unwrap();

            assert_eq!(result, 1_u32);

            // Object should get deleted
            let result = s3_client
                .get_object()
                .bucket(S3_BASE_BUCKET)
                .key("test-fruits/guava")
                .send()
                .await
                .map_err(|error| error.into_service_error());

            assert!(matches!(result.unwrap_err(), GetObjectError::NoSuchKey(_)));
        }

        #[test_context(LocalTestContext)]
        #[tokio::test]
        async fn can_delete_more_than_1000_objects_with_prefix(ctx: &mut LocalTestContext) {
            let s3_client = &ctx.s3_client;
            let mut put_futures = vec![];

            // Insert 1200 objects
            for i in 0..1_200 {
                put_futures.push(
                    s3_client
                        .put_object()
                        .bucket(S3_BASE_BUCKET)
                        .key(format!("test-integers/{}", i))
                        .send(),
                );
            }

            future::join_all(put_futures).await;

            let result = delete_s3_objects_using_prefix(
                s3_client,
                S3_BASE_BUCKET,
                Some("test-integers/".to_string()),
                None,
            )
            .await
            .unwrap();

            assert_eq!(result, 1_200_u32);
        }

        #[test_context(LocalTestContext)]
        #[tokio::test]
        async fn should_not_delete_objects_not_starting_with_the_prefix(
            ctx: &mut LocalTestContext,
        ) {
            let s3_client = &ctx.s3_client;

            // Insert an object
            let result = s3_client
                .put_object()
                .bucket(S3_BASE_BUCKET)
                .key("test-trees/oak")
                .send()
                .await;

            assert!(result.is_ok());

            // Insert another object with a different prefix
            let result = s3_client
                .put_object()
                .bucket(S3_BASE_BUCKET)
                .key("test-beverages/latte")
                .send()
                .await;

            assert!(result.is_ok());

            let result = delete_s3_objects_using_prefix(
                s3_client,
                S3_BASE_BUCKET,
                Some("test-trees/".to_string()),
                None,
            )
            .await
            .unwrap();

            assert_eq!(result, 1_u32);
        }
    }
}
