use crate::{
    error::AppError,
    middlewares::identity::identity::Identity,
    utils::clear_user_sessions::clear_user_sessions,
    AppState,
};
use actix_web::{
    post,
    web,
    HttpResponse,
};

#[post("/v1/me/settings/sessions/destroy")]
#[tracing::instrument(
    name = "POST /v1/me/settings/sessions/destroy",
    skip_all,
    fields(user = user.id().ok()),
    err
)]
async fn post(user: Identity, data: web::Data<AppState>) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;

    clear_user_sessions(&data.redis, user_id).await?;
    user.logout();

    Ok(HttpResponse::Ok().finish())
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
    use sqlx::PgPool;
    use storiny_macros::test_context;
    use uuid::Uuid;

    mod serial {
        use super::*;

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_destroy_all_the_sessions(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let redis_pool = &ctx.redis_pool;
            let mut redis_conn = redis_pool.get().await.unwrap();
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

            // Insert some sessions.
            for _ in 0..5 {
                redis_conn
                    .set::<_, _, ()>(
                        &format!(
                            "{}:{}:{}",
                            RedisNamespace::Session,
                            user_id.unwrap(),
                            Uuid::new_v4()
                        ),
                        &rmp_serde::to_vec_named(&UserSession {
                            user_id: user_id.unwrap(),
                            ..Default::default()
                        })
                        .unwrap(),
                    )
                    .await
                    .unwrap();
            }

            let sessions = get_user_sessions(redis_pool, user_id.unwrap())
                .await
                .unwrap();

            assert!(!sessions.is_empty());

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri("/v1/me/settings/sessions/destroy")
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Sessions should not be present in the cache.
            let sessions = get_user_sessions(redis_pool, user_id.unwrap())
                .await
                .unwrap();

            assert!(sessions.is_empty());

            Ok(())
        }
    }
}
