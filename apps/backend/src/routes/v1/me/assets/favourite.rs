use crate::{
    error::{
        AppError,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    AppState,
};
use actix_web::{
    delete,
    post,
    web,
    HttpResponse,
};
use serde::Deserialize;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    asset_id: String,
}

#[post("/v1/me/assets/{asset_id}/favourite")]
#[tracing::instrument(
    name = "POST /v1/me/assets/{asset_id}/favourite",
    skip_all,
    fields(
        user_id = user.id().ok(),
        asset_id = %path.asset_id
    ),
    err
)]
async fn post(
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
SET favourited_at = NOW()
WHERE
    id = $1
    AND user_id = $2
"#,
    )
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

#[delete("/v1/me/assets/{asset_id}/favourite")]
#[tracing::instrument(
    name = "DELETE /v1/me/assets/{asset_id}/favourite",
    skip_all,
    fields(
        user_id = user.id().ok(),
        asset_id = %path.asset_id
    ),
    err
)]
async fn delete(
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
SET favourited_at = NULL
WHERE
    id = $1
    AND user_id = $2
"#,
    )
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
    cfg.service(post);
    cfg.service(delete);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{
        assert_toast_error_response,
        init_app_for_test,
    };
    use actix_web::{
        services,
        test,
    };
    use sqlx::{
        PgPool,
        Row,
    };
    use time::OffsetDateTime;
    use uuid::Uuid;

    #[sqlx::test]
    async fn can_favourite_and_unfavourite_an_asset(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) =
            init_app_for_test(services![post, delete], pool, true, false, None).await;

        // Insert an asset.
        let result = sqlx::query(
            r#"
INSERT INTO assets (key, hex, height, width, user_id) 
VALUES ($1, $2, $3, $4, $5)
RETURNING id, favourited_at
"#,
        )
        .bind(Uuid::new_v4())
        .bind("000000".to_string())
        .bind(0)
        .bind(0)
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.try_get::<i64, _>("id").is_ok());
        // `favourited_at` should be NULL initially.
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("favourited_at")
                .is_none()
        );

        let asset_id = result.get::<i64, _>("id");

        // Add the asset to favourites.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/assets/{}/favourite", asset_id))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // `favourited_at` should get updated in the database.
        let asset = sqlx::query(
            r#"
SELECT favourited_at FROM assets
WHERE id = $1
"#,
        )
        .bind(asset_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            asset
                .get::<Option<OffsetDateTime>, _>("favourited_at")
                .is_some()
        );

        // Remove the asset from favourites.
        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/assets/{}/favourite", asset_id))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // `favourited_at` should get updated in the database.
        let asset = sqlx::query(
            r#"
SELECT favourited_at FROM assets
WHERE id = $1
"#,
        )
        .bind(asset_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(
            asset
                .get::<Option<OffsetDateTime>, _>("favourited_at")
                .is_none()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_a_missing_asset(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) =
            init_app_for_test(services![post, delete], pool, true, false, None).await;

        // Post
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri("/v1/me/assets/12345/favourite")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Asset not found").await;

        // Delete
        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri("/v1/me/assets/12345/favourite")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Asset not found").await;

        Ok(())
    }

    #[sqlx::test]
    async fn should_not_throw_when_the_favourited_at_column_is_not_modified(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) =
            init_app_for_test(services![post, delete], pool, true, false, None).await;

        // Insert an asset.
        let result = sqlx::query(
            r#"
INSERT INTO assets (key, hex, height, width, user_id) 
VALUES ($1, $2, $3, $4, $5)
RETURNING id, favourited_at
"#,
        )
        .bind(Uuid::new_v4())
        .bind("000000".to_string())
        .bind(0)
        .bind(0)
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(result.try_get::<i64, _>("id").is_ok());
        // `favourited_at` should be NULL initially.
        assert!(
            result
                .get::<Option<OffsetDateTime>, _>("favourited_at")
                .is_none()
        );

        let asset_id = result.get::<i64, _>("id");

        // Add the asset to favourites.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/assets/{}/favourite", asset_id))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Try adding the asset to favourites again.
        let req = test::TestRequest::post()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/assets/{}/favourite", asset_id))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should not throw.
        assert!(res.status().is_success());

        // Remove the asset from favourites.
        let req = test::TestRequest::delete()
            .cookie(cookie.clone().unwrap())
            .uri(&format!("/v1/me/assets/{}/favourite", asset_id))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Try removing the asset from favourites again.
        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/assets/{}/favourite", asset_id))
            .to_request();
        let res = test::call_service(&app, req).await;

        // Should not throw.
        assert!(res.status().is_success());

        Ok(())
    }
}
