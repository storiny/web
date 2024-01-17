use super::{
    stories::{
        get_rsb_content_stories,
        Story,
    },
    tags::{
        get_rsb_content_tags,
        Tag,
    },
    users::{
        get_rsb_content_users,
        User,
    },
};
use crate::{
    error::AppError,
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_web::{
    get,
    web,
    HttpResponse,
};
use serde::{
    Deserialize,
    Serialize,
};

#[derive(Debug, Serialize, Deserialize)]
struct Response {
    stories: Vec<Story>,
    users: Vec<User>,
    tags: Vec<Tag>,
}

#[get("/v1/rsb-content")]
#[tracing::instrument(
    name = "GET /v1/rsb-content",
    skip_all,
    fields(
        user_id = tracing::field::Empty,
    ),
    err
)]
async fn get(
    data: web::Data<AppState>,
    maybe_user: Option<Identity>,
) -> Result<HttpResponse, AppError> {
    let user_id = maybe_user.map(|user| user.id()).transpose()?;

    tracing::Span::current().record("user_id", user_id);

    let (stories, users, tags) = tokio::try_join!(
        get_rsb_content_stories(user_id, &data.db_pool),
        get_rsb_content_users(user_id, &data.db_pool),
        get_rsb_content_tags(user_id, &data.db_pool)
    )?;

    Ok(HttpResponse::Ok().json(Response {
        stories,
        users,
        tags,
    }))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        init_app_for_test,
        res_to_string,
    };
    use actix_web::test;
    use sqlx::PgPool;

    #[sqlx::test(fixtures("rsb_content"))]
    async fn can_return_rsb_content(pool: PgPool) -> sqlx::Result<()> {
        let app = init_app_for_test(get, pool, false, false, None).await.0;

        let req = test::TestRequest::get().uri("/v1/rsb-content").to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Response>(&res_to_string(res).await);

        assert!(json.is_ok());

        Ok(())
    }

    #[sqlx::test(fixtures("rsb_content"))]
    async fn can_return_rsb_content_when_logged_in(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, true, Some(1_i64)).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/rsb-content")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Response>(&res_to_string(res).await);

        assert!(json.is_ok());

        Ok(())
    }
}
