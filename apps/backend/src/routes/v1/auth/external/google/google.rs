use crate::{
    error::AppError,
    middlewares::identity::identity::Identity,
    AppState,
};
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
use storiny_session::Session;

#[get("/v1/auth/external/google")]
async fn get(
    data: web::Data<AppState>,
    session: Session,
    // TODO: (alpha) Remove identity guard in beta
    _user: Identity,
) -> Result<HttpResponse, AppError> {
    let (authorize_url, csrf_token) = &data
        .oauth_client_map
        .google
        .authorize_url(CsrfToken::new_random)
        .add_scopes(vec![
            Scope::new("https://www.googleapis.com/auth/userinfo.email".to_string()),
            Scope::new("https://www.googleapis.com/auth/userinfo.profile".to_string()),
        ])
        .add_extra_param("prompt", "consent")
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
