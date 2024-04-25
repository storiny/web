use crate::{
    error::AppError,
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_http::StatusCode;
use actix_web::{
    get,
    http::header::{
        CacheControl,
        CacheDirective,
    },
    web,
    HttpResponse,
};
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::FromRow;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    story_id: String,
}

#[derive(Debug, PartialEq, FromRow, Serialize, Deserialize)]
struct Response {
    comments_last_month: i32,
    comments_this_month: i32,
    device_data: sqlx::types::Json<Vec<(i32, i32)>>,
    like_timeline: sqlx::types::Json<Vec<(String, i32)>>,
    likes_last_month: i32,
    likes_this_month: i32,
    read_mercator: sqlx::types::Json<Vec<(String, i32)>>,
    read_timeline: sqlx::types::Json<Vec<(String, i32)>>,
    reading_time_average: i32,
    reading_time_estimate: i32,
    reading_time_last_month: i32,
    reading_time_this_month: i32,
    reading_time_timeline: sqlx::types::Json<Vec<(String, f32)>>,
    reads_last_month: i32,
    reads_last_three_months: i32,
    reads_this_month: i32,
    referral_data: sqlx::types::Json<Vec<(String, i32)>>,
    returning_readers: i32,
    total_comments: i32,
    total_likes: i32,
    total_reads: i32,
    total_views: i64,
}

#[get("/v1/me/stories/{story_id}/stats")]
#[tracing::instrument(
    name = "GET /v1/me/stories/{story_id}/stats",
    skip_all,
    fields(
        user_id = user.id().ok(),
        story_id = %path.story_id
    ),
    err
)]
async fn get(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let story_id = path
        .story_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid story ID"))?;

    let result = sqlx::query_as::<_, Response>(
        r#"
WITH returning_readers AS (
    SELECT COUNT(*) AS count
    FROM (
        SELECT FROM story_reads
        WHERE
            story_id = $1
            AND user_id IS NOT NULL
        GROUP BY user_id
        HAVING
            COUNT(*) > 1
    ) AS result
),
reads_since_90_days AS (
    SELECT
        duration,
        device,
        country_code,
        hostname,
        created_at
    FROM
        story_reads
    WHERE
        story_id = $1
        AND created_at > NOW() - INTERVAL '90 days'
),
likes_since_90_days AS (
    SELECT created_at FROM
        story_likes
    WHERE
        story_id = $1
        AND created_at > NOW() - INTERVAL '90 days'
        AND deleted_at IS NULL
),
comments_since_60_days AS (
    SELECT created_at FROM
        comments
    WHERE
        story_id = $1
        AND created_at > NOW() - INTERVAL '60 days'
        AND deleted_at IS NULL
),
-- Reads
reads_90_days AS (
    SELECT COUNT(*) AS count
    FROM reads_since_90_days
),
reads_this_month AS (
    SELECT COUNT(*) AS count
    FROM reads_since_90_days
    WHERE
        created_at > NOW() - INTERVAL '30 days'
),
reads_last_month AS (
    SELECT COUNT(*) AS count
    FROM reads_since_90_days
    WHERE
        created_at < NOW() - INTERVAL '30 days'
        AND created_at > NOW() - INTERVAL '60 days'
),
-- Likes
likes_this_month AS (
    SELECT COUNT(*) AS count
    FROM likes_since_90_days
    WHERE
        created_at > NOW() - INTERVAL '30 days'
),
likes_last_month AS (
    SELECT COUNT(*) AS count
    FROM likes_since_90_days
    WHERE
        created_at < NOW() - INTERVAL '30 days'
        AND created_at > NOW() - INTERVAL '60 days'
),
-- Comments
comments_this_month AS (
    SELECT COUNT(*) AS count
    FROM comments_since_60_days
    WHERE
        created_at > NOW() - INTERVAL '30 days'
),
comments_last_month AS (
    SELECT COUNT(*) AS count
    FROM comments_since_60_days
    WHERE
        created_at < NOW() - INTERVAL '30 days'
),
-- Reading duration
reading_time_90_days AS (
    SELECT COALESCE(SUM(duration), 0) AS duration
    FROM reads_since_90_days
),
reading_time_this_month AS (
    SELECT COALESCE(SUM(duration), 0) AS duration
    FROM reads_since_90_days
    WHERE
        created_at > NOW() - INTERVAL '30 days'
),
reading_time_last_month AS (
    SELECT COALESCE(SUM(duration), 0) AS duration
    FROM reads_since_90_days
    WHERE
        created_at < NOW() - INTERVAL '30 days'
        AND created_at > NOW() - INTERVAL '60 days'
),
--
reading_time_stats AS (
    SELECT
        ROUND(
            (SELECT duration FROM reading_time_90_days)
            / COALESCE(
                NULLIF(
                    (SELECT count FROM reads_90_days),
                    0
                ),
                1
            )
        ) as "average_reading_time"
),
-- Read timeline
read_timeline AS (
    SELECT
        COALESCE(
            JSON_AGG(
                JSON_BUILD_ARRAY(
                    created_at,
                    count
                )
                ORDER BY created_at::DATE
            ),
            '[]'::JSON
        ) AS data
    FROM (
        SELECT
            created_at::DATE,
            COUNT(*) AS count
        FROM reads_since_90_days
        GROUP BY created_at::DATE
    ) AS result
),
-- Like timeline
like_timeline AS (
    SELECT
        COALESCE(
            JSON_AGG(
                JSON_BUILD_ARRAY(
                    created_at,
                    count
                )
                ORDER BY created_at::DATE
            ),
            '[]'::JSON
        ) AS data
    FROM (
        SELECT
            created_at::DATE,
            COUNT(*) AS count
        FROM likes_since_90_days
        GROUP BY created_at::DATE
    ) AS result
),
-- Reading time timeline
reading_time_timeline AS (
    SELECT
        COALESCE(
            JSON_AGG(
                JSON_BUILD_ARRAY(
                    created_at,
                    ROUND(
                        duration / 60,
                        1
                    )::FLOAT4
                )
                ORDER BY created_at::DATE
            ),
            '[]'::JSON
        ) AS data
    FROM (
        SELECT
            created_at::DATE,
            SUM(duration) AS duration
        FROM reads_since_90_days
        GROUP BY created_at::DATE
    ) AS result
),
-- Read mercator
read_mercator AS (
    SELECT
        COALESCE(
            JSON_AGG(
                JSON_BUILD_ARRAY(
                    country_code,
                    count
                )
                ORDER BY count DESC
            ) FILTER (
                -- Do not include data having less than 15 rows due to privacy reasons.
                WHERE count >= 15
            ),
            '[]'::JSON
        ) AS data
    FROM (
        SELECT
            country_code,
            COUNT(*) AS count
        FROM reads_since_90_days
        WHERE
            country_code IS NOT NULL
        GROUP BY country_code
    ) AS result
),
-- Device data
device_data AS (
    SELECT
        COALESCE(
            JSON_AGG(
                JSON_BUILD_ARRAY(
                    device,
                    count
                )
                ORDER BY count DESC
            ) FILTER (
                -- Do not include unknown devices.
                WHERE device <> 0
            ),
            '[]'::JSON
        ) AS data
    FROM (
        SELECT
            device,
            COUNT(*) AS count
        FROM reads_since_90_days
        GROUP BY device
    ) AS result
),
-- Referral data
referral_data AS (
    SELECT
        COALESCE(
            JSON_AGG(
                JSON_BUILD_ARRAY(
                    hostname,
                    count
                )
                ORDER BY count DESC
            ),
            '[]'::JSON
        ) AS data
    FROM (
        SELECT
            COALESCE(hostname, 'Internal') AS hostname,
            COUNT(*) AS count
        FROM reads_since_90_days
        GROUP BY hostname
    ) AS result
)
SELECT 
    view_count AS "total_views",
    read_count AS "total_reads",
    like_count AS "total_likes",
    comment_count AS "total_comments",
    --
    (SELECT count::INT4 FROM reads_90_days) AS "reads_last_three_months",
    (SELECT count::INT4 FROM returning_readers) AS "returning_readers",
    --
    (SELECT count::INT4 FROM reads_this_month) AS "reads_this_month",
    (SELECT count::INT4 FROM reads_last_month) AS "reads_last_month",
    --
    (SELECT count::INT4 FROM likes_this_month) AS "likes_this_month",
    (SELECT count::INT4 FROM likes_last_month) AS "likes_last_month",
    --
    (SELECT count::INT4 FROM comments_this_month) AS "comments_this_month",
    (SELECT count::INT4 FROM comments_last_month) AS "comments_last_month",
    --
    (SELECT duration::INT4 FROM reading_time_this_month) AS "reading_time_this_month",
    (SELECT duration::INT4 FROM reading_time_last_month) AS "reading_time_last_month",
    (SELECT average_reading_time::INT4 FROM reading_time_stats) AS "reading_time_average",
    (ROUND(
        COALESCE(
            NULLIF(word_count, 0),
            1
        ) / 250
    ) * 60)::INT4 AS "reading_time_estimate",
    --
    (SELECT data FROM read_timeline) AS "read_timeline",
    (SELECT data FROM like_timeline) AS "like_timeline",
    (SELECT data FROM reading_time_timeline) AS "reading_time_timeline",
    (SELECT data FROM read_mercator) AS "read_mercator",
    (SELECT data FROM referral_data) AS "referral_data",
    (SELECT data FROM device_data) AS "device_data"
FROM stories
WHERE
    id = $1
    AND user_id = $2
    AND published_at IS NOT NULL
    AND deleted_at IS NULL
"#,
    )
    .bind(story_id)
    .bind(user_id)
    .fetch_one(&data.db_pool)
    .await
    .map_err(|error| {
        if matches!(error, sqlx::Error::RowNotFound) {
            AppError::ClientError(StatusCode::NOT_FOUND, "Story not found".to_string())
        } else {
            AppError::SqlxError(error)
        }
    })?;

    let mut builder = HttpResponse::Ok();

    builder.insert_header(CacheControl(vec![
        CacheDirective::Private,
        CacheDirective::MaxAge(86400u32), // 24 hours
        CacheDirective::MustRevalidate,
    ]));

    Ok(builder.json(result))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_response_body_text,
        init_app_for_test,
        res_to_string,
    };
    use actix_web::test;
    use chrono::{
        prelude::*,
        Duration,
    };
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test(fixtures("story"))]
    async fn can_return_story_stats(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/stats", 4))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Response>(&res_to_string(res).await).unwrap();
        let read_mercator = vec![("IN".to_string(), 15)];
        let read_timeline = vec![
            (
                (Utc::now() - Duration::days(58))
                    .format("%Y-%m-%d")
                    .to_string(),
                1,
            ),
            (
                (Utc::now() - Duration::days(50))
                    .format("%Y-%m-%d")
                    .to_string(),
                1,
            ),
            (
                (Utc::now() - Duration::days(45))
                    .format("%Y-%m-%d")
                    .to_string(),
                2,
            ),
            (
                (Utc::now() - Duration::days(40))
                    .format("%Y-%m-%d")
                    .to_string(),
                1,
            ),
            (
                (Utc::now() - Duration::days(35))
                    .format("%Y-%m-%d")
                    .to_string(),
                1,
            ),
            (
                (Utc::now() - Duration::days(32))
                    .format("%Y-%m-%d")
                    .to_string(),
                1,
            ),
            (Utc::now().format("%Y-%m-%d").to_string(), 14),
        ];
        let referral_data = vec![
            ("Internal".to_string(), 9),
            ("bing.com".to_string(), 8),
            ("google.com".to_string(), 3),
            ("example.com".to_string(), 1),
        ];
        let device_data: Vec<(i32, i32)> = vec![(1, 17), (3, 2), (2, 2)];
        let like_timeline: Vec<(String, i32)> = vec![
            (
                (Utc::now() - Duration::days(45))
                    .format("%Y-%m-%d")
                    .to_string(),
                1,
            ),
            (Utc::now().format("%Y-%m-%d").to_string(), 1),
        ];
        let reading_time_timeline: Vec<(String, f32)> = vec![
            (
                (Utc::now() - Duration::days(58))
                    .format("%Y-%m-%d")
                    .to_string(),
                0.0,
            ),
            (
                (Utc::now() - Duration::days(50))
                    .format("%Y-%m-%d")
                    .to_string(),
                0.0,
            ),
            (
                (Utc::now() - Duration::days(45))
                    .format("%Y-%m-%d")
                    .to_string(),
                4.0,
            ),
            (
                (Utc::now() - Duration::days(40))
                    .format("%Y-%m-%d")
                    .to_string(),
                0.0,
            ),
            (
                (Utc::now() - Duration::days(35))
                    .format("%Y-%m-%d")
                    .to_string(),
                0.0,
            ),
            (
                (Utc::now() - Duration::days(32))
                    .format("%Y-%m-%d")
                    .to_string(),
                1.0,
            ),
            (Utc::now().format("%Y-%m-%d").to_string(), 21.0),
        ];

        assert_eq!(
            json,
            Response {
                comments_last_month: 1,
                comments_this_month: 2,
                device_data: sqlx::types::Json::from(device_data),
                like_timeline: sqlx::types::Json::from(like_timeline),
                likes_last_month: 1,
                likes_this_month: 1,
                read_mercator: sqlx::types::Json::from(read_mercator),
                read_timeline: sqlx::types::Json::from(read_timeline),
                reading_time_average: 86,
                reading_time_estimate: 0,
                reading_time_last_month: 497,
                reading_time_this_month: 1318,
                reading_time_timeline: sqlx::types::Json::from(reading_time_timeline),
                reads_last_month: 7,
                reads_last_three_months: 21,
                reads_this_month: 14,
                referral_data: sqlx::types::Json::from(referral_data),
                returning_readers: 3,
                total_comments: 4,
                total_likes: 3,
                total_reads: 22,
                total_views: 25,
            }
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_story_stats_for_a_minimal_story(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        let result = sqlx::query(
            r#"
INSERT INTO stories (user_id, published_at)
VALUES ($1, NOW())
RETURNING id
"#,
        )
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        let story_id = result.get::<i64, _>("id");

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{story_id}/stats"))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Response>(&res_to_string(res).await).unwrap();
        let read_mercator = vec![];
        let read_timeline = vec![];
        let referral_data = vec![];
        let device_data: Vec<(i32, i32)> = vec![];
        let like_timeline: Vec<(String, i32)> = vec![];
        let reading_time_timeline: Vec<(String, f32)> = vec![];

        assert_eq!(
            json,
            Response {
                comments_last_month: 0,
                comments_this_month: 0,
                device_data: sqlx::types::Json::from(device_data),
                like_timeline: sqlx::types::Json::from(like_timeline),
                likes_last_month: 0,
                likes_this_month: 0,
                read_mercator: sqlx::types::Json::from(read_mercator),
                read_timeline: sqlx::types::Json::from(read_timeline),
                reading_time_average: 0,
                reading_time_estimate: 0,
                reading_time_last_month: 0,
                reading_time_this_month: 0,
                reading_time_timeline: sqlx::types::Json::from(reading_time_timeline),
                reads_last_month: 0,
                reads_last_three_months: 0,
                reads_this_month: 0,
                referral_data: sqlx::types::Json::from(referral_data),
                returning_readers: 0,
                total_comments: 0,
                total_likes: 0,
                total_reads: 0,
                total_views: 0,
            }
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_a_story_stats_requests_for_an_unknown_story(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/stories/{}/stats", 12345))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Story not found").await;

        Ok(())
    }
}
