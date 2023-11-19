use crate::{
    error::AppError,
    middleware::identity::identity::Identity,
    utils::decode_uri_encoded_story_categories::decode_uri_encoded_story_categories,
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
use sqlx::FromRow;
use validator::Validate;

#[derive(Serialize, Deserialize, Validate)]
struct QueryParams {
    #[validate(length(min = 1, max = 1024, message = "Missing or invalid categories hash"))]
    encoded_categories: String,
}

#[derive(sqlx::Type, Debug, Serialize, Deserialize)]
struct Tag {
    id: i64,
    name: String,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct Response {
    category: String,
    tags: Vec<Tag>,
}

#[get("/v1/me/flow/onboarding/tags")]
async fn get(
    query: QsQuery<QueryParams>,
    data: web::Data<AppState>,
    _user: Identity,
) -> Result<HttpResponse, AppError> {
    match decode_uri_encoded_story_categories(&query.encoded_categories) {
        Ok(categories) => {
            let result = sqlx::query_file_as!(
                Response,
                "queries/me/onboarding/tags.sql",
                // https://github.com/launchbadge/sqlx/blob/main/FAQ.md#how-can-i-do-a-select--where-foo-in--query
                &categories[..] as _
            )
            .fetch_all(&data.db_pool)
            .await?;

            Ok(HttpResponse::Ok().json(result))
        }
        Err(_) => Ok(HttpResponse::BadRequest().body("Invalid encoded categories data")),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        models::story::StoryCategory,
        test_utils::{
            init_app_for_test,
            res_to_string,
        },
    };
    use actix_web::test;
    use sqlx::PgPool;

    #[sqlx::test(fixtures("tag"))]
    async fn can_return_onboarding_tags(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, false, None).await;
        let encoded_categories = lz_str::compress_to_encoded_uri_component(&format!(
            "{}|{}",
            StoryCategory::Travel.to_string(),
            StoryCategory::DIY.to_string()
        ));

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/flow/onboarding/tags?encoded_categories={}",
                encoded_categories
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Response>>(&res_to_string(res).await);

        assert!(json.is_ok());

        Ok(())
    }
}
