use crate::{
    middlewares::identity::identity::Identity,
    utils::clear_user_sessions::clear_user_sessions,
    AppState,
};
use actix_web::{
    post,
    web,
    HttpResponse,
    Responder,
};

#[post("/v1/me/settings/sessions/destroy")]
async fn post(user: Identity, data: web::Data<AppState>) -> impl Responder {
    match user.id() {
        Ok(user_id) => {
            user.logout();

            match clear_user_sessions(&data.redis, user_id).await {
                Ok(_) => HttpResponse::Ok().finish(),
                Err(_) => HttpResponse::InternalServerError().finish(),
            }
        }
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        constants::redis_namespaces::RedisNamespace,
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
    use redis::AsyncCommands;
    use serial_test::serial;
    use sqlx::PgPool;
    use storiny_macros::test_context;
    use uuid::Uuid;

    #[test_context(RedisTestContext)]
    #[sqlx::test]
    #[serial(redis)]
    async fn can_destroy_all_sessions(
        ctx: &mut RedisTestContext,
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let redis_pool = &ctx.redis_pool;
        let mut redis_conn = redis_pool.get().await.unwrap();
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

        // Insert some sessions
        for _ in 0..5 {
            redis_conn
                .set::<_, _, ()>(
                    &format!(
                        "{}:{}:{}",
                        RedisNamespace::Session.to_string(),
                        user_id.unwrap(),
                        Uuid::new_v4()
                    ),
                    &serde_json::to_string(&UserSession {
                        user_id: user_id.unwrap(),
                        ..Default::default()
                    })
                    .unwrap(),
                )
                .await
                .unwrap();
        }

        let sessions = get_user_sessions(&redis_pool, user_id.unwrap())
            .await
            .unwrap();

        assert!(!sessions.is_empty());

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/settings/sessions/destroy")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Sessions should not be present in the cache
        let sessions = get_user_sessions(&redis_pool, user_id.unwrap())
            .await
            .unwrap();

        assert!(sessions.is_empty());

        Ok(())
    }
}
