use crate::{error::AppError, middleware::identity::identity::Identity, AppState};
use actix_web::http::header;
use actix_web::{get, web, HttpResponse};
use oauth2::{CsrfToken, PkceCodeChallenge, Scope};

#[get("/oauth/youtube")]
async fn get(
    data: web::Data<AppState>,
    // TODO: user: Identity
) -> Result<HttpResponse, AppError> {
    let (authorize_url, _) = &data
        .oauth_client_map
        .youtube
        .authorize_url(CsrfToken::new_random)
        .add_scope(Scope::new(
            "https://www.googleapis.com/auth/youtube.readonly".to_string(),
        ))
        .url();

    Ok(HttpResponse::Found()
        .append_header((header::LOCATION, authorize_url.to_string()))
        .finish())
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}

// #[cfg(test)]
// mod tests {
//     use super::*;
//     use crate::test_utils::{init_app_for_test, res_to_string};
//     use actix_web::test;
//     use sqlx::PgPool;
//
//     #[sqlx::test(fixtures("rsb_content"))]
//     async fn can_return_rsb_content(pool: PgPool) -> sqlx::Result<()> {
//         let app = init_app_for_test(get, pool, false, false).await.0;
//
//         let req = test::TestRequest::get().uri("/v1/rsb_content").to_request();
//         let res = test::call_service(&app, req).await;
//
//         assert!(res.status().is_success());
//
//         let json = serde_json::from_str::<Response>(&res_to_string(res).await);
//
//         assert!(json.is_ok());
//
//         Ok(())
//     }
// }
