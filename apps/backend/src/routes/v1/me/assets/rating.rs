use crate::{
    error::{AppError, ToastErrorResponse},
    middleware::identity::identity::Identity,
    AppState,
};
use actix_web::{patch, web, HttpResponse};
use actix_web_validator::Json;
use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(range(min = 1, max = 4, message = "Invalid asset rating"))]
    rating: u8,
}

#[derive(Deserialize, Validate)]
struct Fragments {
    id: String,
}

#[patch("/v1/me/assets/{id}/rating")]
async fn patch(
    payload: Json<Request>,
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => match path.id.parse::<i64>() {
            Ok(asset_id) => {
                match sqlx::query(
                    r#"
                    UPDATE assets
                    SET rating = $1
                    WHERE id = $2 AND user_id = $3
                    "#,
                )
                .bind(payload.rating.clone() as i16)
                .bind(asset_id)
                .bind(user_id)
                .execute(&data.db_pool)
                .await?
                .rows_affected()
                {
                    0 => Ok(HttpResponse::BadRequest()
                        .json(ToastErrorResponse::new("Asset not found".to_string()))),
                    _ => Ok(HttpResponse::NoContent().finish()),
                }
            }
            Err(_) => Ok(HttpResponse::BadRequest().body("Invalid asset ID")),
        },
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(patch);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{assert_toast_error_response, init_app_for_test};
    use actix_web::test;
    use sqlx::{PgPool, Row};
    use uuid::Uuid;

    #[sqlx::test]
    async fn can_update_rating_for_an_asset(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false).await;

        // Insert an asset
        let result = sqlx::query(
            r#"
            INSERT INTO assets(key, hex, height, width, user_id) 
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, rating
            "#,
        )
        .bind(Uuid::new_v4())
        .bind("000000".to_string())
        .bind(0)
        .bind(0)
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        // Should be `NOT_RATED` by default
        assert_eq!(result.get::<i16, _>("rating"), 1_i16);

        let asset_id = result.get::<i64, _>("id");

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/assets/{}/rating", asset_id))
            .set_json(Request { rating: 2 })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Asset rating should get updated in the database
        let asset = sqlx::query(
            r#"
            SELECT rating FROM assets
            WHERE id = $1
            "#,
        )
        .bind(asset_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(asset.get::<i16, _>("rating"), 2_i16);

        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_a_missing_asset(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(patch, pool, true, false).await;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/assets/12345/rating")
            .set_json(Request { rating: 2 })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Asset not found").await;

        Ok(())
    }
}
