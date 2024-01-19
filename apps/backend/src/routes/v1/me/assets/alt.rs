use crate::{
    error::{
        AppError,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_web::{
    patch,
    web,
    HttpResponse,
};
use actix_web_validator::Json;
use serde::{
    Deserialize,
    Serialize,
};
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(length(min = 0, max = 128, message = "Invalid alt text length"))]
    alt: String,
}

#[derive(Deserialize, Validate)]
struct Fragments {
    asset_id: String,
}

#[patch("/v1/me/assets/{asset_id}/alt")]
#[tracing::instrument(
    name = "PATCH /v1/me/assets/{asset_id}/alt",
    skip_all,
    fields(
        user_id = user.id().ok(),
        asset_id = %path.asset_id,
        alt = %payload.alt
    ),
    err
)]
async fn patch(
    payload: Json<Request>,
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let asset_id = path
        .asset_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid asset ID"))?;

    match sqlx::query(
        r#"
UPDATE assets
SET alt = $1
WHERE
    id = $2
    AND user_id = $3
"#,
    )
    .bind(&payload.alt)
    .bind(asset_id)
    .bind(user_id)
    .execute(&data.db_pool)
    .await?
    .rows_affected()
    {
        0 => Err(ToastErrorResponse::new(None, "Asset not found").into()),
        _ => Ok(HttpResponse::NoContent().finish()),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(patch);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_toast_error_response,
        init_app_for_test,
    };
    use actix_web::test;
    use sqlx::{
        PgPool,
        Row,
    };
    use uuid::Uuid;

    #[sqlx::test]
    async fn can_update_alt_text_for_an_asset(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(patch, pool, true, false, None).await;

        // Insert an asset.
        let result = sqlx::query(
            r#"
INSERT INTO assets (key, hex, height, width, user_id) 
VALUES ($1, $2, $3, $4, $5)
RETURNING id, alt
"#,
        )
        .bind(Uuid::new_v4())
        .bind("000000".to_string())
        .bind(0)
        .bind(0)
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(result.get::<String, _>("alt"), "".to_string());

        let asset_id = result.get::<i64, _>("id");

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/assets/{}/alt", asset_id))
            .set_json(Request {
                alt: "Next alt text".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Asset alt text should get updated in the database.
        let asset = sqlx::query(
            r#"
SELECT alt FROM assets
WHERE id = $1
"#,
        )
        .bind(asset_id)
        .fetch_one(&mut *conn)
        .await?;

        assert_eq!(asset.get::<String, _>("alt"), "Next alt text".to_string());

        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_a_missing_asset(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(patch, pool, true, false, None).await;

        let req = test::TestRequest::patch()
            .cookie(cookie.unwrap())
            .uri("/v1/me/assets/12345/alt")
            .set_json(Request {
                alt: "Next alt text".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Asset not found").await;

        Ok(())
    }
}
