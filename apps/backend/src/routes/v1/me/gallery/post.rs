use crate::{
    constants::{
        buckets::S3_UPLOADS_BUCKET,
        pexels::PEXELS_API_URL,
        resource_limit::ResourceLimit,
    },
    error::{
        AppError,
        ToastErrorResponse,
    },
    middlewares::identity::identity::Identity,
    models::photo::Photo,
    utils::{
        check_resource_limit::check_resource_limit,
        incr_resource_limit::incr_resource_limit,
    },
    AppState,
    S3Client,
};
use actix_http::StatusCode;
use actix_web::{
    post,
    web,
    HttpResponse,
};
use actix_web_validator::Json;
use colors_transform::Rgb;
use dominant_color::get_colors;
use image::{
    imageops::FilterType,
    EncodableLayout,
    GenericImageView,
    ImageError,
    ImageFormat,
};
use mime::IMAGE_JPEG;
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::Row;
use std::{
    cmp,
    io::Cursor,
    time::Duration,
};
use tracing::{
    debug,
    trace,
    warn,
};
use uuid::Uuid;
use validator::Validate;

static MAX_FILE_SIZE: u64 = 1024 * 1024 * 25; // 25 MB

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(length(min = 1, max = 128, message = "Invalid photo ID"))]
    id: String,
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

/// Returns the URL of the photo image, with custom width and height query parameters.
///
/// # Caution
///
/// This URL format is not documented by Pexels, but their public API follows this format.
///
/// * `photo_id` - The ID of the photo resource.
fn get_photo_image_url(photo_id: &str) -> String {
    format!(
        "https://images.pexels.com/photos/{photo_id}/pexels-photo-{photo_id}.jpeg?auto=compress&cs=tinysrgb&h=2048&w=2048"
    )
}

/// Deletes an orphaned object from S3 if the database operation fails for some reason.
///
/// * `s3_client` - The S3 client instance.
/// * `key` - The key of the orphaned object.
async fn delete_orphaned_object(s3_client: &S3Client, key: &str) -> Result<(), AppError> {
    s3_client
        .delete_object()
        .bucket(S3_UPLOADS_BUCKET)
        .key(key)
        .send()
        .await
        .map(|_| ())
        .map_err(|error| {
            AppError::InternalError(format!(
                "removing orphaned object due to database error failed: {:?}",
                error.into_service_error()
            ))
        })
}

#[post("/v1/me/gallery")]
#[tracing::instrument(
    name = "POST /v1/me/gallery",
    skip_all,
    fields(
        user_id = user.id().ok(),
        photo_id = %payload.id,
        content_length = tracing::field::Empty,
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
async fn post(
    payload: Json<Request>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    let user_id = user.id()?;
    let photo_id = payload
        .id
        .parse::<i64>()
        .map_err(|_| AppError::from("Invalid photo ID"))?;

    if !check_resource_limit(&data.redis, ResourceLimit::CreateAsset, user_id).await? {
        return Err(ToastErrorResponse::new(
            Some(StatusCode::TOO_MANY_REQUESTS),
            "Daily limit exceeded for uploading media. Try again tomorrow.",
        )
        .into());
    }

    let reqwest_client = &data.reqwest_client;
    let pexels_api_key = &data.config.pexels_api_key.to_string();

    let response = reqwest_client
        .get(format!("{}/{}/{}", PEXELS_API_URL, "v1/photos", photo_id))
        .header(reqwest::header::AUTHORIZATION, pexels_api_key)
        .send()
        .await
        .map_err(|error| {
            // Pexels returns 404 status code for an invalid photo.
            if error.status().map(|value| value.as_u16()) == Some(StatusCode::NOT_FOUND.as_u16()) {
                AppError::ToastError(ToastErrorResponse::new(None, "Photo not found"))
            } else {
                AppError::InternalError(format!("unable to fetch the Pexels photo: {error:?}"))
            }
        })?;

    if response.status().as_u16() == StatusCode::NOT_FOUND.as_u16() {
        return Err(ToastErrorResponse::new(None, "Photo not found").into());
    } else if !response.status().is_success() {
        return Err(AppError::InternalError(format!(
            "unable to fetch the Pexels photo: {response:?}"
        )));
    };

    let photo = serde_json::from_str::<Photo>(&response.text().await.unwrap_or_default()).map_err(
        |error| {
            AppError::InternalError(format!(
                "unable to deserialize the Pexels response: {error:?}"
            ))
        },
    )?;

    let image_response = reqwest_client
        .get(get_photo_image_url(&photo_id.to_string()))
        .timeout(Duration::from_secs(30)) // 30 seconds download timeout
        .send()
        .await
        .map_err(|error| {
            AppError::InternalError(format!("unable to download the Pexels photo: {error:?}"))
        })?;

    let image_size = image_response.content_length().unwrap_or_default();

    debug!("photo response `content-length` value: {image_size}");
    tracing::Span::current().record("content_length", image_size);

    if image_size == 0 {
        warn!("unexpected image size (0 bytes) from response: {image_response:?}");

        return Err(ToastErrorResponse::new(
            Some(StatusCode::UNPROCESSABLE_ENTITY),
            "There was an issue while processing this image",
        )
        .into());
    }

    if image_size > MAX_FILE_SIZE {
        return Err(ToastErrorResponse::new(
            Some(StatusCode::UNPROCESSABLE_ENTITY),
            "Photo is too large",
        )
        .into());
    }

    // Download the image into the memory.
    let image_bytes = image_response.bytes().await.map_err(|error| {
        AppError::InternalError(format!("unable to download the image: {error:?}"))
    })?;

    debug!("downloaded image buffer size: {} bytes", image_bytes.len());
    tracing::Span::current().record("buffer_size", image_bytes.len());

    let mut loaded_image = image::load_from_memory(&image_bytes).map_err(|error| match error {
        ImageError::Decoding(decode_error) => {
            warn!("image decode error: {decode_error:?}");

            AppError::ToastError(ToastErrorResponse::new(
                Some(StatusCode::UNPROCESSABLE_ENTITY),
                "Photo is not supported",
            ))
        }
        ImageError::Limits(limit_error) => {
            warn!("image limit error: {limit_error:?}");

            AppError::ToastError(ToastErrorResponse::new(
                Some(StatusCode::UNPROCESSABLE_ENTITY),
                "Photo is too big",
            ))
        }
        _ => AppError::InternalError(format!("unable to load the image from memory: {error:?}")),
    })?;

    let (mut img_width, mut img_height) = loaded_image.dimensions();

    debug!("image dimensions: {img_width}px width, {img_height}px height");
    tracing::Span::current().record("original_width", img_width);
    tracing::Span::current().record("original_height", img_height);

    // The image is likely a PNG decompression bomb.
    if cmp::max(img_width, img_height) > 10_000 {
        debug!("aborting upload due to huge image dimensions");

        return Err(ToastErrorResponse::new(
            Some(StatusCode::UNPROCESSABLE_ENTITY),
            "Photo is not supported",
        )
        .into());
    }

    // Scale down to 2k
    if img_width > 2048 || img_height > 2048 {
        loaded_image = loaded_image.resize(2048, 2048, FilterType::CatmullRom);
        // Refresh dimensions
        let (next_img_width, next_img_height) = loaded_image.dimensions();
        img_width = next_img_width;
        img_height = next_img_height;

        debug!("image scaled down to new dimensions: {img_width}px width, {img_height}px height");
        tracing::Span::current().record("scaled_width", img_width);
        tracing::Span::current().record("scaled_height", img_height);
    }

    let img_alt = if let Some(photo_alt) = photo.alt {
        debug!("alt text from the image response: {photo_alt}");

        if photo_alt.chars().count() > 128 {
            "".to_string()
        } else {
            photo_alt
        }
    } else {
        "".to_string()
    };

    let hex_color = {
        if let Some(avg_color) = photo.avg_color {
            debug!("average color from the image response: {avg_color}");

            let mut color = avg_color;

            // Remove the `#` prefix from the hex color.
            color.remove(0);
            color
        } else {
            trace!(
                "`avg_color` not received from Pexels, manually computing the dominant color for the image"
            );

            // Compute the dominant HEX color from the image.
            let dom_color = get_colors(loaded_image.to_rgb8().as_bytes(), false);
            let mut color = Rgb::from(
                dom_color[0].into(),
                dom_color[1].into(),
                dom_color[2].into(),
            )
            .to_css_hex_string();
            // Remove the `#` prefix from the hex color
            color.remove(0);

            color
        }
    }.to_lowercase();

    debug!("computed the dominant color for the image: #{hex_color}");
    tracing::Span::current().record("computed_color", format!("#{hex_color}"));

    let s3_client = &data.s3_client;
    let object_key = Uuid::new_v4();

    tracing::Span::current().record("object_key", object_key.to_string());

    debug!("uploading an image to S3 with size: {}", image_bytes.len());

    let mut bytes: Vec<u8> = Vec::new();
    loaded_image
        // Write to a JPEG image with the default quality.
        .write_to(&mut Cursor::new(&mut bytes), ImageFormat::Jpeg)
        .map_err(|error| {
            AppError::InternalError(format!(
                "unable to write the image into the desired format: {error:?}"
            ))
        })?;

    s3_client
        .put_object()
        .bucket(S3_UPLOADS_BUCKET)
        .key(object_key.to_string())
        .content_type(IMAGE_JPEG.to_string())
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

    let pg_pool = &data.db_pool;
    let mut txn = pg_pool.begin().await?;

    // Insert an asset.
    match sqlx::query(
        r#"
INSERT INTO assets (
    key,
    hex,
    height,
    width,
    alt,
    user_id
)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, rating
"#,
    )
    .bind(object_key)
    .bind(&hex_color)
    .bind(img_height as i16)
    .bind(img_width as i16)
    .bind(img_alt.clone())
    .bind(user_id)
    .fetch_one(&mut *txn)
    .await
    {
        Ok(asset) => {
            incr_resource_limit(&data.redis, ResourceLimit::CreateAsset, user_id).await?;

            match txn.commit().await {
                Ok(_) => {
                    trace!("photo upload completed");

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
                    delete_orphaned_object(s3_client, &object_key.to_string()).await?;
                    Err(AppError::SqlxError(error))
                }
            }
        }
        Err(error) => {
            delete_orphaned_object(s3_client, &object_key.to_string()).await?;
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
            assert_toast_error_response,
            exceed_resource_limit,
            get_redis_pool,
            get_resource_limit,
            get_s3_client,
            init_app_for_test,
            res_to_string,
            RedisTestContext,
            TestContext,
        },
        utils::delete_s3_objects_using_prefix::delete_s3_objects_using_prefix,
        RedisPool,
    };
    use actix_http::StatusCode;
    use actix_web::test;
    use futures_util::future;
    use sqlx::{
        PgPool,
        Row,
    };
    use storiny_macros::test_context;

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
    async fn can_reject_an_invalid_photo(pool: PgPool) -> sqlx::Result<()> {
        let (app, cookie, _) = init_app_for_test(post, pool, true, false, None).await;

        let req = test::TestRequest::post()
            .cookie(cookie.unwrap())
            .uri("/v1/me/gallery")
            .set_json(Request {
                id: "1".to_string(),
            })
            .to_request();
        let res = test::call_service(&app, req).await;

        assert!(res.status().is_client_error());
        assert_toast_error_response(res, "Photo not found").await;

        Ok(())
    }

    mod serial {
        use super::*;

        #[test_context(LocalTestContext)]
        #[sqlx::test]
        async fn can_upload_a_photo_from_pexels(
            ctx: &mut LocalTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let mut conn = pool.acquire().await?;
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri("/v1/me/gallery")
                .set_json(Request {
                    id: "2014422".to_string(),
                })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert!(res.status().is_success());

            let json = serde_json::from_str::<Response>(&res_to_string(res).await).unwrap();

            // Asset should be present in the database.
            let result = sqlx::query(
                r#"
SELECT EXISTS (
    SELECT 1 FROM assets
    WHERE user_id = $1 AND id = $2
)
"#,
            )
            .bind(user_id.unwrap())
            .bind(json.id)
            .fetch_one(&mut *conn)
            .await?;

            assert!(result.get::<bool, _>("exists"));

            // Should also increment the resource limit.
            let result = get_resource_limit(
                &ctx.redis_pool,
                ResourceLimit::CreateAsset,
                user_id.unwrap(),
            )
            .await;

            assert_eq!(result, 1);

            Ok(())
        }

        #[test_context(RedisTestContext)]
        #[sqlx::test]
        async fn can_reject_a_photo_upload_request_on_exceeding_the_resource_limit(
            ctx: &mut RedisTestContext,
            pool: PgPool,
        ) -> sqlx::Result<()> {
            let (app, cookie, user_id) = init_app_for_test(post, pool, true, false, None).await;

            exceed_resource_limit(
                &ctx.redis_pool,
                ResourceLimit::CreateAsset,
                user_id.unwrap(),
            )
            .await;

            let req = test::TestRequest::post()
                .cookie(cookie.unwrap())
                .uri("/v1/me/gallery")
                .set_json(Request {
                    id: "2014422".to_string(),
                })
                .to_request();
            let res = test::call_service(&app, req).await;

            assert_eq!(res.status(), StatusCode::TOO_MANY_REQUESTS);

            Ok(())
        }
    }
}
