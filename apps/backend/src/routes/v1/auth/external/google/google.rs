use crate::{
    error::AppError,
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
#[tracing::instrument(name = "GET /v1/auth/external/google", skip_all, err)]
async fn get(data: web::Data<AppState>, session: Session) -> Result<HttpResponse, AppError> {
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::init_app_for_test;
    use actix_web::{
        http::StatusCode,
        test,
    };
    use sqlx::PgPool;

    #[sqlx::test]
    async fn can_request_login_through_google(pool: PgPool) -> sqlx::Result<()> {
        let (app, _, _) = init_app_for_test(get, pool, false, false, None).await;

        let req = test::TestRequest::get()
            .uri("/v1/auth/external/google")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert_eq!(res.status(), StatusCode::FOUND);

        Ok(())
    }
}
