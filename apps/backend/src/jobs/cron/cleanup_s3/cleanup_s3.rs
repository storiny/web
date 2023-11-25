use crate::{
    constants::buckets::S3_UPLOADS_BUCKET,
    jobs::init::SharedJobState,
};
use apalis::prelude::*;
use async_recursion::async_recursion;
use chrono::{
    DateTime,
    Utc,
};
use rusoto_s3::{
    Delete,
    DeleteObjectsRequest,
    ObjectIdentifier,
    S3Client,
    S3,
};
use sqlx::{
    postgres::PgRow,
    Pool,
    Postgres,
    Row,
};
use std::sync::Arc;
use uuid::Uuid;

pub const CLEANUP_S3_JOB_NAME: &'static str = "j:cleanup:s3";
const CHUNK_SIZE: u32 = 999;

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
) -> Result<(), JobError> {
    // We currently limit the amount of recursive calls to 50,000 (we can delete a maximum of 50
    // million assets at once). Consider raising this limit if needed.
    if index.unwrap_or_default() >= 50_000 {
        return Err(JobError::Failed(Box::from(format!(
            "Too many assets to delete: {}",
            index.unwrap_or_default() as u32 * CHUNK_SIZE
        ))));
    }

    let mut txn = db_pool
        .begin()
        .await
        .map_err(Box::new)
        .map_err(|err| JobError::Failed(err))?;

    let result = sqlx::query(
        r#"
        DELETE
        FROM
            assets
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
    .map(|row: PgRow| ObjectIdentifier {
        key: row.get::<Uuid, _>("key").to_string(),
        ..Default::default()
    })
    .fetch_all(&mut *txn)
    .await
    .map_err(Box::new)
    .map_err(|err| JobError::Failed(err))?;

    let has_more_rows = result.len() as u32 > CHUNK_SIZE;

    // Delete objects from S3 if the list is non-empty
    if !result.is_empty() {
        s3_client
            .delete_objects(DeleteObjectsRequest {
                bucket: S3_UPLOADS_BUCKET.to_string(),
                bypass_governance_retention: Some(true),
                delete: Delete {
                    objects: result,
                    quiet: Some(true), // Only return the failed object keys
                },
                ..Default::default()
            })
            .await
            .map_err(Box::new)
            .map_err(|err| JobError::Failed(err))?;
    }

    txn.commit()
        .await
        .map_err(Box::new)
        .map_err(|err| JobError::Failed(err))?;

    // Recurse if there are more rows to return.
    if has_more_rows {
        clean_assets(db_pool, s3_client, Some(index.unwrap_or_default() + 1)).await?;
    }

    Ok(())
}

/// Deletes stale rows from the `assets` table, along with the attached objects from the S3 bucket.
pub async fn cleanup_s3(_: S3CleanupJob, ctx: JobContext) -> Result<(), JobError> {
    log::info!("Starting S3 cleanup");

    let state = ctx.data::<Arc<SharedJobState>>()?;
    clean_assets(&state.db_pool, &state.s3_client, None).await?;

    log::info!("Finished S3 cleanup");

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        test_utils::{
            count_s3_objects,
            get_job_ctx_for_test,
            get_s3_client,
            TestContext,
        },
        utils::delete_s3_objects::delete_s3_objects,
    };
    use futures::future;
    use rusoto_s3::{
        PutObjectRequest,
        S3Client,
    };
    use serial_test::serial;
    use sqlx::PgPool;
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
            delete_s3_objects(&self.s3_client, S3_UPLOADS_BUCKET, None, None)
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

        // Insert into database
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

        // Upload empty objects to S3
        let mut put_futures = vec![];

        for key in object_keys {
            put_futures.push(s3_client.put_object(PutObjectRequest {
                bucket: S3_UPLOADS_BUCKET.to_string(),
                key: key.to_string(),
                ..Default::default()
            }));
        }

        future::join_all(put_futures).await;

        let object_count = count_s3_objects(&s3_client, S3_UPLOADS_BUCKET, None, None)
            .await
            .unwrap();

        assert_eq!(object_count, count as u32);
    }

    #[test_context(LocalTestContext)]
    #[sqlx::test]
    #[serial(s3)]
    async fn can_clean_assets_table_and_s3(
        ctx: &mut LocalTestContext,
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let s3_client = &ctx.s3_client;

        // Generate some assets
        generate_dummy_assets(5, &pool, s3_client).await;

        let ctx = get_job_ctx_for_test(pool.clone(), Some(s3_client.clone())).await;
        let result = cleanup_s3(S3CleanupJob { 0: Utc::now() }, ctx).await;

        assert!(result.is_ok());

        // Assets should not be present in the database
        let result = sqlx::query(r#"SELECT 1 FROM assets"#)
            .fetch_all(&pool)
            .await?;

        assert!(result.is_empty());

        // Objects should not be present in the bucket
        let object_count = count_s3_objects(&s3_client, S3_UPLOADS_BUCKET, None, None)
            .await
            .unwrap();

        assert_eq!(object_count, 0);

        Ok(())
    }

    #[test_context(LocalTestContext)]
    #[sqlx::test]
    #[serial(s3)]
    async fn can_clean_assets_table_and_s3_for_large_dataset(
        ctx: &mut LocalTestContext,
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let s3_client = &ctx.s3_client;

        // Generate a large number of assets
        generate_dummy_assets(2500, &pool, s3_client).await;

        let ctx = get_job_ctx_for_test(pool.clone(), Some(s3_client.clone())).await;
        let result = cleanup_s3(S3CleanupJob { 0: Utc::now() }, ctx).await;

        assert!(result.is_ok());

        // Assets should not be present in the database
        let result = sqlx::query(r#"SELECT 1 FROM assets"#)
            .fetch_all(&pool)
            .await?;

        assert!(result.is_empty());

        // Objects should not be present in the bucket
        let object_count = count_s3_objects(&s3_client, S3_UPLOADS_BUCKET, None, None)
            .await
            .unwrap();

        assert_eq!(object_count, 0);

        Ok(())
    }

    #[test_context(LocalTestContext)]
    #[sqlx::test(fixtures("user"))]
    #[serial(s3)]
    async fn should_not_delete_valid_assets(
        ctx: &mut LocalTestContext,
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let s3_client = &ctx.s3_client;

        // Generate a single asset
        generate_dummy_assets(1, &pool, s3_client).await;

        // Update the user_id of the asset
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

        let ctx = get_job_ctx_for_test(pool.clone(), Some(s3_client.clone())).await;
        let result = cleanup_s3(S3CleanupJob { 0: Utc::now() }, ctx).await;

        assert!(result.is_ok());

        // Assets should be present in the database
        let result = sqlx::query(r#"SELECT 1 FROM assets"#)
            .fetch_all(&pool)
            .await?;

        assert_eq!(result.len(), 1);

        // Objects should be present in the bucket
        let object_count = count_s3_objects(&s3_client, S3_UPLOADS_BUCKET, None, None)
            .await
            .unwrap();

        assert_eq!(object_count, 1);

        Ok(())
    }
}
