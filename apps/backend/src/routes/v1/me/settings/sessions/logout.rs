use crate::{
    constants::redis_namespaces::RedisNamespace,
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_web::{
    post,
    web,
    HttpResponse,
    Responder,
};
use actix_web_validator::Json;
use redis::{
    AsyncCommands,
    RedisResult,
};
use serde::Deserialize;
use validator::Validate;

// TODO: Write tests

#[derive(Debug, Deserialize, Validate)]
struct Request {
    #[validate(length(min = 8, max = 512, message = "Invalid session"))]
    id: String,
}

#[post("/v1/me/sessions/logout")]
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
                let result: RedisResult<()> = conn.del(cache_key).await;

                match result {
                    Ok(_) => HttpResponse::Ok().finish(),
                    Err(_) => HttpResponse::InternalServerError().finish(),
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
