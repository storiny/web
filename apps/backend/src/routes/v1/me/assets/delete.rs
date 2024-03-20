use crate::{
    constants::buckets::S3_UPLOADS_BUCKET,
    error::{
        AppError,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    utils::delete_s3_objects::delete_s3_objects,
    AppState,
};
use actix_web::{
    delete,
    web,
    HttpResponse,
};
use serde::Deserialize;
use sqlx::Row;
use uuid::Uuid;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    asset_id: String,
}

#[delete("/v1/me/assets/{asset_id}")]
#[tracing::instrument(
    name = "DELETE /v1/me/assets/{asset_id}",
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

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    let asset = sqlx::query(
        r#"
SELECT key FROM assets
WHERE
    id = $1
    AND user_id = $2
"#,
    )
    .bind(asset_id)
    .bind(user_id)
    .fetch_one(&mut *txn)
    .await
    .map_err(|error| {
        if matches!(error, sqlx::Error::RowNotFound) {
            AppError::ToastError(ToastErrorResponse::new(None, "Asset not found"))
        } else {
            AppError::SqlxError(error)
        }
    })?;

    let s3_client = &data.s3_client;
    let asset_key = asset.get::<Uuid, _>("key");

    // Delete the object from S3.
    delete_s3_objects(s3_client, S3_UPLOADS_BUCKET, vec![asset_key.to_string()])
        .await
        .map_err(|error| {
            AppError::InternalError(format!("unable to delete the asset from s3: {error:?}",))
        })?;

    sqlx::query(
        r#"
DELETE FROM assets
WHERE id = $1 
"#,
    )
    .bind(asset_id)
    .execute(&mut *txn)
    .await?;

    txn.commit().await?;

    Ok(HttpResponse::Ok().finish())
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(delete);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        test_utils::{
            assert_toast_error_response,
            count_s3_objects,
            get_s3_client,
            init_app_for_test,
            TestContext,
        },
        utils::delete_s3_objects_using_prefix::delete_s3_objects_using_prefix,
        S3Client,
    };
    use actix_web::test;
    use sqlx::PgPool;
    use storiny_macros::test_context;

    struct LocalTestContext {
        s3_client: S3Client,
    }

    #[async_trait::async_trait]
    impl TestContext for LocalTestContext {
        async fn setup() -> LocalTestContext {
            LocalTestContext {
                s3_client: get_s3_client().await,
            }
        }

        async fn teardown(self) {
            delete_s3_objects_using_prefix(&self.s3_client, S3_UPLOADS_BUCKET, None, None)
                .await
                .unwrap();
        }
    }

    #[sqlx::test]
    async fn can_handle_a_missing_asset(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(delete, pool, true, false, None).await;

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri("/v1/me/assets/12345")
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Asset not found").await;

        Ok(())
    }

    mod serial {
        use super::*;

        #[test_context(LocalTestContext)]
        #[sqlx::test]
        async fn can_delete_an_asset(ctx: &mut LocalTestContext, pool: PgPool) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;
            let asset_key = Uuid::new_v4();

            // Upload an asset to S3.
            ctx.s3_client
                .put_object()
                .bucket(S3_UPLOADS_BUCKET)
                .key(asset_key.to_string())
                .send()
                .await
                .unwrap();

            // Asset should be present in the bucket.
            let result = count_s3_objects(&ctx.s3_client, S3_UPLOADS_BUCKET, None, None)
                .await
                .unwrap();

            assert_eq!(result, 1_u32);

            // Insert an asset.
            let insert_result = sqlx::query(
                r#"
INSERT INTO assets (key, hex, height, width, user_id)
VALUES ($1, $2, $3, $4, $5)
RETURNING id
"#,
            )
            .bind(asset_key)
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

            // Should be deleted from the database.
            let result = sqlx::query(
                r#"
SELECT EXISTS (
    SELECT 1 FROM assets
    WHERE id = $1
)
"#,
            )
            .bind(insert_result.get::<i64, _>("id"))
            .fetch_one(&mut *conn)
            .await?;

            assert!(!result.get::<bool, _>("exists"));

            // Asset should not be present in the bucket.
            let result = count_s3_objects(&ctx.s3_client, S3_UPLOADS_BUCKET, None, None)
                .await
                .unwrap();

            assert_eq!(result, 0);

            Ok(())
        }
    }
}
