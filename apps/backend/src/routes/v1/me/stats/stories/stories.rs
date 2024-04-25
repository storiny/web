use crate::{
    error::AppError,
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_http::header;
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

#[derive(Debug, PartialEq, FromRow, Serialize, Deserialize)]
struct Response {
    #[serde(with = "crate::snowflake_id::option")]
    latest_story_id: Option<i64>,
    read_mercator: sqlx::types::Json<Vec<(String, i32)>>,
    read_timeline: sqlx::types::Json<Vec<(String, i32)>>,
    reading_time_last_month: i32,
    reading_time_this_month: i32,
    reads_last_month: i32,
    reads_last_three_months: i32,
    reads_this_month: i32,
    referral_data: sqlx::types::Json<Vec<(String, i32)>>,
    returning_readers: i32,
    total_reads: i32,
    total_views: i64,
}

#[get("/v1/me/stats/stories")]
#[tracing::instrument(
    name = "GET /v1/me/stats/stories",
    skip_all,
    fields(
        user_id = user.id().ok(),
    ),
    err
)]
async fn get(data: web::Data<AppState>, user: Identity) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;

    let result = sqlx::query_as::<_, Response>(
        r#"
WITH total_stats AS (
    SELECT
        COALESCE(SUM(view_count), 0) AS view_count,
        COALESCE(SUM(read_count), 0) AS read_count
    FROM stories
    WHERE
        user_id = $1
        AND published_at IS NOT NULL
        AND deleted_at IS NULL
),
latest_story AS (
    SELECT id
    FROM stories
    WHERE
        user_id = $1
        AND published_at IS NOT NULL
        AND deleted_at IS NULL
    ORDER BY published_at DESC
    LIMIT 1
),
returning_readers AS (
    SELECT COUNT(*) AS count
    FROM (
        SELECT FROM story_reads sr
            INNER JOIN stories s
                ON s.id = sr.story_id
                AND s.user_id = $1
                AND s.published_at IS NOT NULL
                AND s.deleted_at IS NULL
        WHERE
            sr.user_id IS NOT NULL
        GROUP BY sr.user_id
        HAVING
            COUNT(*) > 1
    ) AS result
),
reads_since_90_days AS (
    SELECT
        sr.duration,
        sr.country_code,
        sr.hostname,
        sr.created_at
    FROM
        story_reads sr
            INNER JOIN stories s
                ON s.id = sr.story_id
                AND s.user_id = $1
                AND s.published_at IS NOT NULL
                AND s.deleted_at IS NULL
    WHERE
        sr.created_at > NOW() - INTERVAL '90 days'
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
-- Reading duration
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
SELECT (SELECT read_count::INT4 FROM total_stats)           AS "total_reads",
	   (SELECT view_count::int8 FROM total_stats)           AS "total_views",
	   (SELECT count::int4 FROM reads_90_days)              AS "reads_last_three_months",
	   (SELECT count::int4 FROM returning_readers)          AS "returning_readers",
	   --
	   (SELECT count::int4 FROM reads_this_month)           AS "reads_this_month",
	   (SELECT count::int4 FROM reads_last_month)           AS "reads_last_month",
	   --
	   (SELECT duration::int4 FROM reading_time_this_month) AS "reading_time_this_month",
	   (SELECT duration::int4 FROM reading_time_last_month) AS "reading_time_last_month",
	   --
	   (SELECT data FROM read_timeline)                      AS "read_timeline",
	   (SELECT data FROM read_mercator)                      AS "read_mercator",
	   (SELECT data FROM referral_data)                       AS "referral_data",
	   -- 
	   (SELECT id FROM latest_story)                        AS "latest_story_id"
"#,
    )
    .bind(user_id)
    .fetch_one(&data.db_pool)
    .await?;

    let mut builder = HttpResponse::Ok();

    builder.insert_header(CacheControl(vec![
        CacheDirective::Private,
        CacheDirective::MaxAge(86400u32), // 24 hours
        CacheDirective::MustRevalidate,
    ]));

    builder.append_header((header::VARY, "x-storiny-uid"));

    Ok(builder.json(result))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        init_app_for_test,
        res_to_string,
    };
    use actix_web::test;
    use chrono::{
        Duration,
        Utc,
    };
    use sqlx::PgPool;

    #[sqlx::test(fixtures("stories"))]
    async fn can_return_stories_stats(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stats/stories")
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

        assert_eq!(
            json,
            Response {
                latest_story_id: Some(4),
                read_mercator: sqlx::types::Json::from(read_mercator),
                read_timeline: sqlx::types::Json::from(read_timeline),
                reading_time_last_month: 497,
                reading_time_this_month: 1318,
                reads_last_month: 7,
                reads_last_three_months: 21,
                reads_this_month: 14,
                referral_data: sqlx::types::Json::from(referral_data),
                returning_readers: 3,
                total_reads: 22,
                total_views: 50,
            }
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_stories_stats_for_a_minimal_account(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, false, None).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stats/stories")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Response>(&res_to_string(res).await).unwrap();

        assert_eq!(
            json,
            Response {
                latest_story_id: None,
                read_mercator: sqlx::types::Json::from(Vec::new()),
                read_timeline: sqlx::types::Json::from(Vec::new()),
                reading_time_last_month: 0,
                reading_time_this_month: 0,
                reads_last_month: 0,
                reads_last_three_months: 0,
                reads_this_month: 0,
                referral_data: sqlx::types::Json::from(Vec::new()),
                returning_readers: 0,
                total_reads: 0,
                total_views: 0,
            }
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_no_latest_story(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, false, None).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stats/stories")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Response>(&res_to_string(res).await).unwrap();

        assert!(json.latest_story_id.is_none());

        Ok(())
    }
}
