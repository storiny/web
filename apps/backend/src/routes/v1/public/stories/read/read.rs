use crate::{
    constants::{
        reading_session::MAXIMUM_READING_SESSION_DURATION,
        redis_namespaces::RedisNamespace,
    },
    error::AppError,
    grpc::defs::login_activity_def::v1::DeviceType,
    middlewares::identity::identity::Identity,
    utils::{
        get_client_country::get_client_country,
        get_client_device::get_client_device,
    },
    AppState,
};
use actix_web::{
    post,
    web,
    HttpRequest,
    HttpResponse,
};
use actix_web_validator::QsQuery;
use redis::AsyncCommands;
use serde::{
    Deserialize,
    Serialize,
};
use std::net::IpAddr;
use validator::Validate;

// The minimum duration (in seconds) that the client needs to read the story before the `read_count`
// is incremented.
const MINIMUM_READ_DURATION: i16 = 30; // 30 seconds

#[derive(Deserialize, Validate)]
struct Fragments {
    story_id: String,
}

#[derive(Serialize, Deserialize, Validate)]
struct QueryParams {
    #[validate(length(min = 12, max = 64, message = "Invalid reading session"))]
    token: String,
    #[validate(length(max = 256, message = "Invalid referrer length"))]
    referrer: Option<String>,
}

#[post("/v1/public/stories/{story_id}/read")]
#[tracing::instrument(
    name = "POST /v1/public/stories/{story_id}/read",
    skip_all,
    fields(
        user_id = tracing::field::Empty,
        story_id = %path.story_id,
        payload
    ),
    err
)]
async fn post(
    req: HttpRequest,
    query: QsQuery<QueryParams>,
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    maybe_user: Option<Identity>,
) -> Result<HttpResponse, AppError> {
    let user_id = maybe_user.map(|user| user.id()).transpose()?;

    tracing::Span::current().record("user_id", user_id);

    let story_id = path
        .story_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid story ID"))?;

    let mut redis_conn = data.redis.get().await?;

    let cache_key = format!(
        "{}:{story_id}:{}",
        RedisNamespace::ReadingSession,
        &query.token
    );

    let session_ttl = redis_conn
        .ttl::<_, i32>(&cache_key)
        .await
        .map_err(|error| {
            AppError::InternalError(format!("unable to fetch the reading session: {error:?}"))
        })?;

    redis_conn.del::<_, ()>(&cache_key).await.map_err(|error| {
        AppError::InternalError(format!("unable to delete the reading session: {error:?}"))
    })?;

    // The command returns -1 if the key exists but has no associated expire, and -2 if the key does
    // not exist.
    if session_ttl < 0 {
        return Err(AppError::from("Invalid reading session"));
    }

    // Compute the elapsed reading duration using: MAXIMUM_READING_SESSION_DURATION - current ttl
    let elapsed_reading_duration = MAXIMUM_READING_SESSION_DURATION - (session_ttl as i16);

    // This should never happen provided that the keys expire after the TTL.
    if elapsed_reading_duration < 0 {
        return Err(AppError::InternalError(format!(
            "unexpected negative value for session duration: {elapsed_reading_duration}"
        )));
    }

    // We only proceed if the client reads the story for at-least `MINIMUM_READ_DURATION` seconds.
    if elapsed_reading_duration < MINIMUM_READ_DURATION {
        return Ok(HttpResponse::Ok().finish());
    }

    let mut country_code: Option<String> = None;
    let mut device: i32 = DeviceType::Unknown as i32;

    if let Some(ip) = req.connection_info().realip_remote_addr() {
        if let Ok(parsed_ip) = ip.parse::<IpAddr>() {
            if let Some(code) = get_client_country(parsed_ip, &data.geo_db) {
                country_code = Some(code);
            }
        }
    }

    if let Some(ua_header) = req.headers().get("user-agent") {
        if let Ok(ua) = ua_header.to_str() {
            device = get_client_device(ua, &data.ua_parser).r#type;
        }
    }

    let hostname = {
        if let Some(referrer) = &query.referrer {
            let referrer_url = url::Url::parse(referrer).ok();
            referrer_url.and_then(|ref_url| ref_url.host_str().map(|host| host.to_string()))
        } else {
            None
        }
    }
    // Ignore internal referrals
    .and_then(|host| {
        if host == "storiny.com" || host == "www.storiny.com" {
            None
        } else {
            Some(host.replace("www.", ""))
        }
    });

    match sqlx::query(
        r#"
WITH target_story AS (
    SELECT id FROM stories
    WHERE
        id = $6
        AND published_at IS NOT NULL
        AND deleted_at IS NULL
)
INSERT INTO story_reads (
    hostname,
    device,
    country_code,
    duration,
    user_id,
    story_id
)
SELECT $1, $2, $3, $4, $5,
    (SELECT id FROM target_story)
WHERE EXISTS (SELECT 1 FROM target_story)
"#,
    )
    .bind(&hostname)
    .bind(device)
    .bind(&country_code)
    .bind(elapsed_reading_duration)
    .bind(user_id)
    .bind(story_id)
    .execute(&data.db_pool)
    .await?
    .rows_affected()
    {
        0 => Err(AppError::from("Story not found")),
        _ => Ok(HttpResponse::NoContent().finish()),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_response_body_text,
        init_app_for_test,
        RedisTestContext,
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };
    use std::net::{
        Ipv4Addr,
        SocketAddr,
        SocketAddrV4,
    };
    use storiny_macros::test_context;
    use uuid::Uuid;

    #[sqlx::test]
    async fn can_handle_a_missing_reading_session(pool: PgPool) -> sqlx::Result<()> {
        let (app, _, _) = init_app_for_test(post, pool, false, false, None).await;

        let req = test::TestRequest::post()
            .uri(&format!(
                "/v1/public/stories/{}/read?token=invalid_token",
                12345
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(res, "Invalid reading session").await;

        Ok(())
    }

    mod serial {
        use super::*;
        use urlencoding::encode;

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("read"))]
        async fn can_read_a_story(ctx: &mut RedisTestContext, pool: PgPool) -> sqlx::Result<()> {
            let redis_pool = &ctx.redis_pool;
            let mut redis_conn = redis_pool.get().await.unwrap();
            let mut conn = pool.acquire().await?;
            let (app, _, _) = init_app_for_test(post, pool, false, false, None).await;

            let story_id = 3_i64;
            let session_token = Uuid::new_v4();
            let cache_key = format!(
                "{}:{story_id}:{session_token}",
                RedisNamespace::ReadingSession,
            );

            // Start a reading session.
            redis_conn
                .set_ex::<_, _, ()>(&cache_key, 0, MAXIMUM_READING_SESSION_DURATION as u64)
                .await
                .unwrap();

            // Wait for `MINIMUM_READ_DURATION`.
            tokio::time::sleep(tokio::time::Duration::from_secs(
                MINIMUM_READ_DURATION as u64,
            ))
            .await;

            let req = test::TestRequest::post()
                .uri(&format!(
                    "/v1/public/stories/{story_id}/read?token={session_token}"
                ))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Story read row should get inserted into the database.
            let result = sqlx::query(
                r#"
SELECT 1 FROM story_reads
WHERE story_id = $1
"#,
            )
            .bind(story_id)
            .fetch_all(&mut *conn)
            .await?;

            assert_eq!(result.len(), 1);

            // Reading session should not be present in the cache.
            let result = redis_conn.ttl::<_, i32>(&cache_key).await.unwrap();

            assert_eq!(result, -2_i32);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("read"))]
        async fn can_read_a_story_when_logged_in(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let redis_pool = &ctx.redis_pool;
            let mut redis_conn = redis_pool.get().await.unwrap();
            let mut conn = pool.acquire().await?;
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

            let story_id = 3_i64;
            let session_token = Uuid::new_v4();
            let cache_key = format!(
                "{}:{story_id}:{session_token}",
                RedisNamespace::ReadingSession,
            );

            // Start a reading session.
            redis_conn
                .set_ex::<_, _, ()>(&cache_key, 0, MAXIMUM_READING_SESSION_DURATION as u64)
                .await
                .unwrap();

            // Wait for `MINIMUM_READ_DURATION`.
            tokio::time::sleep(tokio::time::Duration::from_secs(
                MINIMUM_READ_DURATION as u64,
            ))
            .await;

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri(&format!(
                    "/v1/public/stories/{story_id}/read?token={session_token}"
                ))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Story read row should get inserted into the database.
            let result = sqlx::query(
                r#"
SELECT user_id FROM story_reads
WHERE story_id = $1
"#,
            )
            .bind(story_id)
            .fetch_all(&mut *conn)
            .await?;

            assert_eq!(result.len(), 1);
            assert_eq!(
                result.first().unwrap().get::<i64, _>("user_id"),
                user_id.unwrap()
            );

            // Reading session should not be present in the cache.
            let result = redis_conn.ttl::<_, i32>(&cache_key).await.unwrap();

            assert_eq!(result, -2_i32);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("read"))]
        async fn can_read_a_story_with_additional_client_data(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let redis_pool = &ctx.redis_pool;
            let mut redis_conn = redis_pool.get().await.unwrap();
            let mut conn = pool.acquire().await?;
            let (app, _, _) = init_app_for_test(post, pool, false, false, None).await;

            let story_id = 3_i64;
            let session_token = Uuid::new_v4();
            let cache_key = format!(
                "{}:{story_id}:{session_token}",
                RedisNamespace::ReadingSession,
            );

            // Start a reading session.
            redis_conn
                .set_ex::<_, _, ()>(&cache_key, 0, MAXIMUM_READING_SESSION_DURATION as u64)
                .await
                .unwrap();

            // Wait for `MINIMUM_READ_DURATION`.
            tokio::time::sleep(tokio::time::Duration::from_secs(
                (MINIMUM_READ_DURATION as u64) + 15,
            ))
            .await;

            let req = test::TestRequest::post()
                .peer_addr(SocketAddr::from(SocketAddrV4::new(
                    Ipv4Addr::new(8, 8, 8, 8),
                    8080,
                )))
                .append_header(("user-agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:40.0) Gecko/20100101 Firefox/40.0"))
                .uri(&format!("/v1/public/stories/{story_id}/read?token={session_token}&referrer={}", encode("https://example.com")))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Story read row should get inserted into the database.
            let result = sqlx::query(
                r#"
SELECT
    duration,
    hostname,
    device,
    country_code
FROM story_reads
WHERE story_id = $1
"#,
            )
            .bind(story_id)
            .fetch_one(&mut *conn)
            .await?;

            // Duration should in the expected range.
            assert!(
                result.get::<i16, _>("duration") > 40 && result.get::<i16, _>("duration") < 100
            );
            assert_eq!(
                result.get::<Option<String>, _>("hostname"),
                Some("example.com".to_string())
            );
            assert!(result.try_get::<i16, _>("device").is_ok());
            assert_eq!(
                result.get::<Option<String>, _>("country_code"),
                Some("US".to_string())
            );

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_a_session_with_short_reading_duration(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let redis_pool = &ctx.redis_pool;
            let mut redis_conn = redis_pool.get().await.unwrap();
            let mut conn = pool.acquire().await?;
            let (app, _, _) = init_app_for_test(post, pool, false, false, None).await;

            let story_id = 3_i64;
            let session_token = Uuid::new_v4();
            let cache_key = format!(
                "{}:{story_id}:{session_token}",
                RedisNamespace::ReadingSession,
            );

            // Start a reading session.
            redis_conn
                .set_ex::<_, _, ()>(&cache_key, 0, MAXIMUM_READING_SESSION_DURATION as u64)
                .await
                .unwrap();

            // Read immediately.
            let req = test::TestRequest::post()
                .uri(&format!(
                    "/v1/public/stories/{story_id}/read?token={session_token}"
                ))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Story read row should not be present in the database.
            let result = sqlx::query(
                r#"
SELECT 1 FROM story_reads
WHERE story_id = $1
"#,
            )
            .bind(story_id)
            .fetch_all(&mut *conn)
            .await?;

            assert!(result.is_empty());

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_handle_an_invalid_reading_session(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let redis_pool = &ctx.redis_pool;
            let mut redis_conn = redis_pool.get().await.unwrap();
            let (app, _, _) = init_app_for_test(post, pool, false, false, None).await;

            let story_id = 3_i64;
            let session_token = Uuid::new_v4();
            let cache_key = format!(
                "{}:{story_id}:{session_token}",
                RedisNamespace::ReadingSession,
            );

            // Start a reading session.
            redis_conn
                .set_ex::<_, _, ()>(&cache_key, 0, MAXIMUM_READING_SESSION_DURATION as u64)
                .await
                .unwrap();

            let req = test::TestRequest::post()
                // Use an invalid story ID with a valid token value.
                .uri(&format!(
                    "/v1/public/stories/{}/read?token={session_token}",
                    4
                ))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_client_error());
            assert_response_body_text(res, "Invalid reading session").await;

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("read"))]
        async fn should_not_read_a_soft_deleted_story(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let redis_pool = &ctx.redis_pool;
            let mut redis_conn = redis_pool.get().await.unwrap();
            let mut conn = pool.acquire().await?;
            let (app, _, _) = init_app_for_test(post, pool, false, false, None).await;

            let story_id = 3_i64;
            let session_token = Uuid::new_v4();
            let cache_key = format!(
                "{}:{story_id}:{session_token}",
                RedisNamespace::ReadingSession,
            );

            // Start a reading session.
            redis_conn
                .set_ex::<_, _, ()>(&cache_key, 0, MAXIMUM_READING_SESSION_DURATION as u64)
                .await
                .unwrap();

            // Wait for `MINIMUM_READ_DURATION`.
            tokio::time::sleep(tokio::time::Duration::from_secs(
                MINIMUM_READ_DURATION as u64,
            ))
            .await;

            // Soft-delete the story.
            let result = sqlx::query(
                r#"
UPDATE stories
SET deleted_at = NOW()
WHERE id = $1
"#,
            )
            .bind(story_id)
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            let req = test::TestRequest::post()
                .uri(&format!(
                    "/v1/public/stories/{story_id}/read?token={session_token}"
                ))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_client_error());
            assert_response_body_text(res, "Story not found").await;

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test(fixtures("read"))]
        async fn should_not_read_an_unpublished_story(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let redis_pool = &ctx.redis_pool;
            let mut redis_conn = redis_pool.get().await.unwrap();
            let mut conn = pool.acquire().await?;
            let (app, _, _) = init_app_for_test(post, pool, false, false, None).await;

            let story_id = 3_i64;
            let session_token = Uuid::new_v4();
            let cache_key = format!(
                "{}:{story_id}:{session_token}",
                RedisNamespace::ReadingSession,
            );

            // Start a reading session.
            redis_conn
                .set_ex::<_, _, ()>(&cache_key, 0, MAXIMUM_READING_SESSION_DURATION as u64)
                .await
                .unwrap();

            // Wait for `MINIMUM_READ_DURATION`.
            tokio::time::sleep(tokio::time::Duration::from_secs(
                MINIMUM_READ_DURATION as u64,
            ))
            .await;

            // Unpublish the story.
            let result = sqlx::query(
                r#"
UPDATE stories
SET published_at = NULL
WHERE id = $1
"#,
            )
            .bind(story_id)
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            let req = test::TestRequest::post()
                .uri(&format!(
                    "/v1/public/stories/{story_id}/read?token={session_token}"
                ))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_client_error());
            assert_response_body_text(res, "Story not found").await;

            Ok(())
        }
    }
}
