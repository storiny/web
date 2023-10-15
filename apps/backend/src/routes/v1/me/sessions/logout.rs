use crate::{
    middleware::identity::identity::Identity,
    AppState,
};
use actix_redis::{
    resp_array,
    Command,
};
use actix_web::{
    post,
    web,
    HttpResponse,
    Responder,
};
use actix_web_validator::Json;
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
        Ok(user_id) => {
            let redis = &data.redis.as_ref().unwrap();
            let cache_key = format!("s:{}:{}", user_id, &payload.id);
            let _ = redis.send(Command(resp_array!["DEL", &cache_key])).await;
            HttpResponse::Ok().finish()
        }
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}
