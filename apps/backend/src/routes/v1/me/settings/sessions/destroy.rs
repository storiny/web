use crate::{
    middleware::identity::identity::Identity,
    utils::get_user_sessions::get_user_sessions,
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
        Ok(user_id) => match (&data.redis).get().await {
            Ok(ref mut conn) => {
                user.logout();

                let user_sessions = get_user_sessions(&data.redis, user_id).await;

                if user_sessions.is_err() {
                    return HttpResponse::InternalServerError().finish();
                }

                let session_keys = user_sessions
                    .unwrap()
                    .iter()
                    .map(|(key, _)| key.to_string())
                    .collect::<Vec<_>>();

                let mut pipe = redis::pipe();
                pipe.atomic();

                for key in session_keys {
                    pipe.del(key).ignore();
                }

                match pipe.query_async::<_, ()>(&mut *conn).await {
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
