use crate::{
    S3Client,
    constants::buckets::S3_FONTS_BUCKET,
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

pub const CLEANUP_BLOGS_JOB_NAME: &str = "j:cleanup:blogs";
const CHUNK_SIZE: u32 = 300;

#[allow(dead_code)]
#[derive(Debug, Clone)]
pub struct BlogsCleanupJob(DateTime<Utc>);

impl From<DateTime<Utc>> for BlogsCleanupJob {
    fn from(dt: DateTime<Utc>) -> Self {
        BlogsCleanupJob(dt)
    }
}

impl Job for BlogsCleanupJob {
    const NAME: &'static str = CLEANUP_BLOGS_JOB_NAME;
}

/// Cleans the `blogs` table having rows with user_id = NULL and deletes the attached font objects
/// from S3.
///
/// * `db_pool` - The Postgres connection pool.
/// * `s3_client` - The S3 client instance.
/// * `index` - (Private) An index counter used to keep track of the recursive calls.
#[async_recursion]
pub async fn clean_blogs_impl(
    db_pool: &Pool<Postgres>,
    s3_client: &S3Client,
    index: Option<u16>,
) -> Result<(), Error> {
    // We currently limit the amount of recursive calls to 50,000 (we can delete a maximum of 15
    // million blogs at once). Consider raising this limit if needed.
    if index.unwrap_or_default() >= 50_000 {
        return Err(Error::Failed(Box::from(format!(
            "too many blogs to delete: {}",
            index.unwrap_or_default() as u32 * CHUNK_SIZE
        ))));
    }

    debug!("starting to clean blogs at index: {index:?}");

    let has_more_rows: bool;

    {
        let mut txn = db_pool
            .begin()
            .await
            .map_err(Box::new)
            .map_err(|err| Error::Failed(err))?;

        let result = sqlx::query(
            r#"
DELETE FROM blogs
WHERE
    id IN (
        SELECT id
        FROM blogs
        WHERE
           user_id IS NULL
        ORDER BY created_at
        LIMIT $1
    )
RETURNING
    font_primary,
    font_secondary,
    font_code
"#,
        )
        // Return a maximum of 300 (maximum of 1000 objects to delete / maximum of 3 font objects
        // per blog) rows per invocation. (+1) is added to determine whether there are more
        // rows to return.
        .bind((CHUNK_SIZE + 1) as i32)
        .fetch_all(&mut *txn)
        .await
        .map_err(Box::new)
        .map_err(|err| Error::Failed(err))?;

        debug!("received {} rows from the database", result.len());

        has_more_rows = result.len() as u32 > CHUNK_SIZE;

        let mut font_keys = Vec::new();

        result.iter().for_each(|row| {
            if let Some(font_key) = row.get::<Option<Uuid>, _>("font_primary") {
                if let Ok(key) = ObjectIdentifier::builder()
                    .set_key(Some(font_key.to_string()))
                    .build()
                {
                    font_keys.push(key);
                }
            }

            if let Some(font_key) = row.get::<Option<Uuid>, _>("font_secondary") {
                if let Ok(key) = ObjectIdentifier::builder()
                    .set_key(Some(font_key.to_string()))
                    .build()
                {
                    font_keys.push(key);
                }
            }

            if let Some(font_key) = row.get::<Option<Uuid>, _>("font_code") {
                if let Ok(key) = ObjectIdentifier::builder()
                    .set_key(Some(font_key.to_string()))
                    .build()
                {
                    font_keys.push(key);
                }
            }
        });

        // Delete objects from S3 if the list is non-empty.
        if !font_keys.is_empty() {
            let delete = Delete::builder()
                .set_objects(Some(font_keys))
                .build()
                .map_err(Box::new)
                .map_err(|error| Error::Failed(error))?;

            s3_client
                .delete_objects()
                .bucket(S3_FONTS_BUCKET)
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
        clean_blogs_impl(db_pool, s3_client, Some(index.unwrap_or_default() + 1)).await?;
    }

    Ok(())
}

/// Deletes stale blogs from the database. Also deletes the fonts associated with the blog from the
/// object storage.
#[tracing::instrument(name = "JOB cleanup_blogs", skip_all, err)]
pub async fn cleanup_blogs(
    _: BlogsCleanupJob,
    state: Data<Arc<SharedCronJobState>>,
) -> Result<(), Error> {
    info!("starting blogs cleanup");

    clean_blogs_impl(&state.db_pool, &state.s3_client, None).await?;

    info!("finished blogs cleanup");

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        constants::buckets::S3_FONTS_BUCKET,
        test_utils::{
            TestContext,
            count_s3_objects,
            get_cron_job_state_for_test,
            get_s3_client,
        },
        utils::delete_s3_objects_using_prefix::delete_s3_objects_using_prefix,
    };
    use futures::future;
    use nanoid::nanoid;
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
            delete_s3_objects_using_prefix(&self.s3_client, S3_FONTS_BUCKET, None, None)
                .await
                .unwrap();
        }
    }

    /// Generates a random slug for the blog.
    fn generate_random_slug() -> String {
        let character_set: [char; 26] = [
            'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q',
            'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
        ];

        nanoid!(24, &character_set)
    }

    /// Generates the specified number of dummy blogs along with empty S3 objects.
    ///
    /// * `count` - The number of blogs to generate.
    /// * `pg_pool` - The Postgres connection pool.
    /// * `s3_client` - The S3 client instance.
    async fn generate_dummy_blogs(count: usize, pg_pool: &PgPool, s3_client: &S3Client) {
        let blog_slugs = (0..count)
            .map(|_| generate_random_slug())
            .collect::<Vec<_>>();
        let mut primary_font_keys = (0..count).map(|_| Uuid::new_v4()).collect::<Vec<_>>();
        let mut secondary_font_keys = (0..count).map(|_| Uuid::new_v4()).collect::<Vec<_>>();
        let mut code_font_keys = (0..count).map(|_| Uuid::new_v4()).collect::<Vec<_>>();

        let result = sqlx::query(
            r#"
INSERT INTO blogs
    (name, slug, font_primary, font_secondary, font_code)
SELECT
    $1,
    UNNEST($2::TEXT[]),
    UNNEST($3::UUID[]),
    UNNEST($4::UUID[]),
    UNNEST($5::UUID[])
"#,
        )
        .bind("Sample blog")
        .bind(&blog_slugs[..])
        .bind(&primary_font_keys[..])
        .bind(&secondary_font_keys[..])
        .bind(&code_font_keys[..])
        .execute(pg_pool)
        .await
        .unwrap();

        assert_eq!(result.rows_affected(), count as u64);

        // Upload empty objects to S3.
        let mut put_futures = vec![];
        let mut object_keys = vec![];

        object_keys.append(&mut primary_font_keys);
        object_keys.append(&mut secondary_font_keys);
        object_keys.append(&mut code_font_keys);

        for key in object_keys {
            put_futures.push(
                s3_client
                    .put_object()
                    .bucket(S3_FONTS_BUCKET)
                    .key(key.to_string())
                    .send(),
            );
        }

        future::join_all(put_futures).await;

        let object_count = count_s3_objects(s3_client, S3_FONTS_BUCKET, None, None)
            .await
            .unwrap();

        assert_eq!(object_count, (count * 3) as u32);
    }

    mod serial {
        use super::*;

        #[test_context(LocalTestContext)]
        #[sqlx::test]
        async fn can_clean_blogs_table_and_s3(
            ctx: &mut LocalTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let s3_client = &ctx.s3_client;

            // Generate some blogs.
            generate_dummy_blogs(5, &pool, s3_client).await;

            let state = get_cron_job_state_for_test(pool.clone(), Some(s3_client.clone())).await;
            let result = cleanup_blogs(BlogsCleanupJob(Utc::now()), state).await;

            assert!(result.is_ok());

            // Blogs should not be present in the database.
            let result = sqlx::query(r#"SELECT 1 FROM blogs"#)
                .fetch_all(&pool)
                .await?;

            assert!(result.is_empty());

            // Objects should not be present in the bucket.
            let object_count = count_s3_objects(s3_client, S3_FONTS_BUCKET, None, None)
                .await
                .unwrap();

            assert_eq!(object_count, 0);

            Ok(())
        }

        #[test_context(LocalTestContext)]
        #[sqlx::test]
        async fn can_clean_blogs_table_and_s3_for_large_dataset(
            ctx: &mut LocalTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let s3_client = &ctx.s3_client;

            // Generate a large number of blogs.
            generate_dummy_blogs(500, &pool, s3_client).await;

            let state = get_cron_job_state_for_test(pool.clone(), Some(s3_client.clone())).await;
            let result = cleanup_blogs(BlogsCleanupJob(Utc::now()), state).await;

            assert!(result.is_ok());

            // Blogs should not be present in the database.
            let result = sqlx::query(r#"SELECT 1 FROM blogs"#)
                .fetch_all(&pool)
                .await?;

            assert!(result.is_empty());

            // Objects should not be present in the bucket.
            let object_count = count_s3_objects(s3_client, S3_FONTS_BUCKET, None, None)
                .await
                .unwrap();

            assert_eq!(object_count, 0);

            Ok(())
        }

        #[test_context(LocalTestContext)]
        #[sqlx::test(fixtures("user"))]
        async fn should_not_delete_valid_blogs(
            ctx: &mut LocalTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let s3_client = &ctx.s3_client;

            // Generate a single blog.
            generate_dummy_blogs(1, &pool, s3_client).await;

            // Update the `user_id` of the blog.
            let result = sqlx::query(
                r#"
WITH selected_blog AS (
    SELECT id FROM blogs
)
UPDATE blogs
SET user_id = $1
WHERE id = (SELECT id FROM selected_blog)
"#,
            )
            .bind(1_i64)
            .execute(&pool)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            let state = get_cron_job_state_for_test(pool.clone(), Some(s3_client.clone())).await;
            let result = cleanup_blogs(BlogsCleanupJob(Utc::now()), state).await;

            assert!(result.is_ok());

            // Blog should still be present in the database.
            let result = sqlx::query(r#"SELECT 1 FROM blogs"#)
                .fetch_all(&pool)
                .await?;

            assert_eq!(result.len(), 1);

            // Objects should still be present in the bucket.
            let object_count = count_s3_objects(s3_client, S3_FONTS_BUCKET, None, None)
                .await
                .unwrap();

            assert_eq!(object_count, 3);

            Ok(())
        }
    }
}
