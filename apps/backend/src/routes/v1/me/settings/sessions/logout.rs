use crate::{
    constants::redis_namespaces::RedisNamespace,
    error::AppError,
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_web::{
    post,
    web,
    HttpResponse,
};
use actix_web_validator::Json;
use redis::AsyncCommands;
use serde::{
    Deserialize,
    Serialize,
};
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(length(min = 8, max = 512, message = "Invalid session"))]
    id: String,
}

#[post("/v1/me/settings/sessions/logout")]
#[tracing::instrument(
    name = "POST /v1/me/settings/sessions/logout",
    skip_all,
    fields(user = user.id().ok()),
    err
)]
async fn post(
    user: Identity,
    payload: Json<Request>,
    data: web::Data<AppState>,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let mut redis_conn = data.redis.get().await?;

    let cache_key = format!(
        "{}:{user_id}:{}",
        RedisNamespace::Session,
        &payload.id
    );

    redis_conn.del::<_, ()>(cache_key).await.map_err(|error| {
        AppError::InternalError(format!("unable to delete the session: {error:?}"))
    })?;

    Ok(HttpResponse::Ok().finish())
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        test_utils::{
            init_app_for_test,
            RedisTestContext,
        },
        utils::get_user_sessions::{
            get_user_sessions,
            UserSession,
        },
    };
    use actix_web::test;
    use sqlx::PgPool;
    use storiny_macros::test_context;
    use uuid::Uuid;

    #[sqlx::test]
    async fn should_not_throw_when_logging_out_from_an_invalid_session(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/sessions/logout")
            .set_json(Request {
                id: "invalid_session".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        Ok(())
    }

    mod serial {
        use super::*;

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_logout_from_a_session(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let redis_pool = &ctx.redis_pool;
            let mut redis_conn = redis_pool.get().await.unwrap();
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, true, None).await;
            let session_token = Uuid::new_v4();

            // Insert a session for the user.
            let _: () = redis_conn
                .set(
                    &format!(
                        "{}:{}:{}",
                        RedisNamespace::Session,
                        user_id.unwrap(),
                        session_token
                    ),
                    &rmp_serde::to_vec_named(&UserSession {
                        user_id: user_id.unwrap(),
                        ..Default::default()
                    })
                    .unwrap(),
                )
                .await
                .unwrap();

            // Should have 2 sessions initially.
            let sessions = get_user_sessions(redis_pool, user_id.unwrap())
                .await
                .unwrap();

            assert_eq!(sessions.len(), 2);

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri("/v1/me/settings/sessions/logout")
                .set_json(Request {
                    id: session_token.to_string(),
                })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Cache should only have the current session.
            let sessions = get_user_sessions(redis_pool, user_id.unwrap())
                .await
                .unwrap();

            assert_eq!(sessions.len(), 1);

            Ok(())
        }
    }
}
