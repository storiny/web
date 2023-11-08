use crate::{error::AppError, middleware::identity::identity::Identity, AppState};
use actix_session::Session;
use actix_web::http::header;
use actix_web::{get, web, HttpResponse};
use oauth2::{CsrfToken, Scope};

#[get("/oauth/youtube")]
async fn get(
    data: web::Data<AppState>,
    session: Session,
    _user: Identity,
) -> Result<HttpResponse, AppError> {
    let (authorize_url, csrf_token) = &data
        .oauth_client_map
        .youtube
        .authorize_url(CsrfToken::new_random)
        .add_scope(Scope::new(
            "https://www.googleapis.com/auth/youtube.readonly".to_string(),
        ))
        .url();

    let _ = session.insert("oauth_token", csrf_token.secret().to_string());

    Ok(HttpResponse::Found()
        .append_header((header::LOCATION, authorize_url.to_string()))
        .finish())
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}
