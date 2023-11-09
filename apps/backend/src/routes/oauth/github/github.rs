use crate::{error::AppError, middleware::identity::identity::Identity, AppState};
use actix_session::Session;
use actix_web::http::header;
use actix_web::{get, web, HttpResponse};
use oauth2::{CsrfToken, Scope};

#[get("/oauth/github")]
async fn get(
    data: web::Data<AppState>,
    session: Session,
    _user: Identity,
) -> Result<HttpResponse, AppError> {
    let (authorize_url, csrf_token) = &data
        .oauth_client_map
        .github
        .authorize_url(CsrfToken::new_random)
        .add_scope(Scope::new("read:user".to_string()))
        .url();

    // Insert the CSRF token into the session. This is validated at the callback endpoint.
    let _ = session.insert("oauth_token", csrf_token.secret().to_string());

    Ok(HttpResponse::Found()
        .append_header((header::LOCATION, authorize_url.to_string()))
        .finish())
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}
