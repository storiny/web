use crate::{
    constants::redis_namespaces::RedisNamespace,
    error::ToastErrorResponse,
    middlewares::identity::identity::Identity,
    utils::get_user_sessions::UserSession,
    AppState,
};
use actix_web::{
    post,
    web,
    HttpResponse,
    Responder,
};
use actix_web_validator::Json;
use redis::AsyncCommands;
use serde::Deserialize;
use validator::Validate;

// TODO: Write tests

#[derive(Debug, Deserialize, Validate)]
struct Request {
    #[validate(length(min = 8, max = 512, message = "Invalid session"))]
    id: String,
}

#[post("/v1/me/sessions/acknowledge")]
async fn post(user: Identity, payload: Json<Request>, data: web::Data<AppState>) -> impl Responder {
    match user.id() {
        Ok(user_id) => match (&data.redis).get().await {
            Ok(ref mut conn) => {
                let cache_key = format!(
                    "{}:{}:{}",
                    RedisNamespace::Session.to_string(),
                    user_id.to_string(),
                    &payload.id
                );

                match conn.get::<_, String>(&cache_key).await {
                    Ok(session_data) => match serde_json::from_str::<UserSession>(&session_data) {
                        Ok(mut session) => {
                            session.ack = true; // Acknowledge the session
                            let next_session_data = serde_json::to_string(&session);

                            if next_session_data.is_err() {
                                return HttpResponse::InternalServerError().finish();
                            }

                            let result = redis::cmd("SET")
                                .arg(&cache_key)
                                .arg(&next_session_data.unwrap())
                                .arg("XX") // XX - Only set if the key already exist
                                .arg("KEEPTTL") // KEEPTTL - Keep the TTL for the key
                                .query_async::<_, ()>(conn)
                                .await;

                            if result.is_err() {
                                return HttpResponse::InternalServerError().finish();
                            }

                            HttpResponse::NoContent().finish()
                        }
                        Err(_) => HttpResponse::InternalServerError().finish(),
                    },
                    Err(_) => HttpResponse::BadRequest()
                        .json(ToastErrorResponse::new("Session not found")),
                }
            }
            Err(_) => HttpResponse::InternalServerError().finish(),
        },
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}
