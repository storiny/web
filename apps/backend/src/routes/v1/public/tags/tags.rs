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
use actix_web_validator::QsQuery;
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::{
    postgres::PgRow,
    Row,
};
use validator::Validate;

#[derive(Serialize, Deserialize, Validate)]
struct QueryParams {
    #[validate(length(min = 0, max = 160, message = "Invalid query length"))]
    query: String,
}

#[get("/v1/public/tags")]
#[tracing::instrument(
    name = "GET /v1/public/tags",
    skip_all,
    fields(
        user_id = user.id().ok(),
        query = %query.query
    ),
    err
)]
async fn get(
    query: QsQuery<QueryParams>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    user.id()?;

    let result = sqlx::query(
        r#"
WITH tags_result AS (
    WITH search_query AS (
        SELECT PLAINTO_TSQUERY('english', $1) AS tsq
    )
    SELECT
        -- Tag
        t.name,
        -- Query score
        TS_RANK_CD(t.search_vec, (SELECT tsq FROM search_query)) AS "query_score"
    FROM
        tags t
    WHERE
        t.search_vec @@ (SELECT tsq FROM search_query)
    ORDER BY
        query_score      DESC,
        t.follower_count DESC
    LIMIT $2
 )
SELECT name
FROM tags_result
"#,
    )
    .bind(&query.query)
    .bind(5_i16)
    .map(|row: PgRow| row.get::<String, _>("name"))
    .fetch_all(&data.db_pool)
    .await?;

    Ok(HttpResponse::Ok().json(result))
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
    use urlencoding::encode;

    #[sqlx::test(fixtures("tag"))]
    async fn can_search_tags(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(get, pool, true, false, None).await;

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/public/tags?query={}", encode("two")))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<String>>(&res_to_string(res).await).unwrap();

        assert_eq!(json.len(), 1);
        assert_eq!(json[0], "two".to_string());

        Ok(())
    }
}
