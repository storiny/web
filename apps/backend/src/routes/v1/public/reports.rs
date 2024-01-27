use crate::{
    constants::report_type::REPORT_TYPE_VEC,
    error::{
        AppError,
        FormErrorResponse,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    utils::{
        check_report_limit::check_report_limit,
        incr_report_limit::incr_report_limit,
    },
    AppState,
};
use actix_web::{
    http::StatusCode,
    post,
    web,
    HttpRequest,
    HttpResponse,
};
use actix_web_validator::Json;
use serde::{
    Deserialize,
    Serialize,
};
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(length(min = 0, max = 1024, message = "Invalid reason length"))]
    r#type: String,
    #[validate(length(min = 0, max = 1024, message = "Invalid reason length"))]
    reason: String,
    #[validate(length(min = 1, max = 64, message = "Invalid entity ID"))]
    entity_id: String,
}

#[post("/v1/public/reports")]
#[tracing::instrument(
    name = "POST /v1/public/reports",
    skip_all,
    fields(
        user_id = tracing::field::Empty,
        payload
    ),
    err
)]
async fn post(
    req: HttpRequest,
    payload: Json<Request>,
    data: web::Data<AppState>,
    maybe_user: Option<Identity>,
) -> Result<HttpResponse, AppError> {
    let user_id = maybe_user.map(|user| user.id()).transpose()?;

    tracing::Span::current().record("user_id", user_id);

    let report_limit_identifier = if let Some(user_id) = user_id {
        // Always use `user_id` when logged-in
        Some(user_id.to_string())
    } else {
        req.connection_info()
            .realip_remote_addr()
            .map(|ip| ip.to_string())
    };

    let report_limit_identifier = match report_limit_identifier {
        Some(value) => value,
        None => {
            // TODO: If the client IP cannot be parsed and the user is not logged-in, we simply
            // fake the report creation here for now.
            return Ok(HttpResponse::Created().finish());
        }
    };

    if !check_report_limit(&data.redis, &report_limit_identifier).await? {
        return Err(ToastErrorResponse::new(
            Some(StatusCode::TOO_MANY_REQUESTS),
            "Daily limit exceeded for reporting content. Try again tomorrow.",
        )
        .into());
    }

    let reason = payload.reason.clone();
    let r#type = payload.r#type.clone();
    let entity_id = payload.entity_id.parse::<i64>().map_err(|_| {
        AppError::FormError(FormErrorResponse::new(
            None,
            vec![("entity_id", "Invalid entity ID")],
        ))
    })?;

    // Validate report type.
    if !REPORT_TYPE_VEC.contains(&r#type) {
        return Err(AppError::from("Invalid report type"));
    }

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    match sqlx::query(
        r#"
INSERT INTO reports (entity_id, type, reason)
VALUES ($1, $2, $3)
"#,
    )
    .bind(entity_id)
    .bind(&r#type)
    .bind(&reason)
    .execute(&mut *txn)
    .await?
    .rows_affected()
    {
        0 => Err(AppError::InternalError(
            "unable to insert the report".to_string(),
        )),
        _ => {
            incr_report_limit(&data.redis, &report_limit_identifier).await?;

            txn.commit().await?;

            Ok(HttpResponse::Created().finish())
        }
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        constants::{
            redis_namespaces::RedisNamespace,
            report_type::ReportType,
            resource_limit::ResourceLimit,
        },
        test_utils::{
            assert_form_error_response,
            init_app_for_test,
            RedisTestContext,
        },
    };
    use actix_web::test;
    use futures_util::future;
    use redis::AsyncCommands;
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

    #[test_context(RedisTestContext)]
    #[sqlx::test]
    async fn can_add_a_report(ctx: &mut RedisTestContext, pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let app = init_app_for_test(post, pool, false, false, None).await.0;

        let req = test::TestRequest::post()
            .peer_addr(SocketAddr::from(SocketAddrV4::new(
                Ipv4Addr::new(8, 8, 8, 8),
                8080,
            )))
            .uri("/v1/public/reports")
            .set_json(Request {
                r#type: ReportType::Other.to_string(),
                reason: "Report reason".to_string(),
                entity_id: "1".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Report should be present in the database.
        let result = sqlx::query(
            r#"
SELECT reason FROM reports
WHERE entity_id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("reason"),
            "Report reason".to_string()
        );

        let redis_pool = &ctx.redis_pool;
        let mut redis_conn = redis_pool.get().await.unwrap();

        // Should also increment the report limit.
        let result = redis_conn
            .get::<_, u32>(&format!(
                "{}:{}:{}",
                RedisNamespace::ResourceLimit,
                ResourceLimit::CreateReport as i32,
                "8.8.8.8"
            ))
            .await
            .expect("report limit has not been set");

        assert_eq!(result, 1);

        Ok(())
    }

    #[test_context(RedisTestContext)]
    #[sqlx::test]
    async fn can_add_a_report_when_logged_in(
        ctx: &mut RedisTestContext,
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/public/reports")
            .set_json(Request {
                r#type: ReportType::Other.to_string(),
                reason: "Report reason".to_string(),
                entity_id: "1".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Report should be present in the database.
        let result = sqlx::query(
            r#"
SELECT reason FROM reports
WHERE entity_id = $1
"#,
        )
        .bind(1_i64)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(
            result.get::<String, _>("reason"),
            "Report reason".to_string()
        );

        let redis_pool = &ctx.redis_pool;
        let mut redis_conn = redis_pool.get().await.unwrap();

        // Should also increment the report limit.
        let result = redis_conn
            .get::<_, u32>(&format!(
                "{}:{}:{}",
                RedisNamespace::ResourceLimit,
                ResourceLimit::CreateReport as i32,
                user_id.unwrap()
            ))
            .await
            .expect("report limit has not been set");

        assert_eq!(result, 1);

        Ok(())
    }

    #[test_context(RedisTestContext)]
    #[sqlx::test]
    async fn can_reject_a_report_on_exceeding_the_report_limit(
        ctx: &mut RedisTestContext,
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let redis_pool = &ctx.redis_pool;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        let user_id = user_id.unwrap();
        let user_id_str = user_id.to_string();
        let mut incr_futures = vec![];

        for _ in 0..ResourceLimit::CreateReport.get_limit() + 1 {
            incr_futures.push(incr_report_limit(redis_pool, &user_id_str));
        }

        future::join_all(incr_futures).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/public/reports")
            .set_json(Request {
                r#type: ReportType::Other.to_string(),
                reason: "Report reason".to_string(),
                entity_id: "1".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert_eq!(res.status(), StatusCode::TOO_MANY_REQUESTS);

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_report_for_an_invalid_entity_id(pool: PgPool) -> sqlx::Result<()> {
        let app = init_app_for_test(post, pool, false, false, None).await.0;

        let req = test::TestRequest::post()
            .peer_addr(SocketAddr::from(SocketAddrV4::new(
                Ipv4Addr::new(8, 8, 8, 8),
                8080,
            )))
            .uri("/v1/public/reports")
            .set_json(Request {
                r#type: ReportType::Other.to_string(),
                reason: "Report reason".to_string(),
                entity_id: "invalid_id".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(res, vec![("entity_id", "Invalid entity ID")]).await;

        Ok(())
    }
}
