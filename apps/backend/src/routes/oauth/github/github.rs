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

#[get("/oauth/github")]
#[tracing::instrument(
    name = "GET /oauth/github",
    skip_all,
    fields(user = user.id().ok()),
    err
)]
async fn get(
    data: web::Data<AppState>,
    session: Session,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    user.id()?;

    let (authorize_url, csrf_token) = &data
        .oauth_client_map
        .github
        .authorize_url(CsrfToken::new_random)
        .add_scope(Scope::new("read:user".to_string()))
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
    async fn can_request_connecting_a_github_account(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, false, None).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/oauth/github")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert_eq!(res.status(), StatusCode::FOUND);

        Ok(())
    }
}
