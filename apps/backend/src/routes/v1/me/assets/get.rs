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

use sqlx::FromRow;
use time::OffsetDateTime;
use uuid::Uuid;
use validator::Validate;

#[derive(Serialize, Deserialize, Validate)]
struct QueryParams {
    #[validate(range(min = 1, max = 1000))]
    page: Option<u16>,
}

#[derive(Debug, FromRow, Serialize, Deserialize)]
struct Asset {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    key: Uuid,
    hex: String,
    alt: String,
    rating: i16,
    favourite: bool, // This is casted as bool from `favourited_at`
    height: i16,
    width: i16,
    // Timestamps
    #[serde(with = "crate::iso8601::time")]
    created_at: OffsetDateTime,
}

#[get("/v1/me/assets")]
#[tracing::instrument(
    name = "GET /v1/me/assets",
    skip_all,
    fields(
        user_id = user.id().ok(),
        page = query.page
    ),
    err
)]
async fn get(
    query: QsQuery<QueryParams>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let page = query.page.unwrap_or(1) - 1;

    let result = sqlx::query_as::<_, Asset>(
        r#"
SELECT
    id,
    key,
    hex,
    alt,
    rating,
    height,
    width,
    created_at,
    favourited_at IS NOT NULL AS "favourite"
FROM
    assets
WHERE
    user_id = $1
ORDER BY
    favourited_at DESC NULLS LAST,
    created_at DESC
LIMIT $2 OFFSET $3
"#,
    )
    .bind(user_id)
    // This route returns 15 items per call.
    .bind(15_i16)
    .bind((page * 15) as i16)
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
    use sqlx::{
        PgPool,
        Row,
    };

    #[sqlx::test]
    async fn can_return_assets(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert some assets.
        let insert_result = sqlx::query(
            r#"
INSERT INTO assets (key, hex, height, width, user_id, favourited_at) 
VALUES
    ($1, $2, $3, $4, $5, NOW()),
    ($6, $2, $3, $4, $5, NULL)
"#,
        )
        .bind(Uuid::new_v4())
        .bind("000000".to_string())
        .bind(0)
        .bind(0)
        .bind(user_id)
        .bind(Uuid::new_v4())
        .execute(&mut *conn)
        .await?;

        assert_eq!(insert_result.rows_affected(), 2);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/assets")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        let json = serde_json::from_str::<Vec<Asset>>(&res_to_string(res).await);

        assert!(json.is_ok());

        let results = json.unwrap();

        // Assets are sorted by `favourited_at` DESC (NULLS LAST), so the first asset in the result
        // must have `favourite` set to `true`.
        assert!(results[0].favourite);
        // The second asset should have `favourite` set to `false`, casted from the `NULL` value.
        assert!(!results[1].favourite);

        Ok(())
    }

    #[sqlx::test]
    async fn can_return_favourite_flag_for_assets(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(get, pool, true, false, None).await;

        // Insert an asset.
        let insert_result = sqlx::query(
            r#"
INSERT INTO assets (key, hex, height, width, user_id) 
VALUES ($1, $2, $3, $4, $5)
RETURNING id
"#,
        )
        .bind(Uuid::new_v4())
        .bind("000000".to_string())
        .bind(0)
        .bind(0)
        .bind(user_id)
        .bind(Uuid::new_v4())
        .fetch_one(&mut *conn)
        .await?;

        let asset_id = insert_result.get::<i64, _>("id");

        let req = test::TestRequest::get()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/assets")
            .to_request();
        let res = test::call_service(&app, req).await;

        let json = serde_json::from_str::<Vec<Asset>>(&res_to_string(res).await).unwrap();
        let asset = &json[0];

        // Should false initially.
        assert!(!asset.favourite);

        // Add the asset to favourites.
        let result = sqlx::query(
            r#"
UPDATE assets
SET favourited_at = NOW()
WHERE id = $1
"#,
        )
        .bind(asset_id)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::get()
            .cookie(cookie.unwrap())
            .uri("/v1/me/assets")
            .to_request();
        let res = test::call_service(&app, req).await;

        let json = serde_json::from_str::<Vec<Asset>>(&res_to_string(res).await).unwrap();
        let asset = &json[0];

        // Should be set to `true`.
        assert!(asset.favourite);

        Ok(())
    }
}
