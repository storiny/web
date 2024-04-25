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
    follow_timeline: sqlx::types::Json<Vec<(String, i32)>>,
    follows_last_month: i32,
    follows_this_month: i32,
    total_followers: i32,
    total_subscribers: i32,
}

#[get("/v1/me/stats/account")]
#[tracing::instrument(
    name = "GET /v1/me/stats/account",
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
WITH subscriber_count AS (
    SELECT COUNT(*) AS count
    FROM
        relations
    WHERE
            followed_id = $1
        AND subscribed_at IS NOT NULL
        AND deleted_at IS NULL
),
follower_count AS (
    SELECT follower_count AS count
    FROM users
    WHERE
        id = $1
),
follows_since_90_days AS (
    SELECT created_at
    FROM relations
    WHERE
        followed_id = $1
        AND created_at > NOW() - INTERVAL '90 days'
        AND deleted_at IS NULL
),
follows_this_month AS (
    SELECT COUNT(*) AS count
    FROM follows_since_90_days
    WHERE
        created_at > NOW() - INTERVAL '30 days'
),
follows_last_month AS (
    SELECT COUNT(*) AS count
    FROM follows_since_90_days
    WHERE
        created_at < NOW() - INTERVAL '30 days'
        AND created_at > NOW() - INTERVAL '60 days'
),
follow_timeline AS (
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
        SELECT created_at::DATE, COUNT(*) AS count
        FROM follows_since_90_days
        GROUP BY created_at::DATE
    ) AS result
)
SELECT (SELECT count::INT4 FROM subscriber_count)   AS "total_subscribers",
	   (SELECT count::INT4 FROM follower_count)     AS "total_followers",
	   (SELECT count::INT4 FROM follows_this_month) AS "follows_this_month",
	   (SELECT count::INT4 FROM follows_last_month) AS "follows_last_month",
	   (SELECT data FROM follow_timeline)      AS "follow_timeline";
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

    #[sqlx::test(fixtures("account"))]
    async fn can_return_account_stats(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stats/account")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Response>(&res_to_string(res).await).unwrap();
        let follow_timeline = vec![
            (
                (Utc::now() - Duration::days(45))
                    .format("%Y-%m-%d")
                    .to_string(),
                1,
            ),
            (Utc::now().format("%Y-%m-%d").to_string(), 1),
        ];

        assert_eq!(
            json,
            Response {
                follow_timeline: sqlx::types::Json::from(follow_timeline),
                total_followers: 3,
                total_subscribers: 1,
                follows_last_month: 1,
                follows_this_month: 1
            }
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_account_stats_for_a_minimal_account(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, false, None).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/stats/account")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Response>(&res_to_string(res).await).unwrap();
        let follow_timeline = vec![];

        assert_eq!(
            json,
            Response {
                follow_timeline: sqlx::types::Json::from(follow_timeline),
                total_followers: 0,
                total_subscribers: 0,
                follows_last_month: 0,
                follows_this_month: 0
            }
        );

        Ok(())
    }
}
