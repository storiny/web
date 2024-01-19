use crate::{
    constants::pexels::PEXELS_API_URL,
    error::AppError,
    middlewares::identity::identity::Identity,
    models::photo::PexelsResponse,
    AppState,
};
use actix_web::{
    get,
    web,
    HttpResponse,
};
use actix_web_validator::QsQuery;
use serde::{
    Deserialize,
    Serialize,
};
use validator::Validate;

#[derive(Serialize, Deserialize, Validate)]
struct QueryParams {
    #[validate(range(min = 1, max = 1000))]
    page: Option<u16>,
    #[validate(length(min = 0, max = 160, message = "Invalid query length"))]
    query: Option<String>,
}

#[get("/v1/me/gallery")]
#[tracing::instrument(
    name = "GET /v1/me/gallery",
    skip_all,
    fields(
        user_id = user.id().ok(),
        page = query.page,
        query = query.query
    ),
    err
)]
async fn get(
    query: QsQuery<QueryParams>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    user.id()?;

    let reqwest_client = &data.reqwest_client;
    let pexels_api_key = &data.config.pexels_api_key.to_string();

    let page = query.page.unwrap_or(1);
    let search_query = query.query.clone().unwrap_or_default();
    let has_search_query = !search_query.trim().is_empty();

    let response = reqwest_client
        .get(format!(
            "{}/{}",
            PEXELS_API_URL,
            if has_search_query {
                "v1/search"
            } else {
                "v1/curated"
            }
        ))
        .query(&[("per_page", 15), ("page", page)])
        .query(&[("query", search_query)])
        .header(reqwest::header::AUTHORIZATION, pexels_api_key)
        .send()
        .await
        .map_err(|error| {
            AppError::InternalError(format!("unable to fetch photos from Pexels: {error:?}"))
        })?;

    if !response.status().is_success() {
        return Err(AppError::InternalError(format!(
            "unable to fetch photos from Pexels: {response:?}"
        )));
    };

    let body = serde_json::from_str::<PexelsResponse>(&response.text().await.unwrap_or_default())
        .map_err(|error| {
        AppError::InternalError(format!(
            "unable to deserialize the Pexels response: {error:?}"
        ))
    })?;

    Ok(HttpResponse::Ok().json(body.photos))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        models::photo::Photo,
        test_utils::{
            init_app_for_test,
            res_to_string,
        },
    };
    use actix_web::test;
    use sqlx::PgPool;
    use urlencoding::encode;

    #[sqlx::test]
    async fn can_return_gallery_photos(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, false, None).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/gallery")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Photo>>(&res_to_string(res).await);

        assert!(json.is_ok());

        Ok(())
    }

    #[sqlx::test]
    async fn can_search_gallery_photos(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, false, None).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/gallery?query={}", encode("dog")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Photo>>(&res_to_string(res).await);

        assert!(json.is_ok());

        Ok(())
    }
}
