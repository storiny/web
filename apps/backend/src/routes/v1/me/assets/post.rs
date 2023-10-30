use crate::{
    constants::buckets::S3_UPLOADS_BUCKET,
    error::{AppError, ToastErrorResponse},
    middleware::identity::identity::Identity,
    utils::generate_random_object_key::generate_random_object_key,
    AppState,
};
use actix_multipart::form::{tempfile::TempFile, text::Text, MultipartForm};
use actix_web::{post, web, HttpResponse};
use colors_transform::Rgb;
use dominant_color::get_colors;
use image::{imageops::FilterType, EncodableLayout, GenericImageView, ImageOutputFormat};
use mime::{IMAGE_GIF, IMAGE_JPEG, IMAGE_PNG};
use rusoto_s3::{DeleteObjectRequest, PutObjectRequest, S3};
use serde::{Deserialize, Serialize};
use sqlx::Row;
use std::io::{BufReader, Cursor, Read};

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
async fn secure_post(
    form: MultipartForm<UploadAsset>,
    data: web::Data<AppState>,
    user: Identity,
) -> Result<HttpResponse, AppError> {
    match user.id() {
        Ok(user_id) => handle_upload(form, data, user_id).await,
        Err(_) => Ok(HttpResponse::InternalServerError().finish()),
    }
}

/// Asset upload handler
async fn handle_upload(
    form: MultipartForm<UploadAsset>,
    data: web::Data<AppState>,
    user_id: i64,
) -> Result<HttpResponse, AppError> {
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
        length if length > MAX_FILE_SIZE => Ok(HttpResponse::BadRequest().body("Image is too big")),
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
                                    return Ok(HttpResponse::BadRequest().body("Image is too big"));
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
                            let (output_format, output_mime) = match file_name.split(".").last() {
                                None => (ImageOutputFormat::WebP, "image/webp".to_string()),
                                Some(ext) => match ext {
                                    "jpeg" | "jpg" => {
                                        (ImageOutputFormat::Jpeg(80), IMAGE_JPEG.to_string())
                                    }
                                    "png" => (ImageOutputFormat::Png, IMAGE_PNG.to_string()),
                                    _ => (ImageOutputFormat::WebP, "image/webp".to_string()),
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
                                        return Ok(HttpResponse::UnprocessableEntity().json(
                                            ToastErrorResponse::new(
                                                "Could not upload the image".to_string(),
                                            ),
                                        ));
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
                                        return Ok(HttpResponse::UnprocessableEntity().json(
                                            ToastErrorResponse::new(
                                                "Could not upload the image".to_string(),
                                            ),
                                        ));
                                    }
                                };
                            }

                            // Insert asset
                            match sqlx::query(
                                r#"
                                INSERT INTO assets(key, hex, height, width, alt, user_id) 
                                VALUES ($1, $2, $3, $4, $5, $6)
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
                            .await
                            {
                                Ok(asset) => Ok(HttpResponse::Created().json(Response {
                                    id: asset.get::<i64, _>("id"),
                                    key: object_key,
                                    alt: img_alt.to_string(),
                                    hex: hex_color,
                                    width: img_w as i16,
                                    height: img_h as i16,
                                    rating: asset.get::<i16, _>("rating"),
                                })),
                                Err(_) => {
                                    // Delete the object from S3 if the database operation fails for
                                    // some reason.
                                    let _ = s3_client
                                        .delete_object(DeleteObjectRequest {
                                            bucket: S3_UPLOADS_BUCKET.to_string(),
                                            key: object_key.clone(),
                                            ..Default::default()
                                        })
                                        .await;
                                    Ok(HttpResponse::InternalServerError().finish())
                                }
                            }
                        }
                        Err(_) => Ok(HttpResponse::BadRequest().body("Unable to decode the image")),
                    }
                }
                Err(_) => Ok(HttpResponse::BadRequest().body("Could not read the image file")),
            }
        }
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(secure_post);
}

#[cfg(test)]
mod tests {
    use super::*;
    use actix_web::{App, HttpServer};
    use reqwest::{
        self,
        multipart::{Form, Part},
        Body, Client,
    };
    use rusoto_mock::{MockCredentialsProvider, MockRequestDispatcher};
    use rusoto_s3::S3Client;
    use rusoto_ses::SesClient;
    use rusoto_signature::Region;
    use sqlx::PgPool;
    use std::{net::TcpListener, str};
    use tokio_util::codec::BytesCodec;
    use user_agent_parser::UserAgentParser;

    // Post handler without identity
    #[post("/v1/me/assets")]
    async fn unsecure_post(
        form: MultipartForm<UploadAsset>,
        data: web::Data<AppState>,
    ) -> Result<HttpResponse, AppError> {
        handle_upload(form, data, 1_i64).await
    }

    /// Initializes and spawns an HTTP server for tests using `reqwest`
    ///
    /// * `db_pool` - Postgres pool
    async fn init_web_server_for_test(db_pool: PgPool) -> (Client, Box<dyn Fn(&str) -> String>) {
        let listener = TcpListener::bind("localhost:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        let db_pool_clone = db_pool.clone();
        let server = HttpServer::new(move || {
            // GeoIP service
            let geo_db = maxminddb::Reader::open_readfile("geo/db/GeoLite2-City.mmdb").unwrap();

            // User-agent parser
            let ua_parser = UserAgentParser::from_path("./data/ua_parser/regexes.yaml")
                .expect("Cannot build user-agent parser");

            App::new()
                .app_data(web::Data::new(AppState {
                    redis: None,
                    db_pool: db_pool.clone(),
                    geo_db,
                    ua_parser,
                    ses_client: SesClient::new_with(
                        MockRequestDispatcher::default(),
                        MockCredentialsProvider,
                        Region::UsEast1,
                    ),
                    s3_client: S3Client::new_with(
                        MockRequestDispatcher::default(),
                        MockCredentialsProvider,
                        Region::UsEast1,
                    ),
                    reqwest_client: reqwest::Client::new(),
                    pexels_api_key: "".to_owned(),
                }))
                .service(unsecure_post)
        })
        .workers(1)
        .listen(listener)
        .unwrap()
        .run();

        // tokio::s::spawn(server);
        tokio::spawn(server);

        let client = Client::builder().build().unwrap();

        // URL generator for the server
        let generate_url =
            Box::new(move |path: &str| -> String { format!("http://localhost:{}{}", port, path) });

        // Insert the user
        sqlx::query(
            r#"
            INSERT INTO users(id, name, username, email)
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
    /// * `path` - Pub-path to the image file.
    /// * `file_name` - Name for the image file.
    /// * `mime` - Mime type for the image file.
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

    // This test also asserts JPG/JPEG image handling
    #[sqlx::test]
    async fn can_insert_an_asset(pool: PgPool) -> sqlx::Result<()> {
        let mut conn = pool.acquire().await?;
        let (client, generate_url) = init_web_server_for_test(pool).await;
        let part = get_image_part("normal.jpg", "image.jpg", &IMAGE_JPEG.to_string()).await;
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

        // Should insert metadata into the database
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

        Ok(())
    }

    #[sqlx::test]
    async fn can_reject_an_image_with_bad_mime_type(pool: PgPool) -> sqlx::Result<()> {
        let (client, generate_url) = init_web_server_for_test(pool).await;
        let part = get_image_part("normal.jpg", "image.jpg", "text/plain").await;
        let form = Form::new().text("alt", "").part("file", part);

        let res = client
            .post(generate_url("/v1/me/assets"))
            .multipart(form)
            .send()
            .await
            .unwrap();

        assert!(res.status().is_client_error());
        assert_eq!(res.text().await.unwrap(), "Unsupported image type");

        Ok(())
    }

    #[sqlx::test]
    async fn can_insert_an_asset_without_file_extension(pool: PgPool) -> sqlx::Result<()> {
        let (client, generate_url) = init_web_server_for_test(pool).await;
        let part = get_image_part("normal.jpg", "image", &IMAGE_JPEG.to_string()).await;
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

    #[sqlx::test]
    async fn can_reject_a_non_image_file(pool: PgPool) -> sqlx::Result<()> {
        let (client, generate_url) = init_web_server_for_test(pool).await;
        let part = get_image_part("sample.txt", "invalid.jpg", &IMAGE_JPEG.to_string()).await;
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
        let (client, generate_url) = init_web_server_for_test(pool).await;
        let part = get_image_part("large_size.png", "image.png", &IMAGE_PNG.to_string()).await;
        let form = Form::new().text("alt", "").part("file", part);

        let res = client
            .post(generate_url("/v1/me/assets"))
            .multipart(form)
            .send()
            .await
            .unwrap();

        assert!(res.status().is_client_error());
        assert_eq!(res.text().await.unwrap(), "Image is too big".to_string());

        Ok(())
    }

    #[sqlx::test]
    async fn can_scale_down_a_large_image(pool: PgPool) -> sqlx::Result<()> {
        let (client, generate_url) = init_web_server_for_test(pool).await;
        let part = get_image_part("large_dims.jpg", "image.jpg", &IMAGE_JPEG.to_string()).await;
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

    #[sqlx::test]
    async fn can_handle_a_png_image(pool: PgPool) -> sqlx::Result<()> {
        let (client, generate_url) = init_web_server_for_test(pool).await;
        let part = get_image_part("image.png", "image.png", &IMAGE_PNG.to_string()).await;
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

    #[sqlx::test]
    async fn can_handle_a_gif_image(pool: PgPool) -> sqlx::Result<()> {
        let (client, generate_url) = init_web_server_for_test(pool).await;
        let part = get_image_part("image.gif", "image.gif", &IMAGE_GIF.to_string()).await;
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

    #[sqlx::test]
    async fn can_handle_a_webp_image(pool: PgPool) -> sqlx::Result<()> {
        let (client, generate_url) = init_web_server_for_test(pool).await;
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

    #[sqlx::test]
    async fn can_handle_an_animated_webp_image(pool: PgPool) -> sqlx::Result<()> {
        let (client, generate_url) = init_web_server_for_test(pool).await;
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

    // TODO: Remove when GIFs can be resized
    #[sqlx::test]
    async fn can_reject_an_oversized_gif(pool: PgPool) -> sqlx::Result<()> {
        let (client, generate_url) = init_web_server_for_test(pool).await;
        let part = get_image_part("large_dims.gif", "image.gif", &IMAGE_GIF.to_string()).await;
        let form = Form::new().text("alt", "").part("file", part);

        let res = client
            .post(generate_url("/v1/me/assets"))
            .multipart(form)
            .send()
            .await
            .unwrap();

        assert!(res.status().is_client_error());
        assert_eq!(res.text().await.unwrap(), "Image is too big".to_string());

        Ok(())
    }

    // See https://www.bamsoftware.com/hacks/deflate.html
    #[sqlx::test]
    async fn can_handle_png_bomb(pool: PgPool) -> sqlx::Result<()> {
        let (client, generate_url) = init_web_server_for_test(pool).await;
        let part = get_image_part("img_bomb.png", "image.png", &IMAGE_PNG.to_string()).await;
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
}
