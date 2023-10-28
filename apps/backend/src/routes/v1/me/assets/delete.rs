use crate::{
    constants::buckets::S3_UPLOADS_BUCKET,
    error::{AppError, ToastErrorResponse},
    middleware::identity::identity::Identity,
    AppState,
};
use actix_web::{delete, web, HttpResponse};
use rusoto_s3::{DeleteObjectRequest, S3};
use serde::Deserialize;
use sqlx::Row;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    id: String,
}

#[delete("/v1/me/assets/{id}")]
async fn delete(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => match path.id.parse::<i64>() {
            Ok(asset_id) => {
                match sqlx::query(
                    r#"
                    SELECT key FROM assets
                    WHERE id = $1 AND user_id = $2
                    "#,
                )
                .bind(asset_id)
                .bind(user_id)
                .fetch_one(&data.db_pool)
                .await
                {
                    Ok(result) => {
                        let s3_client = &data.s3_client;
                        let asset_key = result.get::<String, _>("key");

                        // Delete the object from S3
                        let delete_result = s3_client
                            .delete_object(DeleteObjectRequest {
                                bucket: S3_UPLOADS_BUCKET.to_string(),
                                key: asset_key,
                                ..Default::default()
                            })
                            .await;

                        if delete_result.is_ok() {
                            // Remove asset metadata
                            sqlx::query(
                                r#"
                               DELETE FROM assets
                               WHERE id = $1 
                               "#,
                            )
                            .bind(asset_id)
                            .execute(&data.db_pool)
                            .await?;

                            Ok(HttpResponse::Ok().finish())
                        } else {
                            Ok(HttpResponse::InternalServerError().finish())
                        }
                    }
                    Err(kind) => match kind {
                        sqlx::Error::RowNotFound => Ok(HttpResponse::BadRequest()
                            .json(ToastErrorResponse::new("Asset not found".to_string()))),
                        _ => Ok(HttpResponse::InternalServerError().finish()),
                    },
                }
            }
            Err(_) => Ok(HttpResponse::BadRequest().body("Invalid asset ID")),
        },
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(delete);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::test_utils::{assert_toast_error_response, init_app_for_test};
    use actix_web::test;
    use sqlx::PgPool;

    #[sqlx::test]
    async fn can_delete_an_asset(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false).await;

        // Insert an asset
        let insert_result = sqlx::query(
            r#"
            INSERT INTO assets(key, hex, height, width, user_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
            "#,
        )
        .bind("some_key".to_string())
        .bind("000000".to_string())
        .bind(0)
        .bind(0)
        .bind(user_id)
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/assets/{}",
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        // Should be deleted from the database
        let result = sqlx::query(
            r#"
            SELECT EXISTS(
                SELECT 1 FROM assets
                WHERE id = $1
            )
            "#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .fetch_one(&mut *conn)
        .await?;

        assert!(!result.get::<bool, _>("exists"));

        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_a_missing_asset(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(delete, pool, true, false).await;

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri("/v1/me/assets/12345")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Asset not found").await;

        Ok(())
    }
}
