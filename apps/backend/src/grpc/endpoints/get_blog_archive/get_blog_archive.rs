use crate::grpc::{
    defs::blog_def::v1::{
        ArchiveTimeline,
        GetBlogArchiveRequest,
        GetBlogArchiveResponse,
    },
    service::GrpcService,
};
use serde::Deserialize;
use sqlx::{
    types::Json,
    FromRow,
    Postgres,
    QueryBuilder,
};
use tonic::{
    Request,
    Response,
    Status,
};
use tracing::error;

#[derive(Debug, Deserialize)]
struct TimelineItem {
    /// The year of the timeline item.
    year: i32,
    /// The array of months this blog was active, ranging from 1 to 12.
    active_months: Vec<i32>,
}

#[derive(Debug, FromRow)]
struct Archive {
    story_count: i64,
    timeline: Json<Vec<TimelineItem>>,
}

/// Returns the archive for a blog.
#[tracing::instrument(
    name = "GRPC get_blog_archive",
    skip_all,
    fields(
        identifier = tracing::field::Empty
    ),
    err
)]
pub async fn get_blog_archive(
    client: &GrpcService,
    request: Request<GetBlogArchiveRequest>,
) -> Result<Response<GetBlogArchiveResponse>, Status> {
    let identifier = request.into_inner().identifier;
    // Identifier can be slug, domain or the ID
    let is_identifier_number = identifier.parse::<i64>().is_ok();

    tracing::Span::current().record("identifier", &identifier);

    let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
        r#"
WITH blog AS (
    SELECT id FROM blogs
    WHERE
"#,
    );

    query_builder.push(if is_identifier_number {
        r#"
(id = $1::BIGINT OR slug = $1)
"#
    } else {
        // The identifier is definitely not an ID
        r#"
(domain = $1 OR slug = $1)
"#
    });

    query_builder.push(
        r#"
    AND deleted_at IS NULL
)
SELECT
(
    SELECT COUNT(*)
    FROM blog_stories
    WHERE
        blog_id = (
            SELECT id FROM blog
        )
        AND deleted_at IS NULL
        AND accepted_at IS NOT NULL
) AS "story_count",
COALESCE(
    JSONB_AGG(
        JSONB_BUILD_OBJECT(
            'year', year::SMALLINT,
            'active_months', active_months::SMALLINT[]
        ) ORDER BY year DESC
    ) FILTER (WHERE year IS NOT NULL)
    , '[]') AS "timeline"
FROM (
    SELECT
        DATE_PART('year', accepted_at) AS "year",
        ARRAY_AGG(
            DISTINCT DATE_PART('month', accepted_at)
        ) AS "active_months"
    FROM blog_stories
    WHERE
        blog_id = (
            SELECT id FROM blog
        )
        AND deleted_at IS NULL
        AND accepted_at IS NOT NULL
    GROUP BY year
) AS _
"#,
    );

    let result = query_builder
        .build_query_as::<Archive>()
        .bind(identifier)
        .fetch_one(&client.db_pool)
        .await
        .map_err(|error| {
            error!("database error: {error:?}");
            Status::internal("Database error")
        })?;

    Ok(Response::new(GetBlogArchiveResponse {
        story_count: result.story_count as u32,
        timeline: result
            .timeline
            .iter()
            .map(|item| ArchiveTimeline {
                year: item.year as u32,
                active_months: item
                    .active_months
                    .iter()
                    .map(|month| *month as u32)
                    .collect(),
            })
            .collect(),
    }))
}

#[cfg(test)]
mod tests {
    use crate::{
        grpc::defs::blog_def::v1::{
            ArchiveTimeline,
            GetBlogArchiveRequest,
        },
        test_utils::test_grpc_service,
    };
    use sqlx::PgPool;
    use tonic::Request;

    #[sqlx::test(fixtures("get_blog_archive"))]
    async fn can_return_blog_archive_by_id(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_blog_archive(Request::new(GetBlogArchiveRequest {
                        identifier: 2_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.story_count, 4_u32);

                let timeline = vec![
                    ArchiveTimeline {
                        year: 2023,
                        active_months: vec![12],
                    },
                    ArchiveTimeline {
                        year: 2022,
                        active_months: vec![4, 9, 10],
                    },
                ];

                assert_eq!(response.timeline, timeline);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog_archive"))]
    async fn should_not_include_soft_deleted_stories_in_archive_by_id(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                // Should include all the stories initially.
                let response = client
                    .get_blog_archive(Request::new(GetBlogArchiveRequest {
                        identifier: 2_i64.to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.story_count, 4_u32);

                let timeline = vec![
                    ArchiveTimeline {
                        year: 2023,
                        active_months: vec![12],
                    },
                    ArchiveTimeline {
                        year: 2022,
                        active_months: vec![4, 9, 10],
                    },
                ];

                assert_eq!(response.timeline, timeline);

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

                // Should include only valid stories.
                let response = client
                    .get_blog_archive(Request::new(GetBlogArchiveRequest {
                        identifier: "test-blog".to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.story_count, 3_u32);

                let timeline = vec![
                    ArchiveTimeline {
                        year: 2023,
                        active_months: vec![12],
                    },
                    ArchiveTimeline {
                        year: 2022,
                        active_months: vec![4, 10],
                    },
                ];

                assert_eq!(response.timeline, timeline);
            }),
        )
        .await;
    }

    //

    #[sqlx::test(fixtures("get_blog_archive"))]
    async fn can_return_blog_archive_by_slug(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_blog_archive(Request::new(GetBlogArchiveRequest {
                        identifier: "test-blog".to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.story_count, 4_u32);

                let timeline = vec![
                    ArchiveTimeline {
                        year: 2023,
                        active_months: vec![12],
                    },
                    ArchiveTimeline {
                        year: 2022,
                        active_months: vec![4, 9, 10],
                    },
                ];

                assert_eq!(response.timeline, timeline);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog_archive"))]
    async fn should_not_include_soft_deleted_stories_in_archive_by_slug(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                // Should include all the stories initially.
                let response = client
                    .get_blog_archive(Request::new(GetBlogArchiveRequest {
                        identifier: "test-blog".to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.story_count, 4_u32);

                let timeline = vec![
                    ArchiveTimeline {
                        year: 2023,
                        active_months: vec![12],
                    },
                    ArchiveTimeline {
                        year: 2022,
                        active_months: vec![4, 9, 10],
                    },
                ];

                assert_eq!(response.timeline, timeline);

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

                // Should include only valid stories.
                let response = client
                    .get_blog_archive(Request::new(GetBlogArchiveRequest {
                        identifier: "test-blog".to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.story_count, 3_u32);

                let timeline = vec![
                    ArchiveTimeline {
                        year: 2023,
                        active_months: vec![12],
                    },
                    ArchiveTimeline {
                        year: 2022,
                        active_months: vec![4, 10],
                    },
                ];

                assert_eq!(response.timeline, timeline);
            }),
        )
        .await;
    }

    //

    #[sqlx::test(fixtures("get_blog_archive"))]
    async fn can_return_blog_archive_by_domain(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_blog_archive(Request::new(GetBlogArchiveRequest {
                        identifier: "test.com".to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.story_count, 4_u32);

                let timeline = vec![
                    ArchiveTimeline {
                        year: 2023,
                        active_months: vec![12],
                    },
                    ArchiveTimeline {
                        year: 2022,
                        active_months: vec![4, 9, 10],
                    },
                ];

                assert_eq!(response.timeline, timeline);
            }),
        )
        .await;
    }

    #[sqlx::test(fixtures("get_blog_archive"))]
    async fn should_not_include_soft_deleted_stories_in_archive_by_domain(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, pool, _, _| async move {
                // Should include all the stories initially.
                let response = client
                    .get_blog_archive(Request::new(GetBlogArchiveRequest {
                        identifier: "test.com".to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.story_count, 4_u32);

                let timeline = vec![
                    ArchiveTimeline {
                        year: 2023,
                        active_months: vec![12],
                    },
                    ArchiveTimeline {
                        year: 2022,
                        active_months: vec![4, 9, 10],
                    },
                ];

                assert_eq!(response.timeline, timeline);

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

                // Should include only valid stories.
                let response = client
                    .get_blog_archive(Request::new(GetBlogArchiveRequest {
                        identifier: "test-blog".to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.story_count, 3_u32);

                let timeline = vec![
                    ArchiveTimeline {
                        year: 2023,
                        active_months: vec![12],
                    },
                    ArchiveTimeline {
                        year: 2022,
                        active_months: vec![4, 10],
                    },
                ];

                assert_eq!(response.timeline, timeline);
            }),
        )
        .await;
    }

    //

    #[sqlx::test]
    async fn can_handle_a_missing_blog(pool: PgPool) {
        test_grpc_service(
            pool,
            false,
            Box::new(|mut client, _, _, _| async move {
                let response = client
                    .get_blog_archive(Request::new(GetBlogArchiveRequest {
                        identifier: "invalid-blog".to_string(),
                    }))
                    .await
                    .unwrap()
                    .into_inner();

                assert_eq!(response.story_count, 0_u32);
                assert!(response.timeline.is_empty());
            }),
        )
        .await;
    }
}
