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
        get_client_location::get_client_location,
    },
    AppState,
};
use actix_web::{
    post,
    web,
    HttpRequest,
    HttpResponse,
};
use actix_web_validator::Json;
use redis::{
    AsyncCommands,
    RedisResult,
};
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::{
    postgres::PgQueryResult,
    Error,
};
use std::net::IpAddr;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    story_id: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(length(min = 12, max = 64, message = "Invalid reading session"))]
    token: String,
    //  TODO   referrer
}

#[post("/v1/public/stories/{story_id}/read")]
async fn post(
    req: HttpRequest,
    payload: Json<Request>,
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Option<Identity>,
) -> Result<HttpResponse, AppError> {
    match path.story_id.parse::<i64>() {
        Ok(story_id) => {
            match (&data.redis).get().await {
                Ok(ref mut conn) => {
                    let cache_key = format!(
                        "{}:{story_id}:{}",
                        RedisNamespace::ReadingSession.to_string(),
                        &payload.token
                    );

                    match conn.ttl::<_, i32>(&cache_key).await {
                        Ok(ttl) => {
                            let _: RedisResult<()> = conn.del(&cache_key).await;

                            // The command returns -1 if the key exists but has no associated
                            // expire, and -2 if the key does not exist.
                            if ttl < 0 {
                                return Ok(
                                    HttpResponse::BadRequest().body("Invalid reading session")
                                );
                            }

                            // Compute the elapsed reading duration using:
                            // MAXIMUM_READING_SESSION_DURATION - current ttl
                            let elapsed_reading_duration =
                                MAXIMUM_READING_SESSION_DURATION - (ttl as i16);

                            // This should never happen provided that the keys expire after the TTL
                            if elapsed_reading_duration < 0 {
                                return Ok(HttpResponse::InternalServerError().finish());
                            }

                            let mut country_code: Option<String> = None;
                            let mut device: i32 = DeviceType::Unknown as i32;

                            if let Some(ip) = req.connection_info().realip_remote_addr() {
                                if let Ok(parsed_ip) = ip.parse::<IpAddr>() {
                                    if let Some(code) = get_client_country(parsed_ip, &data.geo_db)
                                    {
                                        country_code = Some(code);
                                    }
                                }
                            }

                            if let Some(ua_header) = (&req.headers()).get("user-agent") {
                                if let Ok(ua) = ua_header.to_str() {
                                    device = get_client_device(ua, &data.ua_parser).r#type;
                                }
                            }

                            match sqlx::query(
                                r#"
                                WITH target_story AS (
                                    SELECT id FROM stories
                                    WHERE
                                        id = $1
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
                                VALUES (
                                    $1, $2, $3, $4, $5,
                                    (SELECT id FROM target_story)
                                )
                               "#,
                            )
                            .bind(device)
                            .bind(country_code)
                            .bind(elapsed_reading_duration)
                            .bind(user.and_then(|user| user.id().ok()))
                            .bind(story_id)
                            .execute(&data.db_pool)
                            .await
                            {
                                Ok(_) => {}
                                Err(_) => {}
                            };

                            Ok(HttpResponse::NoContent().finish())
                        }
                        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
                    }
                }
                Err(_) => Ok(HttpResponse::InternalServerError().finish()),
            }
        }
        Err(_) => Ok(HttpResponse::BadRequest().body("Invalid story ID")),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_toast_error_response,
        init_app_for_test,
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test(fixtures("visibility"))]
    async fn can_hide_and_unhide_a_reply(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Hide the reply
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/public/replies/{}/visibility", 2))
            .set_json(Request { hidden: true })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // `hidden` should get updated in the database
        let asset = sqlx::query(
            r#"
            SELECT hidden FROM replies
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(asset.get::<bool, _>("hidden"));

        // Unhide the reply
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/public/replies/{}/visibility", 2))
            .set_json(Request { hidden: false })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // `hidden` should get updated in the database
        let asset = sqlx::query(
            r#"
            SELECT hidden FROM replies
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert!(!asset.get::<bool, _>("hidden"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_a_missing_reply(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/public/replies/12345/visibility")
            .set_json(Request { hidden: false })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Reply not found").await;

        Ok(())
    }

    #[sqlx::test(fixtures("visibility"))]
    async fn should_not_hide_reply_on_a_comment_posted_by_a_different_user(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Change the writer of the comment
        let result = sqlx::query(
            r#"
            WITH new_user AS (
                INSERT INTO users(name, username, email)
                VALUES ('New user', 'new_user', 'new@example.com')
                RETURNING id
            )
            UPDATE comments
            SET user_id = (SELECT id FROM new_user)
            WHERE user_id = $1
            "#,
        )
        .bind(user_id.unwrap())
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Try hiding the reply
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/public/replies/{}/visibility", 2))
            .set_json(Request { hidden: true })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Reply not found").await;

        Ok(())
    }

    #[sqlx::test(fixtures("visibility"))]
    async fn should_not_hide_a_soft_deleted_reply(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, _) = init_app_for_test(post, pool, true, true, Some(1_i64)).await;

        // Soft-delete the reply
        let result = sqlx::query(
            r#"
            UPDATE replies
            SET deleted_at = now()
            WHERE id = $1
            "#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        // Try hiding the reply
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/public/replies/{}/visibility", 2))
            .set_json(Request { hidden: true })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Reply not found").await;

        Ok(())
    }
}
