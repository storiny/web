use crate::{
    AppState,
    constants::{
        buckets::S3_FONTS_BUCKET,
        resource_limit::ResourceLimit,
    },
    error::{
        AppError,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    utils::{
        check_resource_limit::check_resource_limit,
        delete_s3_objects::delete_s3_objects,
        incr_resource_limit::incr_resource_limit,
    },
};
use actix_multipart::form::{
    MultipartForm,
    tempfile::TempFile,
    text::Text,
};
use actix_web::{
    HttpResponse,
    http::StatusCode,
    post,
    web,
};
use four_cc::FourCC;
use mime::{
    APPLICATION_OCTET_STREAM,
    FONT_WOFF2,
};
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::Row;
use std::io::{
    BufReader,
    Read,
};
use tracing::{
    debug,
    trace,
    warn,
};
use uuid::Uuid;
use validator::Validate;

const WOFF2_SIGNATURE: FourCC = FourCC(*b"wOF2");

static MAX_FILE_SIZE: usize = 1024 * 1024 * 2; // 2 MB

#[derive(Deserialize, Validate)]
struct Fragments {
    blog_id: String,
}

#[derive(MultipartForm)]
struct UploadFont {
    variant: Text<String>,
    file: TempFile,
}

#[derive(Debug, Serialize, Deserialize)]
struct Response {
    id: String,
}

/// Returns whether the buffer starts with the WOFF2 magic number.
///
/// * `input_buffer` - The file buffer.
fn is_woff2(input_buffer: &[u8]) -> bool {
    input_buffer.starts_with(&WOFF2_SIGNATURE.0)
}

#[post("/v1/me/blogs/{blog_id}/settings/appearance/fonts/upload")]
#[tracing::instrument(
    name = "POST /v1/me/blogs/{blog_id}/settings/appearance/fonts/upload",
    skip_all,
    fields(
        user_id = user.id().ok(),
        file_name = tracing::field::Empty,
        mime_type = tracing::field::Empty,
        raw_file_size = tracing::field::Empty,
        buffer_size = tracing::field::Empty,
        object_key = tracing::field::Empty
    ),
    err
)]
async fn secure_post(
    form: MultipartForm<UploadFont>,
    path: web::Path<Fragments>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let blog_id = path
        .blog_id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid blog ID"))?;

    handle_upload(form, data, user_id, blog_id).await
}

/// Handles the uploading of a font.
///
/// * `form` - The multipart form data.
/// * `data` - The shared application state.
/// * `user_id` - The ID of the user.
/// * `blog_id` - The ID of the blog.
async fn handle_upload(
    form: MultipartForm<UploadFont>,
    data: web::Data<AppState>,
    user_id: i64,
    blog_id: i64,
) -> Result<HttpResponse, AppError> {
    let font_variant = &form.variant.0;

    if !["primary", "secondary", "code"].contains(&font_variant.as_str()) {
        return Err(ToastErrorResponse::new(None, "Invalid font variant").into());
    }

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    let result = sqlx::query(
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
)
SELECT COALESCE(
    (SELECT TRUE FROM blog_as_owner),
    (SELECT TRUE FROM blog_as_editor)
) AS "found"
"#,
    )
    .bind(blog_id)
    .bind(user_id)
    .fetch_one(&mut *txn)
    .await?;

    if !result.get::<Option<bool>, _>("found").unwrap_or_default() {
        return Err(AppError::from(
            "Missing permission, the blog does not exist, or it does not have plus features",
        ));
    }

    if !check_resource_limit(&data.redis, ResourceLimit::UploadFont, user_id).await? {
        return Err(ToastErrorResponse::new(
            Some(StatusCode::TOO_MANY_REQUESTS),
            "Daily limit exceeded for uploading fonts. Try again tomorrow.",
        )
        .into());
    }

    let font_file = &form.file;
    let file_name = &font_file.file_name.clone().unwrap_or_default();
    let font_mime_type = &font_file.content_type;
    let supported_font_mimes: Vec<String> =
        vec![FONT_WOFF2.to_string(), APPLICATION_OCTET_STREAM.to_string()];

    tracing::Span::current().record("file_name", file_name);

    if let Some(mime) = font_mime_type {
        tracing::Span::current().record("mime_type", mime.to_string());
    }

    // This will never panic
    #[allow(clippy::unwrap_used)]
    if font_mime_type.is_none()
        || !supported_font_mimes.contains(&font_mime_type.clone().unwrap().to_string())
    {
        debug!("received a font with unknown format: {font_mime_type:?}");
        return Err(ToastErrorResponse::new(None, "Unsupported font format").into());
    }

    debug!(
        "received a font with name: {file_name} and size (before reading): {} bytes",
        font_file.size
    );

    tracing::Span::current().record("raw_file_size", font_file.size);

    if font_file.size == 0 || font_file.size > MAX_FILE_SIZE {
        return Err(ToastErrorResponse::new(None, "Font file must be smaller than 2 MB").into());
    }

    let mut font_bytes: Vec<u8> = Vec::new();

    {
        let mut font_reader = BufReader::new(&font_file.file);

        font_reader.read_to_end(&mut font_bytes).map_err(|error| {
            AppError::InternalError(format!("unable to read the font file: {error:?}"))
        })?;
    }

    debug!("font buffer size: {} bytes", font_bytes.len());
    tracing::Span::current().record("buffer_size", font_bytes.len());

    // Validate the font size again after reading.
    if font_bytes.len() > MAX_FILE_SIZE {
        return Err(ToastErrorResponse::new(None, "Font file must be smaller than 2 MB").into());
    }

    // Validate the WOFF2 magic number.
    if !is_woff2(&font_bytes) {
        warn!("invalid woff2 font file, aborting upload");

        return Err(ToastErrorResponse::new(
            Some(StatusCode::UNPROCESSABLE_ENTITY),
            "Invalid font format",
        )
        .into());
    }

    let s3_client = &data.s3_client;

    // Delete the previous font from S3 if it exists.
    {
        let result = sqlx::query(
            format!(
                r#"
SELECT font_{font_variant} AS "font"
FROM blogs
WHERE id = $1
"#
            )
            .as_str(),
        )
        .bind(blog_id)
        .fetch_one(&mut *txn)
        .await?;

        if let Some(previous_font) = result.get::<Option<Uuid>, _>("font") {
            delete_s3_objects(s3_client, S3_FONTS_BUCKET, vec![previous_font.to_string()])
                .await
                .map_err(|error| {
                    AppError::InternalError(format!("unable to delete the font object: {error:?}",))
                })?;
        }
    }

    let object_key = Uuid::new_v4();

    tracing::Span::current().record("object_key", object_key.to_string());
    debug!("uploading a font to S3 with size: {}", font_bytes.len());

    s3_client
        .put_object()
        .bucket(S3_FONTS_BUCKET)
        .key(object_key.to_string())
        .content_type(FONT_WOFF2.to_string())
        // Blog ID
        .metadata("blog-id", blog_id.to_string())
        .body(font_bytes.into())
        .send()
        .await
        .map_err(|error| {
            AppError::InternalError(format!(
                "unable to upload the font to s3: {:?}",
                error.into_service_error()
            ))
        })?;

    debug!("uploaded font to s3 with key: {}", object_key.to_string());
    trace!("updating the blog");

    // Update the blog.
    match sqlx::query(
        format!(
            r#"
UPDATE blogs
SET font_{font_variant} = $1
WHERE id = $2
"#
        )
        .as_str(),
    )
    .bind(object_key)
    .bind(blog_id)
    .execute(&mut *txn)
    .await
    {
        Ok(_) => {
            incr_resource_limit(&data.redis, ResourceLimit::UploadFont, user_id).await?;

            match txn.commit().await {
                Ok(_) => {
                    trace!("font upload completed");
                    Ok(HttpResponse::Created().json(Response {
                        id: object_key.to_string(),
                    }))
                }
                Err(error) => {
                    delete_s3_objects(s3_client, S3_FONTS_BUCKET, vec![object_key.to_string()])
                        .await
                        .map_err(|error| {
                            AppError::InternalError(format!(
                                "unable to delete the font object: {error:?}",
                            ))
                        })?;

                    Err(AppError::SqlxError(error))
                }
            }
        }
        Err(error) => {
            delete_s3_objects(s3_client, S3_FONTS_BUCKET, vec![object_key.to_string()])
                .await
                .map_err(|error| {
                    AppError::InternalError(format!("unable to delete the font object: {error:?}",))
                })?;

            Err(AppError::SqlxError(error))
        }
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(secure_post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        RedisPool,
        S3Client,
        config::get_app_config,
        oauth::get_oauth_client_map,
        test_utils::{
            RedisTestContext,
            TestContext,
            count_s3_objects,
            exceed_resource_limit,
            get_lapin_pool,
            get_redis_pool,
            get_resource_limit,
            get_s3_client,
        },
        utils::delete_s3_objects_using_prefix::delete_s3_objects_using_prefix,
    };
    use actix_web::{
        App,
        HttpServer,
    };
    use futures::future;
    use reqwest::{
        Body,
        StatusCode,
        multipart::{
            Form,
            Part,
        },
    };
    use sqlx::PgPool;
    use std::{
        net::TcpListener,
        str,
    };
    use storiny_macros::test_context;
    use tokio_util::codec::BytesCodec;
    use user_agent_parser::UserAgentParser;

    // Post handler without the identity middleware.
    #[post("/upload-font")]
    async fn unsecure_post(
        form: MultipartForm<UploadFont>,
        data: web::Data<AppState>,
    ) -> Result<HttpResponse, AppError> {
        handle_upload(form, data, 1_i64, 2_i64).await
    }

    /// Initializes and spawns an HTTP server for tests using [reqwest::Client].
    ///
    /// * `db_pool` - The Postgres connection pool.
    /// * `s3_client` - The S3 client instance.
    async fn init_web_server_for_test(
        db_pool: PgPool,
        s3_client: Option<S3Client>,
    ) -> (reqwest::Client, Box<dyn Fn(&str) -> String>) {
        let listener = TcpListener::bind("localhost:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        let db_pool_clone = db_pool.clone();

        // GeoIP service
        let geo_db = maxminddb::Reader::open_readfile("geo/db/GeoLite2-City.mmdb").unwrap();

        // User-agent parser
        let ua_parser = UserAgentParser::from_path("./data/ua_parser/regexes.yaml")
            .expect("Cannot build user-agent parser");

        // Application state
        let app_state = web::Data::new(AppState {
            config: get_app_config().unwrap(),
            redis: get_redis_pool(),
            lapin: get_lapin_pool(),
            db_pool: db_pool.clone(),
            geo_db,
            ua_parser,
            s3_client: s3_client.unwrap_or(get_s3_client().await),
            reqwest_client: reqwest::Client::new(),
            oauth_client: reqwest::Client::new(),
            oauth_client_map: get_oauth_client_map(get_app_config().unwrap()),
        });

        let server = HttpServer::new(move || {
            App::new()
                .app_data(app_state.clone())
                .service(unsecure_post)
        })
        .workers(1)
        .listen(listener)
        .unwrap()
        .run();

        tokio::spawn(server);

        let client = reqwest::Client::builder().build().unwrap();

        // URL generator for the server.
        let generate_url =
            Box::new(move |path: &str| -> String { format!("http://localhost:{}{}", port, path) });

        // Insert the user with blog.
        sqlx::query(
            r#"
WITH inserted_user AS (
    INSERT INTO users (id, name, username, email)
    VALUES ($1, $2, $3, $4)
    RETURNING id
)
INSERT INTO blogs (id, name, slug, user_id, has_plus_features)
VALUES ($5, $6, $7, (SELECT id FROM inserted_user), TRUE)
"#,
        )
        .bind(1_i64)
        .bind("Some user".to_string())
        .bind("some_user".to_string())
        .bind("someone@example.com".to_string())
        .bind(2_i64)
        .bind("Some blog".to_string())
        .bind("some-blog".to_string())
        .execute(&db_pool_clone)
        .await
        .unwrap();

        (client, generate_url)
    }

    /// Reads and returns a font file part from a local font on the disk for multipart form
    /// response.
    ///
    /// * `path` - The sub-path to the font file.
    /// * `file_name` - The name for the font file.
    /// * `mime` - The mime type for the font file.
    async fn get_font_part(path: &str, file_name: &str, mime: &str) -> Part {
        let file = tokio::fs::File::open(format!(
            "src/routes/v1/me/blogs/settings/appearance/fonts/fixtures/fonts/{}",
            path
        ))
        .await
        .unwrap();
        let stream = tokio_util::codec::FramedRead::new(file, BytesCodec::new());

        Part::stream(Body::wrap_stream(stream))
            .file_name(file_name.to_string())
            .mime_str(mime)
            .unwrap()
    }

    struct LocalTestContext {
        s3_client: S3Client,
        redis_pool: RedisPool,
    }

    #[async_trait::async_trait]
    impl TestContext for LocalTestContext {
        async fn setup() -> LocalTestContext {
            LocalTestContext {
                s3_client: get_s3_client().await,
                redis_pool: get_redis_pool(),
            }
        }

        async fn teardown(self) {
            future::join(
                async {
                    let redis_pool = &self.redis_pool;
                    let mut conn = redis_pool.get().await.unwrap();
                    let _: String = redis::cmd("FLUSHDB")
                        .query_async(&mut conn)
                        .await
                        .expect("failed to FLUSHDB");
                },
                async {
                    delete_s3_objects_using_prefix(&self.s3_client, S3_FONTS_BUCKET, None, None)
                        .await
                        .unwrap()
                },
            )
            .await;
        }
    }

    #[sqlx::test]
    async fn can_reject_an_invalid_font_variant(pool: PgPool) -> sqlx::Result<()> {
        let (client, generate_url) = init_web_server_for_test(pool, None).await;

        let part = get_font_part("work-sans.woff2", "work-sans.woff2", FONT_WOFF2.as_ref()).await;
        let form = Form::new().text("variant", "invalid").part("file", part);

        let res = client
            .post(generate_url("/upload-font"))
            .multipart(form)
            .send()
            .await
            .unwrap();

        assert!(res.status().is_client_error());
        assert_eq!(
            res.json::<ToastErrorResponse>().await.unwrap().error,
            "Invalid font variant".to_string()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_font_with_bad_mime_type(pool: PgPool) -> sqlx::Result<()> {
        let (client, generate_url) = init_web_server_for_test(pool, None).await;

        let part = get_font_part("work-sans.woff2", "work-sans.woff2", "text/plain").await;
        let form = Form::new().text("variant", "primary").part("file", part);

        let res = client
            .post(generate_url("/upload-font"))
            .multipart(form)
            .send()
            .await
            .unwrap();

        assert!(res.status().is_client_error());
        assert_eq!(
            res.json::<ToastErrorResponse>().await.unwrap().error,
            "Unsupported font format".to_string()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_font_with_unsupported_format(pool: PgPool) -> sqlx::Result<()> {
        let (client, generate_url) = init_web_server_for_test(pool, None).await;

        let part = get_font_part("work-sans.ttf", "work-sans.ttf", "font/ttf").await;
        let form = Form::new().text("variant", "primary").part("file", part);

        let res = client
            .post(generate_url("/upload-font"))
            .multipart(form)
            .send()
            .await
            .unwrap();

        assert!(res.status().is_client_error());
        assert_eq!(
            res.json::<ToastErrorResponse>().await.unwrap().error,
            "Unsupported font format".to_string()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_non_font_file(pool: PgPool) -> sqlx::Result<()> {
        let (client, generate_url) = init_web_server_for_test(pool, None).await;

        let part = get_font_part("sample.txt", "invalid-font.woff2", FONT_WOFF2.as_ref()).await;
        let form = Form::new().text("variant", "primary").part("file", part);

        let res = client
            .post(generate_url("/upload-font"))
            .multipart(form)
            .send()
            .await
            .unwrap();

        assert!(res.status().is_client_error());

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_font_with_large_file_size(pool: PgPool) -> sqlx::Result<()> {
        let (client, generate_url) = init_web_server_for_test(pool, None).await;

        let part = get_font_part("noto-color-emoji.woff2", "font.woff2", FONT_WOFF2.as_ref()).await;
        let form = Form::new().text("variant", "primary").part("file", part);

        let res = client
            .post(generate_url("/upload-font"))
            .multipart(form)
            .send()
            .await
            .unwrap();

        assert!(res.status().is_client_error());
        assert_eq!(
            res.json::<ToastErrorResponse>().await.unwrap().error,
            "Font file must be smaller than 2 MB".to_string()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_font_update_request_for_a_regular_blog(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (client, generate_url) = init_web_server_for_test(pool, None).await;

        // Disable plus features for the blog.
        let result = sqlx::query(
            r#"
UPDATE blogs
SET has_plus_features = FALSE
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let part = get_font_part("work-sans.woff2", "work-sans.woff2", FONT_WOFF2.as_ref()).await;
        let form = Form::new().text("variant", "primary").part("file", part);

        let res = client
            .post(generate_url("/upload-font"))
            .multipart(form)
            .send()
            .await
            .unwrap();

        assert!(res.status().is_client_error());
        assert_eq!(
            res.text().await.unwrap(),
            "Missing permission, the blog does not exist, or it does not have plus features"
                .to_string()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_font_update_request_for_a_deleted_blog(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (client, generate_url) = init_web_server_for_test(pool, None).await;

        // Soft-delete the blog.
        let result = sqlx::query(
            r#"
UPDATE blogs
SET deleted_at = NOW()
WHERE id = $1
"#,
        )
        .bind(2_i64)
        .execute(&mut *conn)
        .await?;

        assert_eq!(result.rows_affected(), 1);

        let part = get_font_part("work-sans.woff2", "work-sans.woff2", FONT_WOFF2.as_ref()).await;
        let form = Form::new().text("variant", "primary").part("file", part);

        let res = client
            .post(generate_url("/upload-font"))
            .multipart(form)
            .send()
            .await
            .unwrap();

        assert!(res.status().is_client_error());
        assert_eq!(
            res.text().await.unwrap(),
            "Missing permission, the blog does not exist, or it does not have plus features"
                .to_string()
        );

        Ok(())
    }

    mod serial {
        use super::*;

        #[test_context(LocalTestContext)]
        #[sqlx::test]
        async fn can_update_blog_font_as_blog_owner(
            ctx: &mut LocalTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (client, generate_url) =
                init_web_server_for_test(pool, Some(ctx.s3_client.clone())).await;

            let part = get_font_part("work-sans.woff2", "font.woff2", FONT_WOFF2.as_ref()).await;
            let form = Form::new().text("variant", "primary").part("file", part);

            let res = client
                .post(generate_url("/upload-font"))
                .multipart(form)
                .send()
                .await
                .unwrap();

            assert!(res.status().is_success());
            let json = res.json::<Response>().await;
            assert!(json.is_ok());

            // Should update the blog in database.
            let result = sqlx::query(
                r#"
SELECT font_primary FROM blogs
WHERE id = $1
"#,
            )
            .bind(2_i64)
            .fetch_one(&mut *conn)
            .await?;

            assert_eq!(
                result
                    .get::<Option<Uuid>, _>("font_primary")
                    .unwrap()
                    .to_string(),
                json.unwrap().id
            );

            // Should also increment the resource limit.
            let result =
                get_resource_limit(&ctx.redis_pool, ResourceLimit::UploadFont, 1_i64).await;

            assert_eq!(result, 1);

            Ok(())
        }

        #[test_context(LocalTestContext)]
        #[sqlx::test]
        async fn can_update_blog_font_as_blog_editor(
            ctx: &mut LocalTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (client, generate_url) =
                init_web_server_for_test(pool, Some(ctx.s3_client.clone())).await;

            // Change the owner of the blog.
            let result = sqlx::query(
                r#"
WITH inserted_user AS (
    INSERT INTO users (name, username, email)
    VALUES ('Blog owner', 'blog_owner', 'blog_owner@storiny.com')
    RETURNING id
)
UPDATE blogs
SET user_id = (SELECT id FROM inserted_user)
WHERE id = $1
"#,
            )
            .bind(2_i64)
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            // Insert the current user as an editor.
            let result = sqlx::query(
                r#"
INSERT INTO blog_editors (user_id, blog_id)
VALUES ($1, $2)
"#,
            )
            .bind(1_i64)
            .bind(2_i64)
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            let part = get_font_part("work-sans.woff2", "font.woff2", FONT_WOFF2.as_ref()).await;
            let res = client
                .post(generate_url("/upload-font"))
                .multipart(Form::new().text("variant", "primary").part("file", part))
                .send()
                .await
                .unwrap();

            // Should reject the request as the editor has not been accepted yet.
            assert!(res.status().is_client_error());
            assert_eq!(
                res.text().await.unwrap(),
                "Missing permission, the blog does not exist, or it does not have plus features"
                    .to_string()
            );

            // Accept the editor request.
            let result = sqlx::query(
                r#"
UPDATE blog_editors
SET accepted_at = NOW()
WHERE user_id = $1 AND blog_id = $2
"#,
            )
            .bind(1_i64)
            .bind(2_i64)
            .execute(&mut *conn)
            .await?;

            assert_eq!(result.rows_affected(), 1);

            let part = get_font_part("work-sans.woff2", "font.woff2", FONT_WOFF2.as_ref()).await;
            let res = client
                .post(generate_url("/upload-font"))
                .multipart(Form::new().text("variant", "primary").part("file", part))
                .send()
                .await
                .unwrap();

            assert!(res.status().is_success());
            let json = res.json::<Response>().await;
            assert!(json.is_ok());

            // Should update the blog in database.
            let result = sqlx::query(
                r#"
SELECT font_primary FROM blogs
WHERE id = $1
"#,
            )
            .bind(2_i64)
            .fetch_one(&mut *conn)
            .await?;

            assert_eq!(
                result
                    .get::<Option<Uuid>, _>("font_primary")
                    .unwrap()
                    .to_string(),
                json.unwrap().id
            );

            // Should also increment the resource limit.
            let result =
                get_resource_limit(&ctx.redis_pool, ResourceLimit::UploadFont, 1_i64).await;

            assert_eq!(result, 1);

            Ok(())
        }

        #[test_context(LocalTestContext)]
        #[sqlx::test]
        async fn can_delete_previous_font(
            ctx: &mut LocalTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let (client, generate_url) =
                init_web_server_for_test(pool, Some(ctx.s3_client.clone())).await;

            let part = get_font_part("work-sans.woff2", "font.woff2", FONT_WOFF2.as_ref()).await;
            let form = Form::new().text("variant", "primary").part("file", part);

            let res = client
                .post(generate_url("/upload-font"))
                .multipart(form)
                .send()
                .await
                .unwrap();

            assert!(res.status().is_success());

            // Font should be present in the bucket.
            let result = count_s3_objects(&ctx.s3_client, S3_FONTS_BUCKET, None, None)
                .await
                .unwrap();

            assert_eq!(result, 1_u32);

            // Update the font again.
            let part = get_font_part("work-sans.woff2", "font.woff2", FONT_WOFF2.as_ref()).await;
            let form = Form::new().text("variant", "primary").part("file", part);

            let res = client
                .post(generate_url("/upload-font"))
                .multipart(form)
                .send()
                .await
                .unwrap();

            assert!(res.status().is_success());

            // Should delete the old font.
            let result = count_s3_objects(&ctx.s3_client, S3_FONTS_BUCKET, None, None)
                .await
                .unwrap();

            assert_eq!(result, 1_u32);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_a_font_on_exceeding_the_resource_limit(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let (client, generate_url) = init_web_server_for_test(pool, None).await;

            let part = get_font_part("work-sans.woff2", "font.woff2", FONT_WOFF2.as_ref()).await;
            let form = Form::new().text("variant", "primary").part("file", part);

            exceed_resource_limit(&ctx.redis_pool, ResourceLimit::UploadFont, 1_i64).await;

            let res = client
                .post(generate_url("/upload-font"))
                .multipart(form)
                .send()
                .await
                .unwrap();

            assert_eq!(res.status(), StatusCode::TOO_MANY_REQUESTS);

            Ok(())
        }
    }
}
