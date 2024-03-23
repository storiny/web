use crate::{
    constants::buckets::S3_FONTS_BUCKET,
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
    blog_id: String,
    variant: String,
}

#[delete("/v1/me/blogs/{blog_id}/settings/appearance/fonts/{variant}")]
#[tracing::instrument(
    name = "DELETE /v1/me/blogs/{blog_id}/settings/appearance/fonts/{variant}",
    skip_all,
    fields(
        user_id = user.id().ok(),
        blog_id = %path.blog_id,
        variant = %path.variant
    ),
    err
)]
async fn delete(
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let blog_id = path
        .blog_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid blog ID"))?;
    let variant = path.variant.clone();

    if !["primary", "secondary", "code"].contains(&variant.as_str()) {
        return Err(ToastErrorResponse::new(None, "Invalid font variant").into());
    }

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    let blog = sqlx::query(
        format!(
            r#"
WITH blog_as_owner AS (
    SELECT 1 FROM blogs
    WHERE
        id = $1
        AND user_id = $2
        AND deleted_at IS NULL
        AND has_plus_features IS TRUE
), blog_as_editor AS (
    SELECT 1 FROM blog_editors AS bs
        INNER JOIN blogs AS b
            ON b.id = bs.blog_id
            AND b.has_plus_features IS TRUE
    WHERE
        bs.blog_id = $1
        AND bs.user_id = $2
        AND bs.accepted_at IS NOT NULL
        AND bs.deleted_at IS NULL
        AND NOT EXISTS (
            SELECT FROM blog_as_owner
        )
), sanity_check AS (
    SELECT COALESCE(
        (SELECT TRUE FROM blog_as_owner),
        (SELECT TRUE FROM blog_as_editor)
    ) AS "found"
), previous_blog AS (
    SELECT font_{variant} as "font"
    FROM blogs
    WHERE
        id = $1
        AND (SELECT found FROM sanity_check) IS TRUE
), updated_blog AS (
    UPDATE blogs
    SET font_{variant} = NULL
    WHERE
        id = $1
        AND (SELECT found FROM sanity_check) IS TRUE
)
SELECT font FROM previous_blog
"#
        )
        .as_str(),
    )
    .bind(blog_id)
    .bind(user_id)
    .fetch_one(&mut *txn)
    .await
    .map_err(|error| {
        if matches!(error, sqlx::Error::RowNotFound) {
            AppError::from(
                "Missing permission, the blog does not exist, or it does not have plus features",
            )
        } else {
            AppError::SqlxError(error)
        }
    })?;

    if let Some(object_key) = blog.get::<Option<Uuid>, _>("font") {
        let s3_client = &data.s3_client;

        // Delete the object from S3.
        delete_s3_objects(s3_client, S3_FONTS_BUCKET, vec![object_key.to_string()])
            .await
            .map_err(|error| {
                AppError::InternalError(format!("unable to delete the font from s3: {error:?}",))
            })?;
    }

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
            assert_response_body_text,
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
            delete_s3_objects_using_prefix(&self.s3_client, S3_FONTS_BUCKET, None, None)
                .await
                .unwrap();
        }
    }

    #[sqlx::test]
    async fn can_reject_a_delete_font_request_for_an_invalid_font_variant(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

        // Insert a blog with font.
        let insert_result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id, font_primary, has_plus_features)
VALUES ($1, $2, $3, $4, TRUE)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id.unwrap())
        .bind(Uuid::new_v4())
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/settings/appearance/fonts/invalid-variant",
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Invalid font variant").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_delete_font_request_for_a_regular_blog(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

        // Insert a regular blog.
        let insert_result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id, font_primary, has_plus_features)
VALUES ($1, $2, $3, $4, FALSE)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id)
        .bind(Uuid::new_v4())
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/settings/appearance/fonts/primary",
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(
            res,
            "Missing permission, the blog does not exist, or it does not have plus features",
        )
        .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_delete_font_request_for_a_delete_blog(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

        // Insert a blog.
        let insert_result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id, font_primary, has_plus_features)
VALUES ($1, $2, $3, $4, TRUE)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id)
        .bind(Uuid::new_v4())
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        // Soft-delete the blog.
        let result = sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(insert_result.get::<i64, _>("id"))
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/settings/appearance/fonts/primary",
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_response_body_text(
            res,
            "Missing permission, the blog does not exist, or it does not have plus features",
        )
        .await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_handle_a_missing_font(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;

        // Insert a blog without font.
        let insert_result = sqlx::query(
            r#"
INSERT INTO blogs (name, slug, user_id, has_plus_features)
VALUES ($1, $2, $3, TRUE)
RETURNING id
"#,
        )
        .bind("Sample blog".to_string())
        .bind("sample-blog".to_string())
        .bind(user_id.unwrap())
        .fetch_one(&mut *conn)
        .await?;

        assert!(insert_result.try_get::<i64, _>("id").is_ok());

        let req = test::TestRequest::delete()
            .cookie(cookie.unwrap())
            .uri(&format!(
                "/v1/me/blogs/{}/settings/appearance/fonts/primary",
                insert_result.get::<i64, _>("id")
            ))
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_success());

        Ok(())
    }

    mod serial {
        use super::*;

        #[test_context(LocalTestContext)]
        #[sqlx::test]
        async fn can_delete_a_font_as_blog_owner(
            ctx: &mut LocalTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;
            let font = Uuid::new_v4();

            // Upload a font to S3.
            ctx.s3_client
                .put_object()
                .bucket(S3_FONTS_BUCKET)
                .key(font.to_string())
                .send()
                .await
                .unwrap();

            // Font should be present in the bucket.
            let result = count_s3_objects(&ctx.s3_client, S3_FONTS_BUCKET, None, None)
                .await
                .unwrap();

            assert_eq!(result, 1_u32);

            // Insert a blog with font.
            let insert_result = sqlx::query(
                r#"
INSERT INTO blogs (name, slug, user_id, font_primary, has_plus_features)
VALUES ($1, $2, $3, $4, TRUE)
RETURNING id
"#,
            )
            .bind("Sample blog".to_string())
            .bind("sample-blog".to_string())
            .bind(user_id.unwrap())
            .bind(font)
            .fetch_one(&mut *conn)
            .await?;

            assert!(insert_result.try_get::<i64, _>("id").is_ok());

            let req = test::TestRequest::delete()
                .cookie(cookie.unwrap())
                .uri(&format!(
                    "/v1/me/blogs/{}/settings/appearance/fonts/primary",
                    insert_result.get::<i64, _>("id")
                ))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Blog should get updated in the database.
            let result = sqlx::query(
                r#"
SELECT font_primary FROM blogs
WHERE id = $1
"#,
            )
            .bind(insert_result.get::<i64, _>("id"))
            .fetch_one(&mut *conn)
            .await?;

            assert!(result.get::<Option<Uuid>, _>("font_primary").is_none());

            // Font should not be present in the bucket.
            let result = count_s3_objects(&ctx.s3_client, S3_FONTS_BUCKET, None, None)
                .await
                .unwrap();

            assert_eq!(result, 0);

            Ok(())
        }

        #[test_context(LocalTestContext)]
        #[sqlx::test]
        async fn can_delete_a_font_as_blog_editor(
            ctx: &mut LocalTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (app, cookie, user_id) = init_app_for_test(delete, pool, true, false, None).await;
            let font = Uuid::new_v4();

            // Upload a font to S3.
            ctx.s3_client
                .put_object()
                .bucket(S3_FONTS_BUCKET)
                .key(font.to_string())
                .send()
                .await
                .unwrap();

            // Font should be present in the bucket.
            let result = count_s3_objects(&ctx.s3_client, S3_FONTS_BUCKET, None, None)
                .await
                .unwrap();

            assert_eq!(result, 1_u32);

            // Insert a blog with font.
            let insert_result = sqlx::query(
                r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Blog owner', 'blog_owner', 'blog_owner@storiny.com')
    RETURNING id
)
INSERT INTO blogs (name, slug, user_id, font_primary, has_plus_features)
VALUES ($1, $2, (SELECT id FROM inserted_user), $3, TRUE)
RETURNING id
"#,
            )
            .bind("Sample blog".to_string())
            .bind("sample-blog".to_string())
            .bind(font)
            .fetch_one(&mut *conn)
            .await?;

            assert!(insert_result.try_get::<i64, _>("id").is_ok());

            // Insert an editor.
            let result = sqlx::query(
                r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
            )
            .bind(user_id.unwrap())
            .bind(insert_result.get::<i64, _>("id"))
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            let req = test::TestRequest::delete()
                .cookie(cookie.clone().unwrap())
                .uri(&format!(
                    "/v1/me/blogs/{}/settings/appearance/fonts/primary",
                    insert_result.get::<i64, _>("id")
                ))
                .to_request();
            let res = test::call_service(&app, req).await;

            // Should reject the request as the editor has not been accepted yet.
            assert!(res.status().is_client_error());
            assert_response_body_text(
                res,
                "Missing permission, the blog does not exist, or it does not have plus features",
            )
            .await;

            // Accept the editor request.
            let result = sqlx::query(
                r#"
UPDATE blog_editors
SET accepted_at = NOW()
WHERE user_id = $1
"#,
            )
            .bind(user_id.unwrap())
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            let req = test::TestRequest::delete()
                .cookie(cookie.unwrap())
                .uri(&format!(
                    "/v1/me/blogs/{}/settings/appearance/fonts/primary",
                    insert_result.get::<i64, _>("id")
                ))
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Blog should get updated in the database.
            let result = sqlx::query(
                r#"
SELECT font_primary FROM blogs
WHERE id = $1
"#,
            )
            .bind(insert_result.get::<i64, _>("id"))
            .fetch_one(&mut *conn)
            .await?;

            assert!(result.get::<Option<Uuid>, _>("font_primary").is_none());

            // Font should not be present in the bucket.
            let result = count_s3_objects(&ctx.s3_client, S3_FONTS_BUCKET, None, None)
                .await
                .unwrap();

            assert_eq!(result, 0);

            Ok(())
        }
    }
}
