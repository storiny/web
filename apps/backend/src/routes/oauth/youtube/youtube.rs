use crate::{
    error::AppError,
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_extended_session::Session;
use actix_web::{
    get,
    http::header,
    web,
    HttpResponse,
};
use oauth2::{
    CsrfToken,
    Scope,
};
use serde_json::Value;

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

    // Insert the CSRF token into the session. This is validated at the callback endpoint.
    session.insert("oauth_token", Value::from(csrf_token.secret().to_string()));

    Ok(HttpResponse::Found()
        .append_header((header::LOCATION, authorize_url.to_string()))
        .finish())
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}
