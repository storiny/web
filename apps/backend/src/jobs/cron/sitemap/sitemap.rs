use crate::{
    constants::buckets::S3_SITEMAPS_BUCKET,
    jobs::init::SharedJobState,
    utils::delete_s3_objects::delete_s3_objects,
};
use apalis::prelude::*;
use chrono::{
    DateTime,
    Utc,
};
use sitemap_rs::url::{
    ChangeFrequency,
    Url,
};
use sqlx::FromRow;
use std::sync::Arc;
use time::OffsetDateTime;

pub const SITEMAP_JOB_NAME: &'static str = "j:sitemap";

#[derive(Debug, Clone)]
pub struct SitemapJob(DateTime<Utc>);

impl From<DateTime<Utc>> for SitemapJob {
    fn from(dt: DateTime<Utc>) -> Self {
        SitemapJob(dt)
    }
}

impl Job for SitemapJob {
    const NAME: &'static str = SITEMAP_JOB_NAME;
}

#[derive(Debug, FromRow)]
struct Story {
    id: i64,
    slug: String,
    published_at: OffsetDateTime,
    edited_at: Option<OffsetDateTime>,
    read_count: i64,
    user_username: String,
}

pub async fn refresh_sitemap(_: SitemapJob, ctx: JobContext) -> Result<(), JobError> {
    log::info!("Attempting to refresh sitemaps");

    let state = ctx.data::<Arc<SharedJobState>>()?;
    let deleted_sitemaps = delete_s3_objects(&state.s3_client, S3_SITEMAPS_BUCKET, None, None)
        .await
        .map_err(Box::new)
        .map_err(|err| JobError::Failed(err))?;

    log::trace!("Deleted {} old sitemap files", deleted_sitemaps);

    let result = sqlx::query_as::<_, Story>(
        r#"
        SELECT
            s.id,
            s.slug,
            s.published_at,
            s.edited_at,
            s.read_count,
            "s->user".username AS "user_username"
        FROM
            stories s
                INNER JOIN users AS "s->user"
                           ON s.user_id = "s->user".id
                               -- Ignore stories from private users
                               AND "s->user".is_private IS FALSE
        WHERE
              s.published_at IS NOT NULL
              -- Public
          AND s.visibility = 2
          AND s.deleted_at IS NULL
        ORDER BY
            s.read_count DESC
        LIMIT 50000 OFFSET $1
        "#,
    )
    .bind(0)
    .fetch_all(&state.db_pool)
    .await
    .map_err(Box::new)
    .map_err(|err| JobError::Failed(err))?
    .iter()
    .map(|&row| {
        Url::builder(String::from("http://www.example.com/"))
            .last_modified(DateTime::from_utc(
                NaiveDate::from_ymd(2005, 1, 1).and_hms(0, 0, 0),
                FixedOffset::east(0),
            ))
            .change_frequency(ChangeFrequency::Monthly)
            .priority(0.4)
            .build()
            .expect("failed a <url> validation")
        // {
        //               changefreq: getChangeFreq(
        //                 dayjs(story.edited_at || story.published_at!)
        //               ),
        //               img: images,
        //               links: [],
        //               priority: 0.4,
        //               url: `${process.env.NEXT_PUBLIC_WEB_URI}/${
        //                 story.user.username || 'story'
        //               }/${story.slug || story.id}`,
        //               video: [],
        //             };
    });

    log::info!("Regenerated {} sitemaps", result.rows_affected(),);

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
}
