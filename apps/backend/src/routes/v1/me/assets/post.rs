use crate::{
    constants::{
        buckets::S3_UPLOADS_BUCKET,
        resource_limit::ResourceLimit,
    },
    error::{
        AppError,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    utils::{
        check_resource_limit::check_resource_limit,
        incr_resource_limit::incr_resource_limit,
    },
    AppState,
};
use actix_multipart::form::{
    tempfile::TempFile,
    text::Text,
    MultipartForm,
};
use actix_web::{
    post,
    web,
    HttpResponse,
};
use colors_transform::Rgb;
use dominant_color::get_colors;
use image::{
    imageops::FilterType,
    EncodableLayout,
    GenericImageView,
    ImageError,
    ImageFormat,
};
use mime::{
    IMAGE_GIF,
    IMAGE_JPEG,
    IMAGE_PNG,
};
use serde::{
    Deserialize,
    Serialize,
};
use std::cmp;

use crate::utils::delete_s3_objects::delete_s3_objects;
use actix_web::http::StatusCode;
use sqlx::Row;
use std::io::{
    BufReader,
    Cursor,
    Read,
};
use tracing::{
    debug,
    trace,
    warn,
};
use uuid::Uuid;

static MAX_FILE_SIZE: usize = 1024 * 1024 * 10; // 10 MB

#[derive(MultipartForm)]
struct UploadAsset {
    alt: Text<String>,
    file: TempFile,
}

#[derive(Debug, Serialize, Deserialize)]
struct Response {
    #[serde(with = "crate::snowflake_id")]
    id: i64,
    key: String,
    hex: String,
    alt: String,
    rating: i16,
    width: i16,
    height: i16,
}

#[post("/v1/me/assets")]
#[tracing::instrument(
    name = "POST /v1/me/assets",
    skip_all,
    fields(
        user_id = user.id().ok(),
        file_name = tracing::field::Empty,
        mime_type = tracing::field::Empty,
        target_mime = tracing::field::Empty,
        raw_file_size = tracing::field::Empty,
        buffer_size = tracing::field::Empty,
        original_width = tracing::field::Empty,
        original_height = tracing::field::Empty,
        scaled_width = tracing::field::Empty,
        scaled_height = tracing::field::Empty,
        computed_color = tracing::field::Empty,
        object_key = tracing::field::Empty
    ),
    err
)]
async fn secure_post(
    form: MultipartForm<UploadAsset>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    handle_upload(form, data, user_id).await
}

/// Handles the uploading of an image.
///
/// * `form` - The multipart form data.
/// * `data` - The shared application state.
/// * `user_id` - The ID of the user.
async fn handle_upload(
    form: MultipartForm<UploadAsset>,
    data: web::Data<AppState>,
    user_id: i64,
) -> Result<HttpResponse, AppError> {
    if !check_resource_limit(&data.redis, ResourceLimit::CreateAsset, user_id).await? {
        return Err(ToastErrorResponse::new(
            Some(StatusCode::TOO_MANY_REQUESTS),
            "Daily limit exceeded for uploading media. Try again tomorrow.",
        )
        .into());
    }

    let img_alt = &form.alt.0;

    if img_alt.chars().count() > 128 {
        return Err(ToastErrorResponse::new(None, "Invalid alt text length").into());
    }

    let img_file = &form.file;
    let file_name = &img_file.file_name.clone().unwrap_or_default();
    let image_mime_type = &img_file.content_type;
    let supported_image_mimes: Vec<String> = vec![
        IMAGE_PNG.to_string(),
        IMAGE_GIF.to_string(),
        IMAGE_JPEG.to_string(),
        // TODO: https://github.com/hyperium/mime/pull/129
        "image/webp".to_string(),
    ];

    tracing::Span::current().record("file_name", file_name);

    if let Some(mime) = image_mime_type {
        tracing::Span::current().record("mime_type", mime.to_string());
    }

    #[allow(clippy::unwrap_used)]
    if image_mime_type.is_none()
        ||
        // This will never panic
        !supported_image_mimes.contains(&image_mime_type.clone().unwrap().to_string())
    {
        debug!("received an image with unknown format: {image_mime_type:?}");

        return Err(ToastErrorResponse::new(None, "Unsupported image type").into());
    }

    debug!(
        "received an image with name: {file_name} and size (before reading): {} bytes",
        img_file.size
    );

    tracing::Span::current().record("raw_file_size", img_file.size);

    if img_file.size == 0 || img_file.size > MAX_FILE_SIZE {
        // TODO: We simply return `Image is too big` for an image with size = 0, which can be
        // improved.
        return Err(ToastErrorResponse::new(None, "Image is too big").into());
    }

    let mut img_bytes: Vec<u8> = Vec::new();

    {
        let mut img_reader = BufReader::new(&img_file.file);

        img_reader.read_to_end(&mut img_bytes).map_err(|error| {
            AppError::InternalError(format!("unable to read the image file: {error:?}"))
        })?;
    }

    debug!("image buffer size: {} bytes", img_bytes.len());
    tracing::Span::current().record("buffer_size", img_bytes.len());

    // Validate the image size again after reading.
    if img_bytes.len() > MAX_FILE_SIZE {
        return Err(ToastErrorResponse::new(None, "Image is too big").into());
    }

    let mut loaded_img = image::load_from_memory(&img_bytes).map_err(|error| match error {
        ImageError::Decoding(decode_error) => {
            warn!("image decode error: {decode_error:?}");

            AppError::ToastError(ToastErrorResponse::new(
                Some(StatusCode::UNPROCESSABLE_ENTITY),
                "Image is not supported",
            ))
        }
        ImageError::Limits(limit_error) => {
            warn!("image limit error: {limit_error:?}");

            AppError::ToastError(ToastErrorResponse::new(
                Some(StatusCode::UNPROCESSABLE_ENTITY),
                "Image is too big",
            ))
        }
        _ => AppError::InternalError(format!("unable to load the image from memory: {error:?}")),
    })?;

    let (mut img_width, mut img_height) = loaded_img.dimensions();

    debug!("image dimensions: {img_width}px width, {img_height}px height");
    tracing::Span::current().record("original_width", img_width);
    tracing::Span::current().record("original_height", img_height);

    // The image is likely a PNG decompression bomb.
    if cmp::max(img_width, img_height) > 10_000 {
        debug!("aborting upload due to huge image dimensions");

        return Err(ToastErrorResponse::new(
            Some(StatusCode::UNPROCESSABLE_ENTITY),
            "Image is not supported",
        )
        .into());
    }

    // We can safely unwrap `image_mime_type` here.
    #[allow(clippy::unwrap_used)]
    let is_gif = image_mime_type.clone().unwrap() == IMAGE_GIF
        || file_name.split('.').last().unwrap_or_default() == "gif";

    // Scale down to 2k.
    if img_width > 2048 || img_height > 2048 {
        if is_gif {
            debug!("skipped to scale down a GIF image");

            // TODO: We currently do not support resizing GIF images.
            return Err(ToastErrorResponse::new(None, "Image is too big").into());
        }

        loaded_img = loaded_img.resize(2048, 2048, FilterType::CatmullRom);
        // Refresh dimensions
        let (next_img_width, next_img_height) = loaded_img.dimensions();
        img_width = next_img_width;
        img_height = next_img_height;

        debug!("image scaled down to new dimensions: {img_width}px width, {img_height}px height");
        tracing::Span::current().record("scaled_width", img_width);
        tracing::Span::current().record("scaled_height", img_height);
    }

    // Compute the dominant HEX color from the image.
    let dom_color = get_colors(loaded_img.to_rgb8().as_bytes(), false);
    let mut hex_color = Rgb::from(
        dom_color[0].into(),
        dom_color[1].into(),
        dom_color[2].into(),
    )
    .to_css_hex_string()
    .to_lowercase();
    // Remove the `#` prefix from the hex color.
    hex_color.remove(0);

    debug!("computed the dominant color for the image: #{hex_color}");
    tracing::Span::current().record("computed_color", format!("#{hex_color}"));

    // We device the output format based on the file extension.
    let (output_format, output_mime) = match file_name.split('.').last() {
        None => (ImageFormat::WebP, "image/webp".to_string()),
        Some(ext) => match ext {
            "jpeg" | "jpg" => (ImageFormat::Jpeg, IMAGE_JPEG.to_string()),
            "png" => (ImageFormat::Png, IMAGE_PNG.to_string()),
            _ => (ImageFormat::WebP, "image/webp".to_string()),
        },
    };

    let s3_client = &data.s3_client;
    let object_key = Uuid::new_v4();

    debug!(
        "chose output mime for the image: {output_mime} with key: {}",
        object_key.to_string()
    );
    tracing::Span::current().record("target_mime", &output_mime);
    tracing::Span::current().record("object_key", object_key.to_string());

    // TODO: Handle GIFs using the `image` crate instead (requires implementing the encoder and the
    // decoder)
    if is_gif {
        debug!("uploading a GIF image to S3 with size: {}", img_bytes.len());

        s3_client
            .put_object()
            .bucket(S3_UPLOADS_BUCKET)
            .key(object_key.to_string())
            .content_type(IMAGE_GIF.to_string())
            // User ID
            .metadata("uid", user_id.to_string())
            .body(img_bytes.into())
            .send()
            .await
            .map_err(|error| {
                AppError::InternalError(format!(
                    "unable to upload the GIF image to s3: {:?}",
                    error.into_service_error()
                ))
            })?;

        debug!(
            "uploaded GIF image to s3 with key: {}",
            object_key.to_string()
        );
    } else {
        debug!("uploading an image to S3 with size: {}", img_bytes.len());

        let mut bytes: Vec<u8> = Vec::new();
        loaded_img
            .write_to(&mut Cursor::new(&mut bytes), output_format)
            .map_err(|error| {
                AppError::InternalError(format!(
                    "unable to write the image into the desired format: {error:?}"
                ))
            })?;

        s3_client
            .put_object()
            .bucket(S3_UPLOADS_BUCKET)
            .key(object_key.to_string())
            .content_type(output_mime)
            // User ID
            .metadata("uid", user_id.to_string())
            .body(bytes.into())
            .send()
            .await
            .map_err(|error| {
                AppError::InternalError(format!(
                    "unable to upload the image to s3: {:?}",
                    error.into_service_error()
                ))
            })?;

        debug!("uploaded image to s3 with key: {}", object_key.to_string());
    }

    trace!("inserting an asset for the image into the database");

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    // Insert an asset.
    match sqlx::query(
        r#"
INSERT INTO assets (key, hex, height, width, alt, user_id) 
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, rating
"#,
    )
    .bind(object_key)
    .bind(&hex_color)
    .bind(img_height as i16)
    .bind(img_width as i16)
    .bind(img_alt)
    .bind(user_id)
    .fetch_one(&mut *txn)
    .await
    {
        Ok(asset) => {
            incr_resource_limit(&data.redis, ResourceLimit::CreateAsset, user_id).await?;

            match txn.commit().await {
                Ok(_) => {
                    trace!("asset upload completed");

                    Ok(HttpResponse::Created().json(Response {
                        id: asset.get::<i64, _>("id"),
                        key: object_key.to_string(),
                        alt: img_alt.to_string(),
                        hex: hex_color,
                        width: img_width as i16,
                        height: img_height as i16,
                        rating: asset.get::<i16, _>("rating"),
                    }))
                }
                Err(error) => {
                    delete_s3_objects(s3_client, S3_UPLOADS_BUCKET, vec![object_key.to_string()])
                        .await
                        .map_err(|error| {
                            AppError::InternalError(format!(
                                "removing orphaned object due to database error failed: {error:?}",
                            ))
                        })?;

                    Err(AppError::SqlxError(error))
                }
            }
        }
        Err(error) => {
            delete_s3_objects(s3_client, S3_UPLOADS_BUCKET, vec![object_key.to_string()])
                .await
                .map_err(|error| {
                    AppError::InternalError(format!(
                        "removing orphaned object due to database error failed: {error:?}",
                    ))
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
        config::get_app_config,
        oauth::get_oauth_client_map,
        test_utils::{
            exceed_resource_limit,
            get_lapin_pool,
            get_redis_pool,
            get_resource_limit,
            get_s3_client,
            RedisTestContext,
            TestContext,
        },
        utils::delete_s3_objects_using_prefix::delete_s3_objects_using_prefix,
        RedisPool,
        S3Client,
    };
    use actix_web::{
        App,
        HttpServer,
    };
    use futures::future;
    use reqwest::{
        multipart::{
            Form,
            Part,
        },
        Body,
        StatusCode,
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
    #[post("/v1/me/assets")]
    async fn unsecure_post(
        form: MultipartForm<UploadAsset>,
        data: web::Data<AppState>,
    ) -> Result<HttpResponse, AppError> {
        handle_upload(form, data, 1_i64).await
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

        // Insert the user.
        sqlx::query(
            r#"
INSERT INTO users (id, name, username, email)
VALUES ($1, $2, $3, $4)
"#,
        )
        .bind(1_i64)
        .bind("Some user".to_string())
        .bind("some_user".to_string())
        .bind("someone@example.com".to_string())
        .execute(&db_pool_clone)
        .await
        .unwrap();

        (client, generate_url)
    }

    /// Reads and returns an image part from a local image on the disk for multipart form response.
    ///
    /// * `path` - The sub-path to the image file.
    /// * `file_name` - The name for the image file.
    /// * `mime` - The mime type for the image file.
    async fn get_image_part(path: &str, file_name: &str, mime: &str) -> Part {
        let file =
            tokio::fs::File::open(format!("src/routes/v1/me/assets/fixtures/images/{}", path))
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
                    delete_s3_objects_using_prefix(&self.s3_client, S3_UPLOADS_BUCKET, None, None)
                        .await
                        .unwrap()
                },
            )
            .await;
        }
    }

    #[sqlx::test]
    async fn can_reject_an_image_with_bad_mime_type(pool: PgPool) -> sqlx::Result<()> {
        let (client, generate_url) = init_web_server_for_test(pool, None).await;

        let part = get_image_part("normal.jpg", "image.jpg", "text/plain").await;
        let form = Form::new().text("alt", "").part("file", part);

        let res = client
            .post(generate_url("/v1/me/assets"))
            .multipart(form)
            .send()
            .await
            .unwrap();

        assert!(res.status().is_client_error());
        assert_eq!(
            res.json::<ToastErrorResponse>().await.unwrap().error,
            "Unsupported image type".to_string()
        );

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_a_non_image_file(pool: PgPool) -> sqlx::Result<()> {
        let (client, generate_url) = init_web_server_for_test(pool, None).await;

        let part = get_image_part("sample.txt", "invalid.jpg", IMAGE_JPEG.as_ref()).await;
        let form = Form::new().text("alt", "").part("file", part);

        let res = client
            .post(generate_url("/v1/me/assets"))
            .multipart(form)
            .send()
            .await
            .unwrap();

        assert!(res.status().is_client_error());

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_an_image_with_large_file_size(pool: PgPool) -> sqlx::Result<()> {
        let (client, generate_url) = init_web_server_for_test(pool, None).await;

        let part = get_image_part("large_size.png", "image.png", IMAGE_PNG.as_ref()).await;
        let form = Form::new().text("alt", "").part("file", part);

        let res = client
            .post(generate_url("/v1/me/assets"))
            .multipart(form)
            .send()
            .await
            .unwrap();

        assert!(res.status().is_client_error());
        assert_eq!(
            res.json::<ToastErrorResponse>().await.unwrap().error,
            "Image is too big".to_string()
        );

        Ok(())
    }

    // TODO: Remove this test when we start to support resizing GIF images.
    #[sqlx::test]
    async fn can_reject_an_oversized_gif(pool: PgPool) -> sqlx::Result<()> {
        let (client, generate_url) = init_web_server_for_test(pool, None).await;

        let part = get_image_part("large_dims.gif", "image.gif", IMAGE_GIF.as_ref()).await;
        let form = Form::new().text("alt", "").part("file", part);

        let res = client
            .post(generate_url("/v1/me/assets"))
            .multipart(form)
            .send()
            .await
            .unwrap();

        assert!(res.status().is_client_error());
        assert_eq!(
            res.json::<ToastErrorResponse>().await.unwrap().error,
            "Image is too big".to_string()
        );

        Ok(())
    }

    // See https://www.bamsoftware.com/hacks/deflate.html
    #[sqlx::test]
    async fn can_reject_a_png_bomb(pool: PgPool) -> sqlx::Result<()> {
        let (client, generate_url) = init_web_server_for_test(pool, None).await;

        let part = get_image_part("img_bomb.png", "image.png", IMAGE_PNG.as_ref()).await;
        let form = Form::new().text("alt", "").part("file", part);

        let res = client
            .post(generate_url("/v1/me/assets"))
            .multipart(form)
            .send()
            .await
            .unwrap();

        assert!(res.status().is_client_error());

        Ok(())
    }

    mod serial {
        use super::*;

        // This test also asserts JPG/JPEG image handling
        #[test_context(LocalTestContext)]
        #[sqlx::test]
        async fn can_insert_an_asset(ctx: &mut LocalTestContext, pool: PgPool) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (client, generate_url) =
                init_web_server_for_test(pool, Some(ctx.s3_client.clone())).await;

            let part = get_image_part("normal.jpg", "image.jpg", IMAGE_JPEG.as_ref()).await;
            let form = Form::new().text("alt", "Some alt").part("file", part);

            let res = client
                .post(generate_url("/v1/me/assets"))
                .multipart(form)
                .send()
                .await
                .unwrap();

            assert!(res.status().is_success());
            let json = res.json::<Response>().await;
            assert!(json.is_ok());

            // Should insert metadata into the database.
            let result = sqlx::query(
                r#"
SELECT alt FROM assets
WHERE id = $1
"#,
            )
            .bind(json.unwrap().id)
            .fetch_one(&mut *conn)
            .await?;

            assert_eq!(result.get::<String, _>("alt"), "Some alt".to_string());

            // Should also increment the resource limit.
            let result =
                get_resource_limit(&ctx.redis_pool, ResourceLimit::CreateAsset, 1_i64).await;

            assert_eq!(result, 1);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_an_asset_on_exceeding_the_resource_limit(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let (client, generate_url) = init_web_server_for_test(pool, None).await;

            let part = get_image_part("normal.jpg", "image.jpg", IMAGE_JPEG.as_ref()).await;
            let form = Form::new().text("alt", "Some alt").part("file", part);

            exceed_resource_limit(&ctx.redis_pool, ResourceLimit::CreateAsset, 1_i64).await;

            let res = client
                .post(generate_url("/v1/me/assets"))
                .multipart(form)
                .send()
                .await
                .unwrap();

            assert_eq!(res.status(), StatusCode::TOO_MANY_REQUESTS);

            Ok(())
        }

        #[test_context(LocalTestContext)]
        #[sqlx::test]
        async fn can_insert_an_asset_without_a_file_extension(
            ctx: &mut LocalTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let (client, generate_url) =
                init_web_server_for_test(pool, Some(ctx.s3_client.clone())).await;

            let part = get_image_part("normal.jpg", "image", IMAGE_JPEG.as_ref()).await;
            let form = Form::new().text("alt", "").part("file", part);

            let res = client
                .post(generate_url("/v1/me/assets"))
                .multipart(form)
                .send()
                .await
                .unwrap();

            assert!(res.status().is_success());

            Ok(())
        }

        #[test_context(LocalTestContext)]
        #[sqlx::test]
        async fn can_scale_down_a_large_image(
            ctx: &mut LocalTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let (client, generate_url) =
                init_web_server_for_test(pool, Some(ctx.s3_client.clone())).await;

            let part = get_image_part("large_dims.jpg", "image.jpg", IMAGE_JPEG.as_ref()).await;
            let form = Form::new().text("alt", "").part("file", part);

            let res = client
                .post(generate_url("/v1/me/assets"))
                .multipart(form)
                .send()
                .await
                .unwrap();

            assert!(res.status().is_success());
            let json = res.json::<Response>().await.unwrap();
            assert_eq!(json.width, 2048); // 2k limit

            Ok(())
        }

        #[test_context(LocalTestContext)]
        #[sqlx::test]
        async fn can_handle_a_png_image(
            ctx: &mut LocalTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let (client, generate_url) =
                init_web_server_for_test(pool, Some(ctx.s3_client.clone())).await;

            let part = get_image_part("image.png", "image.png", IMAGE_PNG.as_ref()).await;
            let form = Form::new().text("alt", "").part("file", part);

            let res = client
                .post(generate_url("/v1/me/assets"))
                .multipart(form)
                .send()
                .await
                .unwrap();

            assert!(res.status().is_success());

            Ok(())
        }

        #[test_context(LocalTestContext)]
        #[sqlx::test]
        async fn can_handle_a_gif_image(
            ctx: &mut LocalTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let (client, generate_url) =
                init_web_server_for_test(pool, Some(ctx.s3_client.clone())).await;

            let part = get_image_part("image.gif", "image.gif", IMAGE_GIF.as_ref()).await;
            let form = Form::new().text("alt", "").part("file", part);

            let res = client
                .post(generate_url("/v1/me/assets"))
                .multipart(form)
                .send()
                .await
                .unwrap();

            assert!(res.status().is_success());

            Ok(())
        }

        #[test_context(LocalTestContext)]
        #[sqlx::test]
        async fn can_handle_a_webp_image(
            ctx: &mut LocalTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let (client, generate_url) =
                init_web_server_for_test(pool, Some(ctx.s3_client.clone())).await;

            let part = get_image_part("image.webp", "image.webp", "image/webp").await;
            let form = Form::new().text("alt", "").part("file", part);

            let res = client
                .post(generate_url("/v1/me/assets"))
                .multipart(form)
                .send()
                .await
                .unwrap();

            assert!(res.status().is_success());

            Ok(())
        }

        #[test_context(LocalTestContext)]
        #[sqlx::test]
        async fn can_handle_an_animated_webp_image(
            ctx: &mut LocalTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let (client, generate_url) =
                init_web_server_for_test(pool, Some(ctx.s3_client.clone())).await;

            let part = get_image_part("animated_image.webp", "image.webp", "image/webp").await;
            let form = Form::new().text("alt", "").part("file", part);

            let res = client
                .post(generate_url("/v1/me/assets"))
                .multipart(form)
                .send()
                .await
                .unwrap();

            assert!(res.status().is_success());

            Ok(())
        }
    }
}
