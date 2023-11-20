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

// TODO: Write tests

#[post("/v1/me/sessions/destroy")]
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
