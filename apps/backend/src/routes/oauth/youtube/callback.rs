use crate::oauth::icons::youtube::YOUTUBE_LOGO;
use crate::{error::AppError, AppState, ConnectionTemplate};
use actix_web::http::header::{self, ContentType};
use actix_web::{get, web, HttpResponse};
use actix_web_validator::QsQuery;
use oauth2::{reqwest::async_http_client, AuthorizationCode, CsrfToken, TokenResponse};
use sailfish::TemplateOnce;
use serde::Deserialize;
use validator::Validate;

#[derive(Deserialize, Validate)]
pub struct AuthRequest {
    code: String,
    state: String,
    scope: String,
}

#[derive(Debug, Deserialize)]
struct Snippet {
    title: String,
}

#[derive(Debug, Deserialize)]
struct Item {
    id: String,
    snippet: Snippet,
}

#[derive(Debug, Deserialize)]
struct Response {
    items: Vec<Item>,
}

async fn handle_oauth_request(
    data: &web::Data<AppState>,
    params: &QsQuery<AuthRequest>,
) -> Result<(), ()> {
    let reqwest_client = &data.reqwest_client;
    let code = AuthorizationCode::new(params.code.clone());
    let state = CsrfToken::new(params.state.clone());
    let _scope = params.scope.clone();

    let token = (&data.oauth_client_map.youtube).exchange_code(code);
    let token_res = token
        .request_async(async_http_client)
        .await
        .map_err(|_| ())?;

    let res = reqwest_client
        .get(&format!(
            "https://youtube.googleapis.com/youtube/v3/channels?{}&{}&{}&{}",
            "part=snippet",
            "maxResults=1",
            "mine=true",
            format!("key={}", &data.config.youtube_data_api_key)
        ))
        .header("Content-type", ContentType::json().to_string())
        .header(
            header::AUTHORIZATION,
            format!("Bearer {}", token_res.unwrap().access_token().secret()),
        )
        .send()
        .await
        .map_err(|_| ())?
        .json::<Response>()
        .await
        .map_err(|_| ())?;

    // TODO: Save to DB

    Ok(())
}

#[get("/oauth/youtube/callback")]
async fn get(
    data: web::Data<AppState>,
    params: QsQuery<AuthRequest>,
    // user: Identity
) -> Result<HttpResponse, AppError> {
    let result = handle_oauth_request(&data, &params).await;

    Ok(HttpResponse::Ok().content_type(ContentType::html()).body(
        ConnectionTemplate {
            is_error: result.is_err(),
            provider_icon: YOUTUBE_LOGO.to_string(),
            provider_name: "YouTube".to_string(),
        }
        .render_once()
        .unwrap(),
    ))
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
