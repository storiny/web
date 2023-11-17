use crate::{middleware::identity::identity::Identity, AppState};
use actix_web::{post, web, HttpResponse, Responder};
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

#[post("/v1/me/sessions/logout")]
async fn post(
    user: Identity,
    payload: Json<Request>,
    data: web::Data<AppState>,
) -> actix_web::Result<impl Responder> {
    match user.id() {
        Ok(user_id) => {
            let mut conn = &data.redis.get().await.map_err(|_| ())?;
            let cache_key = format!("s:{}:{}", user_id.to_string(), &payload.id);
            let _: () = conn
                .del(cache_key)
                .await
                .map_err(|_| HttpResponse::InternalServerError().finish())?;

            HttpResponse::Ok().finish()
        }
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}
