use crate::{
    constants::redis_namespaces::RedisNamespace,
    error::{
        AppError,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    utils::get_user_sessions::UserSession,
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

#[post("/v1/me/settings/sessions/acknowledge")]
#[tracing::instrument(
    name = "POST /v1/me/settings/sessions/acknowledge",
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

    let result = redis_conn
        .get::<_, Option<Vec<u8>>>(&cache_key)
        .await
        .map_err(|error| {
            AppError::InternalError(format!("unable to fetch the session from Redis: {error:?}"))
        })?;

    if let Some(session_str) = result {
        let mut session = rmp_serde::from_slice::<UserSession>(&session_str).map_err(|error| {
            AppError::InternalError(format!("unable to deserialize the user session: {error:?}"))
        })?;

        session.ack = true; // Acknowledge the session

        let next_session_data = rmp_serde::to_vec_named(&session).map_err(|error| {
            AppError::InternalError(format!("unable to serialize the user session: {error:?}"))
        })?;

        redis::cmd("SET")
            .arg(&cache_key)
            .arg(&next_session_data)
            .arg("XX") // XX - Only set if the key already exist
            .arg("KEEPTTL") // KEEPTTL - Keep the TTL for the key
            .query_async::<_, ()>(&mut *redis_conn)
            .await
            .map_err(|error| {
                AppError::InternalError(format!("unable to save the user session: {error:?}"))
            })?;

        Ok(HttpResponse::NoContent().finish())
    } else {
        Err(ToastErrorResponse::new(None, "Session not found").into())
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        test_utils::{
            assert_toast_error_response,
            init_app_for_test,
            RedisTestContext,
        },
        utils::get_user_sessions::get_user_sessions,
    };
    use actix_web::test;
    use sqlx::PgPool;
    use storiny_macros::test_context;
    use uuid::Uuid;

    #[sqlx::test]
    async fn can_reject_an_invalid_session(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/sessions/acknowledge")
            .set_json(Request {
                id: "invalid_session".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Session not found").await;

        Ok(())
    }

    mod serial {
        use super::*;

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_acknowledge_a_session(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let redis_pool = &ctx.redis_pool;
            let mut redis_conn = redis_pool.get().await.unwrap();
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;
            let session_token = Uuid::new_v4();

            // Insert an unacknowledged session for the user.
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

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri("/v1/me/settings/sessions/acknowledge")
                .set_json(Request {
                    id: session_token.to_string(),
                })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Session should get acknowledged in the cache.
            let sessions = get_user_sessions(redis_pool, user_id.unwrap())
                .await
                .unwrap();

            assert!(sessions.iter().any(|(_, session)| session.ack));

            Ok(())
        }
    }
}
