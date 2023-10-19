use crate::{
    constants::buckets::S3_UPLOADS_BUCKET,
    error::{
        AppError,
        ToastErrorResponse,
    },
    middleware::identity::identity::Identity,
    utils::generate_random_object_key::generate_random_object_key,
    AppState,
};
use actix_multipart::form::{
    tempfile::TempFile,
    text::Text,
    MultipartForm,
};
use actix_web::{
    http::header::ContentType,
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
    ImageOutputFormat,
};
use mime::{
    IMAGE_GIF,
    IMAGE_JPEG,
    IMAGE_PNG,
};
use rusoto_s3::{
    PutObjectRequest,
    S3,
};
use serde::{
    Deserialize,
    Serialize,
};
use sqlx::Row;
use std::io::{
    BufReader,
    Cursor,
    Read,
};

const MAX_FILE_SIZE: usize = 1024 * 1024 * 10; // 10 MB

#[derive(MultipartForm)]
struct UploadAsset {
    alt: Text<String>,
    file: TempFile,
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

#[post("/v1/me/assets")]
async fn post(
    form: MultipartForm<UploadAsset>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => {
            let img_alt = &form.alt.0;

            // Validate alt length
            if img_alt.chars().count() > 128 {
                return Ok(HttpResponse::BadRequest().json(ToastErrorResponse::new(
                    "Invalid alt text length".to_string(),
                )));
            }

            let img_file = &form.file;
            let file_name = &img_file.file_name.clone().unwrap_or_default();
            let mime_type = &img_file.content_type;
            let supported_image_mimes: Vec<String> = vec![
                IMAGE_PNG.to_string(),
                IMAGE_GIF.to_string(),
                IMAGE_JPEG.to_string(),
                // TODO: https://github.com/hyperium/mime/pull/129
                "image/webp".to_string(),
            ];

            if mime_type.is_none()
                || !supported_image_mimes.contains(&mime_type.clone().unwrap().to_string())
            {
                return Ok(HttpResponse::BadRequest().body("Unsupported image type"));
            }

            match img_file.size {
                0 => Ok(HttpResponse::BadRequest().finish()),
                length if length > MAX_FILE_SIZE => {
                    Ok(HttpResponse::BadRequest().body("Uploaded file size is too large."))
                }
                _ => {
                    let mut buf_reader = BufReader::new(&img_file.file);
                    let mut img_bytes: Vec<u8> = Vec::new();

                    match buf_reader.read_to_end(&mut img_bytes) {
                        Ok(_) => {
                            match image::load_from_memory(&img_bytes) {
                                Ok(mut img) => {
                                    let (mut img_w, mut img_h) = img.dimensions();
                                    let is_gif = mime_type.clone().unwrap() == IMAGE_GIF
                                        || file_name.split(".").last().unwrap_or_default() == "gif";

                                    // Scale down to 2k
                                    if img_w > 2048 || img_h > 2048 {
                                        if is_gif {
                                            // TODO: Handle resizing GIF images
                                            return Ok(
                                                HttpResponse::BadRequest().body("Image is too big")
                                            );
                                        }

                                        img = img.resize(2048, 2048, FilterType::CatmullRom);
                                        let (next_img_w, next_img_h) = img.dimensions(); // Update dimensions
                                        img_w = next_img_w;
                                        img_h = next_img_h;
                                    }

                                    // Compute the dominant color from the image
                                    let dom_color = get_colors(img.to_rgb8().as_bytes(), false);
                                    let mut hex_color = Rgb::from(
                                        dom_color[0].into(),
                                        dom_color[1].into(),
                                        dom_color[2].into(),
                                    )
                                    .to_css_hex_string();
                                    // Remove the `#` prefix from the hex color
                                    hex_color.remove(0);

                                    // Decide output parameter based on the file extension
                                    let (output_format, output_mime) = match file_name
                                        .split(".")
                                        .last()
                                    {
                                        None => (ImageOutputFormat::WebP, "image/webp".to_string()),
                                        Some(ext) => match ext {
                                            "jpeg" | "jpg" => (
                                                ImageOutputFormat::Jpeg(80),
                                                IMAGE_JPEG.to_string(),
                                            ),
                                            "png" => {
                                                (ImageOutputFormat::Png, IMAGE_PNG.to_string())
                                            }
                                            _ => {
                                                (ImageOutputFormat::WebP, "image/webp".to_string())
                                            }
                                        },
                                    };

                                    let s3_client = &data.s3_client;
                                    let object_key = generate_random_object_key();

                                    // TODO: Handle GIFs using `image` crate (requires
                                    // encoder/decoder)
                                    if is_gif {
                                        match s3_client
                                            .put_object(PutObjectRequest {
                                                bucket: S3_UPLOADS_BUCKET.to_string(),
                                                key: object_key.clone(),
                                                content_type: Some(IMAGE_GIF.to_string()),
                                                body: Some(img_bytes.into()),
                                                ..Default::default()
                                            })
                                            .await
                                        {
                                            Ok(_) => {}
                                            Err(_) => {
                                                return Ok(HttpResponse::InternalServerError()
                                                    .json(ToastErrorResponse::new(
                                                        "Could not upload the image".to_string(),
                                                    )));
                                            }
                                        };
                                    } else {
                                        let mut bytes: Vec<u8> = Vec::new();
                                        img.write_to(&mut Cursor::new(&mut bytes), output_format)
                                            .unwrap();

                                        match s3_client
                                            .put_object(PutObjectRequest {
                                                bucket: S3_UPLOADS_BUCKET.to_string(),
                                                key: object_key.clone(),
                                                content_type: Some(output_mime),
                                                body: Some(bytes.into()),
                                                ..Default::default()
                                            })
                                            .await
                                        {
                                            Ok(_) => {}
                                            Err(_) => {
                                                return Ok(HttpResponse::InternalServerError()
                                                    .json(ToastErrorResponse::new(
                                                        "Could not upload the image".to_string(),
                                                    )));
                                            }
                                        };
                                    }

                                    // Insert asset
                                    let asset = sqlx::query(
                                        r#"
                                        INSERT INTO assets(key, hex, height, width, alt, user_id) 
                                        VALUES ($1, $2, $3, $4, $5)
                                        RETURNING id, rating
                                        "#,
                                    )
                                    .bind(&object_key)
                                    .bind(&hex_color)
                                    .bind(img_h as i16)
                                    .bind(img_w as i16)
                                    .bind(img_alt)
                                    .bind(user_id)
                                    .fetch_one(&data.db_pool)
                                    .await?;

                                    Ok(HttpResponse::Created()
                                        .content_type(ContentType::json())
                                        .json(Response {
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
                                    Ok(HttpResponse::BadRequest()
                                        .body("Unable to decode the image"))
                                }
                            }
                        }
                        Err(_) => {
                            Ok(HttpResponse::BadRequest().body("Could not read the image file"))
                        }
                    }
                }
            }
        }
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::test_utils::init_web_server_for_test;
    use actix_http::body::to_bytes;
    use actix_web::test;
    use reqwest::StatusCode;
    use sqlx::PgPool;
    use std::{
        cell::RefCell,
        fs::{
            self,
            File,
        },
        rc::Rc,
        str,
        sync::Arc,
    };

    #[derive(Serialize)]
    struct FormData {
        alt: String,
        // file: File,
    }

    #[sqlx::test]
    async fn can_insert_an_asset(pool: PgPool) -> sqlx::Result<()> {
        let (client, generate_url) = init_web_server_for_test(post, pool, true, false).await;

        let res = client.get(generate_url("/invalid")).send().await.unwrap();
        assert_eq!(res.status(), StatusCode::NOT_FOUND);

        // let img_file = fs::File::open("./fixtures/images/baker-solar-quilt.png")?;
        //
        // let req = test::TestRequest::post()
        //     .cookie(cookie.unwrap())
        //     .set_form(FormData {
        //         alt: "".to_string(),
        //     })
        //     .uri("/v1/me/assets")
        //     .to_request();
        // let res = test::call_service(&app, req).await;
        //
        // println!("{:#?} {}", res.response().body(), res.status());
        //
        // assert!(res.status().is_success());
        //
        // let json = serde_json::from_str::<Response>(
        //     str::from_utf8(&to_bytes(res.into_body()).await.unwrap().to_vec()).unwrap(),
        // );
        //
        // assert!(json.is_ok());
        //
        // let json_data = json.unwrap();
        // // By default, the user will have `Account created` activity
        // let creation_activity = &json_data[0];
        //
        // // Should return description generated at the application layer
        // assert!(
        //     creation_activity
        //         .description
        //         .clone()
        //         .unwrap()
        //         .starts_with("You created this account on")
        // );

        Ok(())
    }
}
