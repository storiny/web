use crate::{
    constants::buckets::S3_UPLOADS_BUCKET, constants::pexels::PEXELS_API_URL, error::AppError,
    middleware::identity::identity::Identity, models::photo::Photo,
    utils::generate_random_object_key::generate_random_object_key, AppState,
};
use actix_web::{post, web, HttpResponse};
use actix_web_validator::Json;
use colors_transform::Rgb;
use dominant_color::get_colors;
use image::{imageops::FilterType, EncodableLayout, GenericImageView, ImageOutputFormat};
use mime::IMAGE_JPEG;
use rusoto_s3::{DeleteObjectRequest, PutObjectRequest, S3};
use serde::{Deserialize, Serialize};
use sqlx::Row;
use std::{io::Cursor, time::Duration};
use validator::Validate;

static MAX_FILE_SIZE: u64 = 1024 * 1024 * 25; // 25 MB

#[derive(Debug, Serialize, Deserialize, Validate)]
struct Request {
    #[validate(length(min = 1, max = 128, message = "Invalid photo ID"))]
    id: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct Response {
    id: i64,
    key: String,
    hex: String,
    alt: String,
    rating: i16,
    width: i16,
    height: i16,
}

/// Return the URL of the photo image, with custom width and height query parameters.
///
/// * `photo_id` - The ID of the photo resource.
fn get_photo_image_url(photo_id: &str) -> String {
    format!("https://images.pexels.com/photos/{photo_id}/pexels-photo-{photo_id}.jpeg?auto=compress&cs=tinysrgb&h=2048&w=2048")
}

#[post("/v1/me/gallery")]
async fn post(
    payload: Json<Request>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => match payload.id.parse::<i64>() {
            Ok(photo_id) => {
                let reqwest_client = &data.reqwest_client;
                let api_key = (&data.pexels_api_key).to_owned();

                match reqwest_client
                    .get(format!("{}/{}/{}", PEXELS_API_URL, "v1/photos", photo_id))
                    .header(reqwest::header::AUTHORIZATION, api_key)
                    .send()
                    .await
                {
                    Ok(result) => {
                        if !result.status().is_success() {
                            return Ok(HttpResponse::BadRequest().body("Photo not found"));
                        };

                        match serde_json::from_str::<Photo>(
                            &result.text().await.unwrap_or_default(),
                        ) {
                            Ok(photo) => {
                                match reqwest_client
                                    .get(get_photo_image_url(&photo_id.to_string()))
                                    .timeout(Duration::from_secs(30)) // 30 seconds download timeout
                                    .send()
                                    .await
                                {
                                    Ok(image) => {
                                        let image_size = image.content_length().unwrap_or_default();

                                        if image_size == 0 {
                                            return Ok(HttpResponse::UnprocessableEntity().finish());
                                        }

                                        if image_size > MAX_FILE_SIZE {
                                            return Ok(HttpResponse::UnprocessableEntity()
                                                .body("Photo is too big"));
                                        }

                                        // Download the image
                                        let image_bytes = image.bytes().await;

                                        if image_bytes.is_err() {
                                            return Ok(HttpResponse::UnprocessableEntity().finish());
                                        }

                                        match image::load_from_memory(&image_bytes.unwrap()) {
                                            Ok(mut img) => {
                                                let (mut img_w, mut img_h) = img.dimensions();

                                                // Scale down to 2k
                                                if img_w > 2048 || img_h > 2048 {
                                                    img = img.resize(
                                                        2048,
                                                        2048,
                                                        FilterType::CatmullRom,
                                                    );
                                                    let (next_img_w, next_img_h) = img.dimensions(); // Update dimensions
                                                    img_w = next_img_w;
                                                    img_h = next_img_h;
                                                }

                                                let img_alt = if let Some(photo_alt) = photo.alt {
                                                    if photo_alt.chars().count() > 128 {
                                                        "".to_string()
                                                    } else {
                                                        photo_alt
                                                    }
                                                } else {
                                                    "".to_string()
                                                };

                                                let hex_color = if photo.avg_color.is_some() {
                                                    let mut color =
                                                        photo.avg_color.unwrap().clone();
                                                    // Remove the `#` prefix from the hex color
                                                    color.remove(0);
                                                    color
                                                } else {
                                                    // Compute the dominant color from the image
                                                    let dom_color =
                                                        get_colors(img.to_rgb8().as_bytes(), false);
                                                    let mut color = Rgb::from(
                                                        dom_color[0].into(),
                                                        dom_color[1].into(),
                                                        dom_color[2].into(),
                                                    )
                                                    .to_css_hex_string();
                                                    // Remove the `#` prefix from the hex color
                                                    color.remove(0);
                                                    color
                                                };

                                                let s3_client = &data.s3_client;
                                                let object_key = generate_random_object_key();

                                                let mut bytes: Vec<u8> = Vec::new();
                                                img.write_to(
                                                    &mut Cursor::new(&mut bytes),
                                                    ImageOutputFormat::Jpeg(80),
                                                )
                                                .unwrap();

                                                match s3_client
                                                    .put_object(PutObjectRequest {
                                                        bucket: S3_UPLOADS_BUCKET.to_string(),
                                                        key: object_key.clone(),
                                                        content_type: Some(IMAGE_JPEG.to_string()),
                                                        body: Some(bytes.into()),
                                                        ..Default::default()
                                                    })
                                                    .await
                                                {
                                                    Ok(_) => {}
                                                    Err(_) => {
                                                        return Ok(
                                                            HttpResponse::UnprocessableEntity()
                                                                .body("Could not upload the photo"),
                                                        );
                                                    }
                                                };

                                                // Insert asset
                                                match sqlx::query(
                                                    r#"
                                                    INSERT INTO assets(
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
                                                .bind(&object_key)
                                                .bind(&hex_color)
                                                .bind(img_h as i16)
                                                .bind(img_w as i16)
                                                .bind(img_alt.clone())
                                                .bind(user_id)
                                                .fetch_one(&data.db_pool)
                                                .await
                                                {
                                                    Ok(asset) => {
                                                        Ok(HttpResponse::Created().json(Response {
                                                            id: asset.get::<i64, _>("id"),
                                                            key: object_key,
                                                            alt: img_alt.to_string(),
                                                            hex: hex_color,
                                                            width: img_w as i16,
                                                            height: img_h as i16,
                                                            rating: asset.get::<i16, _>("rating"),
                                                        }))
                                                    }
                                                    Err(_) => {
                                                        // Delete the object from S3 if the database operation fails for
                                                        // some reason.
                                                        let _ = s3_client
                                                            .delete_object(DeleteObjectRequest {
                                                                bucket: S3_UPLOADS_BUCKET
                                                                    .to_string(),
                                                                key: object_key.clone(),
                                                                ..Default::default()
                                                            })
                                                            .await;
                                                        Ok(HttpResponse::InternalServerError()
                                                            .finish())
                                                    }
                                                }
                                            }
                                            Err(_) => Ok(HttpResponse::UnprocessableEntity()
                                                .body("Unable to decode the photo")),
                                        }
                                    }
                                    Err(_) => Ok(HttpResponse::InternalServerError().finish()),
                                }
                            }
                            Err(_) => Ok(HttpResponse::InternalServerError().finish()),
                        }
                    }
                    Err(_) => Ok(HttpResponse::InternalServerError().finish()),
                }
            }
            Err(_) => Ok(HttpResponse::BadRequest().body("Invalid photo ID")),
        },
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{init_app_for_test, res_to_string};
    use actix_web::test;
    use sqlx::{PgPool, Row};

    #[sqlx::test]
    async fn can_upload_a_photo_from_pexels(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (app, cookie, user_id) = init_app_for_test(post, pool, true, false).await;

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

        // Asset should be present in the database
        let result = sqlx::query(
            r#"
            SELECT EXISTS(
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

        Ok(())
    }
}
