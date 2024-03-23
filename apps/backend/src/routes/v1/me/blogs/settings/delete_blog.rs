use crate::{
    constants::buckets::S3_FONTS_BUCKET,
    error::{
        AppError,
        FormErrorResponse,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    utils::delete_s3_objects::delete_s3_objects,
    AppState,
};
use actix_http::StatusCode;
use actix_web::{
    post,
    web,
    HttpResponse,
};
use actix_web_validator::Json;
use argon2::{
    Argon2,
    PasswordHash,
    PasswordVerifier,
};
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::Row;
use uuid::Uuid;
use validator::Validate;

#[derive(Deserialize, Validate)]
struct Fragments {
    blog_id: String,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(length(min = 6, max = 64, message = "Invalid password length"))]
    current_password: String,
}

#[post("/v1/me/blogs/{blog_id}/settings/delete-blog")]
#[tracing::instrument(
    name = "POST /v1/me/blogs/{blog_id}/settings/delete-blog",
    skip_all,
    fields(
        user = user.id().ok(),
        blog_id = %path.blog_id
    ),
    err
)]
async fn post(
    payload: Json<Request>,
    data: web::Data<AppState>,
    path: web::Path<Fragments>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let blog_id = path
        .blog_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid blog ID"))?;

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    let db_user = sqlx::query(
        r#"
SELECT password FROM users
WHERE id = $1
"#,
    )
    .bind(user_id)
    .fetch_one(&mut *txn)
    .await?;

    let user_password = db_user.get::<Option<String>, _>("password");

    if user_password.is_none() {
        return Err(ToastErrorResponse::new(
            None,
            "You need to set a password to delete this blog",
        )
        .into());
    }

    // Validate the current password.
    {
        let user_password = user_password.unwrap_or_default();
        let password_hash = PasswordHash::new(&user_password)
            .map_err(|error| AppError::InternalError(error.to_string()))?;

        Argon2::default()
            .verify_password(payload.current_password.as_bytes(), &password_hash)
            .map_err(|_| {
                AppError::FormError(FormErrorResponse::new(
                    Some(StatusCode::FORBIDDEN),
                    vec![("current_password", "Invalid password")],
                ))
            })?;
    }

    match sqlx::query(
        r#"
DELETE FROM blogs
WHERE
    id = $1
    AND user_id = $2
RETURNING
    font_primary,
    font_secondary,
    font_code
"#,
    )
    .bind(blog_id)
    .bind(user_id)
    .fetch_one(&mut *txn)
    .await
    {
        Ok(blog) => {
            // Delete the font objects.
            {
                let s3_client = &data.s3_client;
                let mut font_keys = Vec::new();

                if let Some(key) = blog.get::<Option<Uuid>, _>("font_primary") {
                    font_keys.push(key.to_string());
                }

                if let Some(key) = blog.get::<Option<Uuid>, _>("font_secondary") {
                    font_keys.push(key.to_string());
                }

                if let Some(key) = blog.get::<Option<Uuid>, _>("font_code") {
                    font_keys.push(key.to_string());
                }

                delete_s3_objects(s3_client, S3_FONTS_BUCKET, font_keys)
                    .await
                    .map_err(|error| {
                        AppError::InternalError(format!(
                            "unable to delete the font from s3: {error:?}",
                        ))
                    })?;
            }

            txn.commit().await?;

            Ok(HttpResponse::NoContent().finish())
        }
        Err(error) => {
            if matches!(error, sqlx::Error::RowNotFound) {
                return Err(AppError::ToastError(ToastErrorResponse::new(
                    None,
                    "Unknown blog",
                )));
            }

            Err(AppError::SqlxError(error))
        }
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        test_utils::{
            assert_form_error_response,
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
    use argon2::{
        password_hash::{
            rand_core::OsRng,
            SaltString,
        },
        PasswordHasher,
    };
    use sqlx::{
        PgPool,
        Row,
    };
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

    /// Returns a sample hashed password.
    fn get_sample_password() -> (String, String) {
        let password = "sample";
        let salt = SaltString::generate(&mut OsRng);
        let password_hash = Argon2::default()
            .hash_password(password.as_bytes(), &salt)
            .unwrap()
            .to_string();

        (password_hash, password.to_string())
    }

    #[sqlx::test]
    async fn can_reject_a_blog_delete_request_for_an_unknown_blog(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;
        let (password_hash, _) = get_sample_password();

        // Update the user password.
        let result = sqlx::query(
            r#"
UPDATE users
SET password = $2
WHERE id = $1
"#,
        )
        .bind(user_id.unwrap())
        .bind(password_hash)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{}/settings/delete-blog", 12345))
            .set_json(Request {
                current_password: "sample".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Unknown blog").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_blog_delete_request_for_a_user_without_password(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{}/settings/delete-blog", 12345))
            .set_json(Request {
                current_password: "sample".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "You need to set a password to delete this blog").await;

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_blog_delete_request_for_invalid_password(
        pool: PgPool,
    ) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;
        let (password_hash, _) = get_sample_password();

        // Insert the blog for the user.
        let result = sqlx::query(
            r#"
WITH updated_user AS (
    UPDATE users
    SET password = $2
    WHERE id = $1
)
INSERT INTO blogs (name, slug, user_id)
VALUES ('Sample blog', 'sample-blog', $1)
RETURNING id
"#,
        )
        .bind(user_id.unwrap())
        .bind(password_hash)
        .fetch_one(&mut *conn)
        .await?;

        let blog_id = result.get::<i64, _>("id");

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri(&format!("/v1/me/blogs/{blog_id}/settings/delete-blog"))
            .set_json(Request {
                current_password: "invalid".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_form_error_response(res, vec![("current_password", "Invalid password")]).await;

        Ok(())
    }

    mod serial {
        use super::*;

        #[test_context(LocalTestContext)]
        #[sqlx::test]
        async fn can_delete_a_blog(ctx: &mut LocalTestContext, pool: PgPool) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;
            let (password_hash, password) = get_sample_password();
            let font_primary = Uuid::new_v4();
            let font_secondary = Uuid::new_v4();
            let font_code = Uuid::new_v4();

            // Upload fonts to S3.
            ctx.s3_client
                .put_object()
                .bucket(S3_FONTS_BUCKET)
                .key(font_primary.to_string())
                .send()
                .await
                .unwrap();

            ctx.s3_client
                .put_object()
                .bucket(S3_FONTS_BUCKET)
                .key(font_secondary.to_string())
                .send()
                .await
                .unwrap();

            ctx.s3_client
                .put_object()
                .bucket(S3_FONTS_BUCKET)
                .key(font_code.to_string())
                .send()
                .await
                .unwrap();

            // Fonts should be present in the bucket.
            let result = count_s3_objects(&ctx.s3_client, S3_FONTS_BUCKET, None, None)
                .await
                .unwrap();

            assert_eq!(result, 3_u32);

            // Insert the blog for the user.
            let result = sqlx::query(
                r#"
WITH updated_user AS (
    UPDATE users
    SET password = $2
    WHERE id = $1
)
INSERT INTO blogs (name, slug, user_id, font_primary, font_secondary, font_code)
VALUES ('Sample blog', 'sample-blog', $1, $3, $4, $5)
RETURNING id
"#,
            )
            .bind(user_id.unwrap())
            .bind(password_hash)
            .bind(font_primary)
            .bind(font_secondary)
            .bind(font_code)
            .fetch_one(&mut *conn)
            .await?;

            let blog_id = result.get::<i64, _>("id");

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri(&format!("/v1/me/blogs/{blog_id}/settings/delete-blog"))
                .set_json(Request {
                    current_password: password.to_string(),
                })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            // Blog should not be present in the database.
            let result = sqlx::query(
                r#"
SELECT EXISTS (
    SELECT FROM blogs
    WHERE id = $1
)
"#,
            )
            .bind(blog_id)
            .fetch_one(&mut *conn)
            .await?;

            assert!(!result.get::<bool, _>("exists"));

            // Fonts should not be present in the bucket.
            let result = count_s3_objects(&ctx.s3_client, S3_FONTS_BUCKET, None, None)
                .await
                .unwrap();

            assert_eq!(result, 0);

            Ok(())
        }
    }
}
