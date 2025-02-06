use crate::{
    S3Client,
    constants::buckets::{
        S3_DOCS_BUCKET,
        S3_UPLOADS_BUCKET,
    },
    cron::init::SharedCronJobState,
    utils::delete_s3_objects::calculate_md5_checksum_and_remove_other_checksums,
};
use apalis::prelude::*;
use async_recursion::async_recursion;
use aws_sdk_s3::types::{
    Delete,
    ObjectIdentifier,
};
use chrono::{
    DateTime,
    Utc,
};
use futures::future;
use sqlx::{
    Pool,
    Postgres,
    Row,
};
use std::sync::Arc;
use tracing::{
    debug,
    info,
};
use uuid::Uuid;

pub const CLEANUP_S3_JOB_NAME: &str = "j:cleanup:s3";
const CHUNK_SIZE: u32 = 999;

#[allow(dead_code)]
#[derive(Debug, Clone)]
pub struct S3CleanupJob(DateTime<Utc>);

impl From<DateTime<Utc>> for S3CleanupJob {
    fn from(dt: DateTime<Utc>) -> Self {
        S3CleanupJob(dt)
    }
}

impl Job for S3CleanupJob {
    const NAME: &'static str = CLEANUP_S3_JOB_NAME;
}

/// Cleans the `assets` table having rows with user_id = NULL and deletes the attached objects from
/// S3.
///
/// * `db_pool` - The Postgres connection pool.
/// * `s3_client` - The S3 client instance.
/// * `index` - (Private) An index counter used to keep track of the recursive calls.
#[async_recursion]
pub async fn clean_assets(
    db_pool: &Pool<Postgres>,
    s3_client: &S3Client,
    index: Option<u16>,
) -> Result<(), Error> {
    // We currently limit the amount of recursive calls to 50,000 (we can delete a maximum of 50
    // million assets at once). Consider raising this limit if needed.
    if index.unwrap_or_default() >= 50_000 {
        return Err(Error::Failed(Box::from(format!(
            "too many assets to delete: {}",
            index.unwrap_or_default() as u32 * CHUNK_SIZE
        ))));
    }

    debug!("starting to clean documents at index: {index:?}");

    let has_more_rows: bool;

    {
        let mut txn = db_pool
            .begin()
            .await
            .map_err(Box::new)
            .map_err(|err| Error::Failed(err))?;

        let result = sqlx::query(
            r#"
DELETE FROM assets
WHERE
    id IN (
        SELECT id
        FROM assets
        WHERE
           user_id IS NULL
        ORDER BY created_at
        LIMIT $1
    )
RETURNING key
"#,
        )
        // Return a maximum of 999 rows per invocation. (+1) is added to determine whether
        // there are more rows to return.
        .bind((CHUNK_SIZE + 1) as i32)
        .fetch_all(&mut *txn)
        .await
        .map_err(Box::new)
        .map_err(|err| Error::Failed(err))?
        .iter()
        .filter_map(|row| {
            ObjectIdentifier::builder()
                .set_key(Some(row.get::<Uuid, _>("key").to_string()))
                .build()
                // This will never error as the key is always set.
                .ok()
        })
        .collect::<Vec<_>>();

        debug!("received {} rows from the database", result.len());

        has_more_rows = result.len() as u32 > CHUNK_SIZE;

        // Delete objects from S3 if the list is non-empty.
        if !result.is_empty() {
            let delete = Delete::builder()
                .set_objects(Some(result))
                .build()
                .map_err(Box::new)
                .map_err(|error| Error::Failed(error))?;

            s3_client
                .delete_objects()
                .bucket(S3_UPLOADS_BUCKET)
                .delete(delete)
                // TODO: Remove once fixed https://github.com/awslabs/aws-sdk-rust/issues/1240#issuecomment-2635024286
                .customize()
                .mutate_request(calculate_md5_checksum_and_remove_other_checksums)
                .send()
                .await
                .map_err(|error| Box::new(error.into_service_error()))
                .map_err(|error| Error::Failed(error))?;
        }

        txn.commit()
            .await
            .map_err(Box::new)
            .map_err(|err| Error::Failed(err))?;
    }

    // Recurse if there are more rows to return.
    if has_more_rows {
        clean_assets(db_pool, s3_client, Some(index.unwrap_or_default() + 1)).await?;
    }

    Ok(())
}

/// Cleans the `documents` table having rows with story_id = NULL and deletes the attached objects
/// from S3.
///
/// * `db_pool` - The Postgres connection pool.
/// * `s3_client` - The S3 client instance.
/// * `index` - (Private) An index counter used to keep track of the recursive calls.
#[async_recursion]
pub async fn clean_documents(
    db_pool: &Pool<Postgres>,
    s3_client: &S3Client,
    index: Option<u16>,
) -> Result<(), Error> {
    // We currently limit the amount of recursive calls to 50,000 (we can delete a maximum of 50
    // million docs at once). Consider raising this limit if needed.
    if index.unwrap_or_default() >= 50_000 {
        return Err(Error::Failed(Box::from(format!(
            "too many docs to delete: {}",
            index.unwrap_or_default() as u32 * CHUNK_SIZE
        ))));
    }

    debug!("starting to clean documents at index: {index:?}");

    let has_more_rows: bool;

    {
        let mut txn = db_pool
            .begin()
            .await
            .map_err(Box::new)
            .map_err(|err| Error::Failed(err))?;

        let result = sqlx::query(
            r#"
DELETE FROM documents
WHERE
    id IN (
        SELECT id
        FROM documents
        WHERE
           story_id IS NULL
        ORDER BY created_at
        LIMIT $1
    )
RETURNING key
"#,
        )
        // Return a maximum of 999 rows per invocation. (+1) is added to determine whether
        // there are more rows to return.
        .bind((CHUNK_SIZE + 1) as i32)
        .fetch_all(&mut *txn)
        .await
        .map_err(Box::new)
        .map_err(|err| Error::Failed(err))?
        .iter()
        .filter_map(|row| {
            ObjectIdentifier::builder()
                .set_key(Some(row.get::<Uuid, _>("key").to_string()))
                .build()
                // This will never error as the key is always set.
                .ok()
        })
        .collect::<Vec<_>>();

        debug!("received {} rows from the database", result.len());

        has_more_rows = result.len() as u32 > CHUNK_SIZE;

        // Delete objects from S3 if the list is non-empty.
        if !result.is_empty() {
            let delete = Delete::builder()
                .set_objects(Some(result))
                .build()
                .map_err(Box::new)
                .map_err(|error| Error::Failed(error))?;

            s3_client
                .delete_objects()
                .bucket(S3_DOCS_BUCKET)
                .delete(delete)
                // TODO: Remove once fixed https://github.com/awslabs/aws-sdk-rust/issues/1240#issuecomment-2635024286
                .customize()
                .mutate_request(calculate_md5_checksum_and_remove_other_checksums)
                .send()
                .await
                .map_err(|error| Box::new(error.into_service_error()))
                .map_err(|error| Error::Failed(error))?;
        }

        txn.commit()
            .await
            .map_err(Box::new)
            .map_err(|err| Error::Failed(err))?;
    }

    // Recurse if there are more rows to return.
    if has_more_rows {
        clean_documents(db_pool, s3_client, Some(index.unwrap_or_default() + 1)).await?;
    }

    Ok(())
}

/// Deletes stale rows from the `assets` and the `documents` table, along with the attached objects
/// from the S3 bucket.
#[tracing::instrument(name = "JOB cleanup_s3", skip_all, err)]
pub async fn cleanup_s3(
    _: S3CleanupJob,
    state: Data<Arc<SharedCronJobState>>,
) -> Result<(), Error> {
    info!("starting S3 cleanup");

    future::try_join(
        clean_assets(&state.db_pool, &state.s3_client, None),
        clean_documents(&state.db_pool, &state.s3_client, None),
    )
    .await?;

    info!("finished S3 cleanup");

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        test_utils::{
            TestContext,
            count_s3_objects,
            get_cron_job_state_for_test,
            get_s3_client,
        },
        utils::delete_s3_objects_using_prefix::delete_s3_objects_using_prefix,
    };
    use sqlx::PgPool;
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
            future::try_join(
                delete_s3_objects_using_prefix(&self.s3_client, S3_UPLOADS_BUCKET, None, None),
                delete_s3_objects_using_prefix(&self.s3_client, S3_DOCS_BUCKET, None, None),
            )
            .await
            .unwrap();
        }
    }

    /// Generates the specified number of dummy assets along with empty S3 objects.
    ///
    /// * `count` - The number of assets to generate.
    /// * `pg_pool` - The Postgres connection pool.
    /// * `s3_client` - The S3 client instance.
    async fn generate_dummy_assets(count: usize, pg_pool: &PgPool, s3_client: &S3Client) {
        let object_keys = (0..count).map(|_| Uuid::new_v4()).collect::<Vec<_>>();

        let result = sqlx::query(
            r#"
INSERT INTO assets (key, hex, height, width)
SELECT UNNEST($1::UUID[]), $2, $3, $4
"#,
        )
        .bind(&object_keys[..])
        .bind("000000")
        .bind(0)
        .bind(0)
        .execute(pg_pool)
        .await
        .unwrap();

        assert_eq!(result.rows_affected(), object_keys.len() as u64);

        // Upload empty objects to S3.
        let mut put_futures = vec![];

        for key in object_keys {
            put_futures.push(
                s3_client
                    .put_object()
                    .bucket(S3_UPLOADS_BUCKET)
                    .key(key.to_string())
                    .send(),
            );
        }

        future::join_all(put_futures).await;

        let object_count = count_s3_objects(s3_client, S3_UPLOADS_BUCKET, None, None)
            .await
            .unwrap();

        assert_eq!(object_count, count as u32);
    }

    /// Generates the specified number of dummy documents along with empty S3 objects.
    ///
    /// * `count` - The number of documents to generate.
    /// * `pg_pool` - The Postgres connection pool.
    /// * `s3_client` - The S3 client instance.
    async fn generate_dummy_documents(count: usize, pg_pool: &PgPool, s3_client: &S3Client) {
        let object_keys = (0..count).map(|_| Uuid::new_v4()).collect::<Vec<_>>();

        let result = sqlx::query(
            r#"
INSERT INTO documents (key)
SELECT UNNEST($1::UUID[])
"#,
        )
        .bind(&object_keys[..])
        .execute(pg_pool)
        .await
        .unwrap();

        assert_eq!(result.rows_affected(), object_keys.len() as u64);

        // Upload empty objects to S3.
        let mut put_futures = vec![];

        for key in object_keys {
            put_futures.push(
                s3_client
                    .put_object()
                    .bucket(S3_DOCS_BUCKET)
                    .key(key.to_string())
                    .send(),
            );
        }

        future::join_all(put_futures).await;

        let object_count = count_s3_objects(s3_client, S3_DOCS_BUCKET, None, None)
            .await
            .unwrap();

        assert_eq!(object_count, count as u32);
    }

    mod serial {
        use super::*;

        // Assets

        #[test_context(LocalTestContext)]
        #[sqlx::test]
        async fn can_clean_assets_table_and_s3(
            ctx: &mut LocalTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let s3_client = &ctx.s3_client;

            // Generate some assets.
            generate_dummy_assets(5, &pool, s3_client).await;

            let state = get_cron_job_state_for_test(pool.clone(), Some(s3_client.clone())).await;
            let result = cleanup_s3(S3CleanupJob(Utc::now()), state).await;

            assert!(result.is_ok());

            // Assets should not be present in the database.
            let result = sqlx::query(r#"SELECT 1 FROM assets"#)
                .fetch_all(&pool)
                .await?;

            assert!(result.is_empty());

            // Objects should not be present in the bucket.
            let object_count = count_s3_objects(s3_client, S3_UPLOADS_BUCKET, None, None)
                .await
                .unwrap();

            assert_eq!(object_count, 0);

            Ok(())
        }

        #[test_context(LocalTestContext)]
        #[sqlx::test]
        async fn can_clean_assets_table_and_s3_for_large_dataset(
            ctx: &mut LocalTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let s3_client = &ctx.s3_client;

            // Generate a large number of assets.
            generate_dummy_assets(2500, &pool, s3_client).await;

            let state = get_cron_job_state_for_test(pool.clone(), Some(s3_client.clone())).await;
            let result = cleanup_s3(S3CleanupJob(Utc::now()), state).await;

            assert!(result.is_ok());

            // Assets should not be present in the database.
            let result = sqlx::query(r#"SELECT 1 FROM assets"#)
                .fetch_all(&pool)
                .await?;

            assert!(result.is_empty());

            // Objects should not be present in the bucket.
            let object_count = count_s3_objects(s3_client, S3_UPLOADS_BUCKET, None, None)
                .await
                .unwrap();

            assert_eq!(object_count, 0);

            Ok(())
        }

        #[test_context(LocalTestContext)]
        #[sqlx::test(fixtures("user"))]
        async fn should_not_delete_valid_assets(
            ctx: &mut LocalTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let s3_client = &ctx.s3_client;

            // Generate a single asset.
            generate_dummy_assets(1, &pool, s3_client).await;

            // Update the `user_id` of the asset.
            let result = sqlx::query(
                r#"
WITH selected_asset AS (
    SELECT id FROM assets
)
UPDATE assets
SET user_id = $1
WHERE id = (SELECT id FROM selected_asset)
"#,
            )
            .bind(1_i64)
            .execute(&pool)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            let state = get_cron_job_state_for_test(pool.clone(), Some(s3_client.clone())).await;
            let result = cleanup_s3(S3CleanupJob(Utc::now()), state).await;

            assert!(result.is_ok());

            // Asset should still be present in the database.
            let result = sqlx::query(r#"SELECT 1 FROM assets"#)
                .fetch_all(&pool)
                .await?;

            assert_eq!(result.len(), 1);

            // Object should still be present in the bucket.
            let object_count = count_s3_objects(s3_client, S3_UPLOADS_BUCKET, None, None)
                .await
                .unwrap();

            assert_eq!(object_count, 1);

            Ok(())
        }

        // Documents

        #[test_context(LocalTestContext)]
        #[sqlx::test]
        async fn can_clean_documents_table_and_s3(
            ctx: &mut LocalTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let s3_client = &ctx.s3_client;

            // Generate some documents.
            generate_dummy_documents(5, &pool, s3_client).await;

            let state = get_cron_job_state_for_test(pool.clone(), Some(s3_client.clone())).await;
            let result = cleanup_s3(S3CleanupJob(Utc::now()), state).await;

            assert!(result.is_ok());

            // Documents should not be present in the database.
            let result = sqlx::query(r#"SELECT 1 FROM documents"#)
                .fetch_all(&pool)
                .await?;

            assert!(result.is_empty());

            // Objects should not be present in the bucket.
            let object_count = count_s3_objects(s3_client, S3_DOCS_BUCKET, None, None)
                .await
                .unwrap();

            assert_eq!(object_count, 0);

            Ok(())
        }

        #[test_context(LocalTestContext)]
        #[sqlx::test]
        async fn can_clean_documents_table_and_s3_for_large_dataset(
            ctx: &mut LocalTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let s3_client = &ctx.s3_client;

            // Generate a large number of documents.
            generate_dummy_documents(2500, &pool, s3_client).await;

            let state = get_cron_job_state_for_test(pool.clone(), Some(s3_client.clone())).await;
            let result = cleanup_s3(S3CleanupJob(Utc::now()), state).await;

            assert!(result.is_ok());

            // Documents should not be present in the database.
            let result = sqlx::query(r#"SELECT 1 FROM documents"#)
                .fetch_all(&pool)
                .await?;

            assert!(result.is_empty());

            // Objects should not be present in the bucket.
            let object_count = count_s3_objects(s3_client, S3_DOCS_BUCKET, None, None)
                .await
                .unwrap();

            assert_eq!(object_count, 0);

            Ok(())
        }

        #[test_context(LocalTestContext)]
        #[sqlx::test(fixtures("user", "story"))]
        async fn should_not_delete_valid_documents(
            ctx: &mut LocalTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let s3_client = &ctx.s3_client;

            // A document is automatically created when a story is inserted due to the trigger.
            let result = sqlx::query(r#"SELECT 1 FROM documents"#)
                .fetch_all(&pool)
                .await?;

            assert_eq!(result.len(), 1);

            let state = get_cron_job_state_for_test(pool.clone(), Some(s3_client.clone())).await;
            let result = cleanup_s3(S3CleanupJob(Utc::now()), state).await;

            assert!(result.is_ok());

            // Document should still be present in the database.
            let result = sqlx::query(r#"SELECT 1 FROM documents"#)
                .fetch_all(&pool)
                .await?;

            assert_eq!(result.len(), 1);

            Ok(())
        }
    }
}
