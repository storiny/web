use crate::{
    error::Error,
    spec::EmbedType,
    utils::{
        decompress_url,
        fetch_embed,
        get_metadata,
        parse_html,
        resolve_provider,
        ConsumerRequest,
        ParseResult,
    },
    IframeTemplate,
    PhotoTemplate,
};
use actix_web::{
    get,
    http::header::ContentType,
    web,
    HttpResponse,
    Responder,
};
use sailfish::TemplateOnce;
use serde::{
    Deserialize,
    Serialize,
};

/// Embed endpoint query params
#[derive(Deserialize)]
struct EmbedQueryParams {
    theme: Option<String>,
}

/// Rich embed data
#[derive(Serialize)]
struct RichEmbedData {
    /// Script sources
    sources: Vec<String>,
    /// Embed provider
    provider: String,
    /// Embed styles
    styles: String,
    /// Type of the embed
    embed_type: String,
    /// Boolean flag indicating whether the provider supports both `light` and `dark` themes.
    supports_binary_theme: bool,
}

/// Photo embed data
#[derive(Serialize)]
struct PhotoEmbedData {
    /// Embed height (in px)
    height: Option<u16>,
    /// Embed width (in px)
    width: Option<u16>,
    /// Type of the embed
    embed_type: String,
    /// Embed provider
    provider: String,
}

#[get("/embed/{compressed_url}")]
async fn get(
    compressed_url: web::Path<String>,
    query: web::Query<EmbedQueryParams>,
) -> impl Responder {
    // Decompress the URL
    let decompressed_url = decompress_url(compressed_url.as_str());

    if let Some(decompressed_url) = decompressed_url {
        match decompressed_url {
            Ok(url) => {
                if let Some(provider) = resolve_provider(&url) {
                    let response = if let Some(origin_params) = &provider.origin_params {
                        let theme = query.theme.clone().unwrap_or("light".to_string());
                        let mut origin_params_cloned = origin_params.clone(); // Extra params for the provider

                        // Replace theme placeholders
                        origin_params_cloned.iter_mut().for_each(|(_, value)| {
                            if *value == "{theme}" {
                                *value = &theme;
                            }
                        });

                        fetch_embed(
                            &provider.endpoint,
                            ConsumerRequest {
                                url: &url,
                                params: Some(origin_params_cloned),
                            },
                        )
                        .await
                    } else {
                        fetch_embed(
                            &provider.endpoint,
                            ConsumerRequest {
                                url: &url,
                                ..ConsumerRequest::default()
                            },
                        )
                        .await
                    };

                    match response {
                        Ok(json) => {
                            match json.oembed_type {
                                EmbedType::Photo(photo_json) => {
                                    // Handle photo response
                                    let photo_html = format!(
                                    r#"<img src="{}" alt="{}" width="{}" height="{}" loading="lazy">"#,
                                    photo_json.url,
                                    json.title.clone().unwrap_or("".to_string()),
                                    photo_json.width.unwrap_or(0),
                                    photo_json.height.unwrap_or(0)
                                )
                                    .to_string();

                                    let title = json.title.unwrap_or("".to_string());
                                    let embed_data = serde_json::to_string(&PhotoEmbedData {
                                        embed_type: "photo".to_string(),
                                        provider: provider.name.to_string(),
                                        width: photo_json.width,
                                        height: photo_json.height,
                                    })
                                    .unwrap_or("{}".to_string());

                                    HttpResponse::Ok().content_type(ContentType::html()).body(
                                        PhotoTemplate {
                                            photo_html,
                                            title,
                                            embed_data,
                                        }
                                        .render_once()
                                        .unwrap(),
                                    )
                                }
                                EmbedType::Link => {
                                    // Handle link response
                                    let metadata = get_metadata(&url).await;

                                    if let Ok(metadata) = metadata {
                                        HttpResponse::Ok()
                                            .content_type(ContentType::json())
                                            .json(metadata)
                                    } else {
                                        HttpResponse::UnprocessableEntity()
                                            .content_type(ContentType::plaintext())
                                            .body("Invalid response from the provider")
                                    }
                                }
                                EmbedType::Video(_) | EmbedType::Rich(_) => {
                                    match parse_html(&json, &provider.iframe_params) {
                                        None => HttpResponse::Ok()
                                            .content_type(ContentType::json())
                                            .json(&json),
                                        Some(parsed) => {
                                            match parsed {
                                                ParseResult::IframeResult(result) => {
                                                    // Handle responses with iframes
                                                    HttpResponse::Ok()
                                            .content_type(ContentType::html())
                                            .body(IframeTemplate {
                                                iframe_html: result.iframe_html,
                                                title: result.title,
                                                wrapper_styles: result.wrapper_styles.to_string(),
                                                embed_data: serde_json::to_string(&RichEmbedData {
                                                    embed_type: "rich".to_string(),
                                                    sources: vec![],
                                                    styles: if let Some(padding) = provider.padding {
                                                        format!("padding-bottom:{}%", padding)
                                                    } else {
                                                        result.wrapper_styles.to_string()
                                                    },
                                                    provider: provider.name.to_string(),
                                                    supports_binary_theme: provider.supports_binary_theme,
                                                })
                                                    .unwrap_or("{}".to_string()),
                                            }
                                                .render_once()
                                                .unwrap())
                                                }
                                                ParseResult::ScriptResult(result) => {
                                                    // Handle responses without iframes
                                                    HttpResponse::Ok()
                                                        .content_type(ContentType::json())
                                                        .json(&result)
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        Err(Error::Reqwest(_)) => HttpResponse::UnprocessableEntity()
                            .content_type(ContentType::plaintext())
                            .body("Invalid response from the provider"),
                        Err(_) => HttpResponse::InternalServerError()
                            .content_type(ContentType::plaintext())
                            .body("Cannot retrieve the embed"),
                    }
                } else {
                    // Handle embeds
                    let metadata = get_metadata(&url).await;

                    if let Ok(metadata) = metadata {
                        HttpResponse::Ok()
                            .content_type(ContentType::json())
                            .json(metadata)
                    } else {
                        HttpResponse::UnprocessableEntity()
                            .content_type(ContentType::plaintext())
                            .body("Invalid response from the provider")
                    }
                }
            }
            Err(_) => HttpResponse::InternalServerError()
                .content_type(ContentType::plaintext())
                .body("Could not resolve the provider"),
        }
    } else {
        HttpResponse::UnprocessableEntity()
            .content_type(ContentType::plaintext())
            .body("Provider not supported yet")
    }
}

/// Registers embed routes
///
/// * `cfg` - Web service config
pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}
