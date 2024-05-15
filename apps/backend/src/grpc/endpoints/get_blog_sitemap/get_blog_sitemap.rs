use crate::{
    grpc::{
        defs::blog_def::v1::{
            GetBlogSitemapRequest,
            GetBlogSitemapResponse,
        },
        service::GrpcService,
    },
    utils::get_sitemap_change_freq::get_sitemap_change_freq,
};
use chrono::DateTime;
use sitemap_rs::{
    url::Url,
    url_set::UrlSet,
};
use sqlx::{
    FromRow,
    Postgres,
    QueryBuilder,
    Row,
};
use time::OffsetDateTime;
use tonic::{
    Request,
    Response,
    Status,
};
use tracing::error;

/// The maximum number of story entries in the sitemap.
const CHUNK_SIZE: u32 = 50_000;

#[derive(Debug, FromRow)]
struct Story {
    change_freq: String,
    url: String,
    edited_at: Option<OffsetDateTime>,
}

/// Returns the sitemap for a blog.
#[tracing::instrument(
    name = "GRPC get_blog_sitemap",
    skip_all,
    fields(
        identifier = tracing::field::Empty
    ),
    err
)]
pub async fn get_blog_sitemap(
    client: &GrpcService,
    request: Request<GetBlogSitemapRequest>,
) -> Result<Response<GetBlogSitemapResponse>, Status> {
    let identifier = request.into_inner().identifier;
    // Identifier can be slug, domain or the ID
    let is_identifier_number = identifier.parse::<i64>().is_ok();

    tracing::Span::current().record("identifier", &identifier);

    let pg_pool = &client.db_pool;
    let mut txn = pg_pool.begin().await.map_err(|error| {
        error!("unable to begin the transaction: {error:?}");
        Status::internal("Database error")
    })?;

    let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
        r#"
SELECT id FROM blogs b
WHERE
"#,
    );

    query_builder.push(if is_identifier_number {
        r#"
(b.id = $1::BIGINT OR b.slug = $1)
"#
    } else {
        // The identifier is definitely not an ID
        r#"
(b.domain = $1 OR b.slug = $1)
"#
    });

    query_builder.push(r#" AND b.deleted_at IS NULL "#);

    let blog = query_builder
        .build()
        .bind(identifier)
        .fetch_one(&mut *txn)
        .await
        .map_err(|error| {
            if matches!(error, sqlx::Error::RowNotFound) {
                Status::not_found("Blog not found")
            } else {
                error!("database error: {error:?}");

                Status::internal("Database error")
            }
        })?;
    let blog_id = blog.get::<i64, _>("id");

    let result = sqlx::query_as::<_, Story>(
        r#"
SELECT
    s.edited_at,
    CASE
        WHEN COALESCE(s.edited_at, s.published_at) >= (NOW() - INTERVAL '1 week')
            THEN 'weekly'
        WHEN COALESCE(s.edited_at, s.published_at) >= (NOW() - INTERVAL '6 months')
            THEN 'monthly'
        ELSE 'yearly'
    END AS change_freq,
    'https://' ||
        COALESCE (
            b.domain,
            (b.slug || '.storiny.com')
        )
    || '/' || s.slug AS url
FROM
    blog_stories AS bs
        INNER JOIN blogs AS b
            ON b.id = bs.blog_id
        INNER JOIN stories AS s
            ON s.id = bs.story_id
WHERE
    bs.deleted_at IS NULL
    AND bs.accepted_at IS NOT NULL
    AND bs.blog_id = $1
ORDER BY
    s.read_count DESC
LIMIT $2
"#,
    )
    .bind(blog_id)
    .bind(CHUNK_SIZE as i32)
    .fetch_all(&mut *txn)
    .await
    .map_err(|error| {
        error!("database error: {error:?}");

        Status::internal("Database error")
    })?
    .iter()
    .filter_map(|row| {
        let mut url_builder = Url::builder(row.url.to_string());

        url_builder
            .change_frequency(get_sitemap_change_freq(&row.change_freq))
            .priority(0.8);

        if let Some(edited_at) = row.edited_at {
            if let Some(last_mod) = DateTime::from_timestamp(edited_at.unix_timestamp(), 0) {
                url_builder.last_modified(last_mod.fixed_offset());
            }
        }

        // This should never error as the priority is a constant value and there are no images.
        url_builder.build().ok()
    })
    .collect::<Vec<_>>();

    txn.commit().await.map_err(|error| {
        error!("unable to commit the transaction: {error:?}");
        Status::internal("Database error")
    })?;

    // This should never error as the number of rows are always <= 50,000
    let url_set = UrlSet::new(result).map_err(|error| {
        error!("sitemap builder error: {error:?}");
        Status::internal("Sitemap builder error")
    })?;

    let mut buffer = Vec::new();

    url_set.write(&mut buffer).map_err(|error| {
        error!("sitemap builder error: {error:?}");
        Status::internal("Sitemap builder error")
    })?;

    let content = String::from_utf8(buffer).map_err(|error| {
        error!("utf-8 validation error: {error:?}");
        Status::internal("UTF-8 validation error")
    })?;

    Ok(Response::new(GetBlogSitemapResponse { content }))
}

#[cfg(test)]
mod tests {
    use crate::{
        grpc::defs::blog_def::v1::GetBlogSitemapRequest,
        test_utils::test_grpc_service,
    };
    use sqlx::PgPool;
    use tonic::{
        Code,
        Request,
    };
    use xml2json_rs::JsonBuilder;

    /// Asserts XML string.
    ///
    /// * `left` - The first chunk of data.
    /// * `right` - The second chunk of data.
    fn assert_xml(left: &str, right: &str) {
        let json_builder = JsonBuilder::default();
        let left_json = json_builder.build_string_from_xml(left).unwrap();
        let right_json = json_builder.build_string_from_xml(right).unwrap();

        assert_eq!(left_json, right_json)
    }

    #[sqlx::test(fixtures("get_blog_sitemap"))]
    async fn can_return_blog_sitemap_by_slug(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_blog_sitemap(Request::new(GetBlogSitemapRequest {
                        identifier: "test-blog".to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_xml(
                    &response.content,
                    r#"
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://test.com/sample-story-2</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://test.com/sample-story-3</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://test.com/sample-story-4</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
</urlset>
"#,
                );
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog_sitemap"))]
    async fn can_return_blog_sitemap_by_domain(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_blog_sitemap(Request::new(GetBlogSitemapRequest {
                        identifier: "test.com".to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_xml(
                    &response.content,
                    r#"
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://test.com/sample-story-2</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://test.com/sample-story-3</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://test.com/sample-story-4</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
</urlset>
"#,
                );
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog_sitemap"))]
    async fn can_return_blog_sitemap_by_id(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_blog_sitemap(Request::new(GetBlogSitemapRequest {
                        identifier: 2_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_xml(
                    &response.content,
                    r#"
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://test.com/sample-story-2</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://test.com/sample-story-3</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://test.com/sample-story-4</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
</urlset>
"#,
                );
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog_sitemap"))]
    async fn should_not_include_soft_deleted_stories_in_sitemap(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                // Should include all the stories initially.
                let response = client
                    .get_blog_sitemap(Request::new(GetBlogSitemapRequest {
                        identifier: "test-blog".to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_xml(
                    &response.content,
                    r#"
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://test.com/sample-story-2</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://test.com/sample-story-3</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://test.com/sample-story-4</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
</urlset>
"#,
                );

                // Soft-delete one of the blog story relations.
                let result = sqlx::query(
                    r#"
UPDATE blog_stories
SET deleted_at = NOW()
WHERE story_id = $1
"#,
                )
                .bind(4_i64)
                .execute(&pool)
                .await
                .unwrap();

                assert_eq!(result.rows_affected(), 1);

                // Should not include deleted stories.
                let response = client
                    .get_blog_sitemap(Request::new(GetBlogSitemapRequest {
                        identifier: "test-blog".to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_xml(
                    &response.content,
                    r#"
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://test.com/sample-story-3</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://test.com/sample-story-4</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
</urlset>
"#,
                );
            }),
        )
        .await;
    }

    #[sqlx::test]
    async fn can_handle_a_missing_blog(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_blog_sitemap(Request::new(GetBlogSitemapRequest {
                        identifier: "invalid-blog".to_string(),
                    }))
                    .await;

                assert_eq!(response.unwrap_err().code(), Code::NotFound);
            }),
        )
        .await;
    }
}
