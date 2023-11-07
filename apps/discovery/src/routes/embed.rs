use crate::{
    error::Error,
    spec::EmbedType,
    utils::{
        decompress_url::decompress_url,
        fetch_embed::{fetch_embed, ConsumerRequest},
        get_metadata::get_metadata,
        parse_html::{parse_html, ParseResult},
        resolve_provider::resolve_provider,
    },
    IframeTemplate, PhotoTemplate,
};
use actix_web::{get, http::header::ContentType, web, HttpResponse, Responder};
use sailfish::TemplateOnce;
use serde::{Deserialize, Serialize};
use url::Url;

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

/// Sends a webpage metadata object for the provided URL.
///
/// * `url` - URL to fetch the metadata for
async fn respond_with_metadata(url: &str) -> HttpResponse {
    let metadata = get_metadata(url, false).await;

    if let Ok(metadata) = metadata {
        HttpResponse::Ok().json(metadata)
    } else {
        HttpResponse::UnprocessableEntity()
            .content_type(ContentType::plaintext())
            .body("Invalid response from the provider")
    }
}

#[get("/embed/{compressed_url}")]
async fn get(
    compressed_url: web::Path<String>,
    query: web::Query<EmbedQueryParams>,
) -> impl Responder {
    // Decompress and parse the URL
    let mut decompressed_url = Url::parse(
        &decompress_url(compressed_url.as_str())
            .unwrap_or(Ok("".to_string()))
            .ok()
            .unwrap_or_default(),
    );

    if let Ok(url) = &mut decompressed_url {
        if let Some(provider) = resolve_provider(&url.to_string()) {
            let theme = query.theme.clone().unwrap_or("light".to_string());
            let padding_styles = format!(
                "{}{}",
                if provider.desktop_padding.is_some() {
                    format!("--padding-desktop:{}%;", provider.desktop_padding.unwrap())
                } else {
                    "".to_string()
                },
                if provider.mobile_padding.is_some() {
                    format!("--padding-mobile:{}%;", provider.mobile_padding.unwrap())
                } else {
                    "".to_string()
                }
            );

            if provider.supports_oembed {
                let response = if let Some(origin_params) = &provider.origin_params {
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
                            url: &url.to_string(),
                            params: Some(origin_params_cloned),
                        },
                    )
                    .await
                } else {
                    fetch_embed(
                        &provider.endpoint,
                        ConsumerRequest {
                            url: &url.to_string(),
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
                                    r#"<img src="{}" alt="{}" loading="lazy">"#,
                                    photo_json.url,
                                    json.title.clone().unwrap_or("".to_string()),
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
                                        theme,
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
                                respond_with_metadata(&url.to_string()).await
                            }
                            EmbedType::Video(_) | EmbedType::Rich(_) => {
                                let theme_str = theme.clone().to_string();
                                let iframe_params = {
                                    if let Some(iframe_params) = &provider.iframe_params {
                                        let mut iframe_params_cloned = iframe_params.clone(); // Extra params for the iframe

                                        if provider.supports_binary_theme {
                                            iframe_params_cloned.iter_mut().for_each(
                                                |(_, value)| {
                                                    // Replace theme placeholders
                                                    if *value == "{theme}" {
                                                        *value = &theme_str;
                                                    }
                                                },
                                            );
                                        }

                                        Some(iframe_params_cloned)
                                    } else {
                                        None
                                    }
                                };

                                match parse_html(
                                    &json,
                                    &iframe_params,
                                    &provider.iframe_attrs,
                                    &provider.supports_binary_theme,
                                ) {
                                    None => HttpResponse::Ok().json(&json),
                                    Some(parsed) => {
                                        match parsed {
                                            ParseResult::IframeResult(result) => {
                                                // Handle responses with iframes
                                                HttpResponse::Ok()
                                                    .content_type(ContentType::html())
                                                    .body(
                                                        IframeTemplate {
                                                            theme,
                                                            iframe_html: result.iframe_html,
                                                            title: result.title,
                                                            wrapper_styles: result
                                                                .wrapper_styles
                                                                .to_string(),
                                                            embed_data: serde_json::to_string(
                                                                &RichEmbedData {
                                                                    embed_type: "rich".to_string(),
                                                                    sources: vec![],
                                                                    styles: if !padding_styles
                                                                        .is_empty()
                                                                    {
                                                                        padding_styles
                                                                    } else {
                                                                        result
                                                                            .wrapper_styles
                                                                            .to_string()
                                                                    },
                                                                    provider: provider
                                                                        .name
                                                                        .to_string(),
                                                                    supports_binary_theme: provider
                                                                        .supports_binary_theme,
                                                                },
                                                            )
                                                            .unwrap_or("{}".to_string()),
                                                        }
                                                        .render_once()
                                                        .unwrap(),
                                                    )
                                            }
                                            ParseResult::ScriptResult(result) => {
                                                // Handle responses without iframes
                                                HttpResponse::Ok().json(&result)
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
                // Handle providers that do not support the oembed spec
                let iframe_src = &mut url.clone();

                // Resolve custom embed endpoint if available
                if let Some(embed_endpoint) = &provider.embed_endpoint {
                    if let Ok(embed_endpoint) = Url::parse(embed_endpoint) {
                        *iframe_src = embed_endpoint;
                    }
                }

                // Append params
                if let Some(iframe_params) = &provider.iframe_params {
                    let url_cloned = url.clone();
                    let mut iframe_params_cloned = iframe_params.clone(); // Extra params for the iframe

                    iframe_params_cloned.iter_mut().for_each(|(_, value)| {
                        // Replace theme placeholders
                        if provider.supports_binary_theme {
                            if *value == "{theme}" {
                                *value = &theme;
                            }
                        }

                        // Replace URL placeholders
                        if *value == "{url}" {
                            *value = url_cloned.as_str();
                        }
                    });

                    // Append iframe params to its source
                    {
                        // Filter iframe params
                        let pairs_not_in_params = iframe_src
                            .query_pairs()
                            .into_iter()
                            .filter(|(key, _)| {
                                !iframe_params_cloned.contains_key(key.clone().as_ref())
                            })
                            .map(|(key, value)| (key.to_string(), value.to_string()))
                            .collect::<Vec<_>>();

                        iframe_src
                            .query_pairs_mut()
                            .clear()
                            .extend_pairs(pairs_not_in_params)
                            .extend_pairs(iframe_params_cloned)
                            .finish();
                    }
                }

                HttpResponse::Ok().content_type(ContentType::html()).body(
                    IframeTemplate {
                        theme,
                        iframe_html: format!(
                            r#"
                                <iframe
                                  src="{}"
                                  loading="lazy"
                                  referrerpolicy="strict-origin"
                                  {}
                                ></iframe>
                            "#,
                            iframe_src.to_string(),
                            {
                                // Append iframe attributes
                                let mut attrs = String::from(" ");

                                for (key, value) in
                                    provider.iframe_attrs.clone().unwrap_or_default()
                                {
                                    attrs.push_str(&format!(r#"{key}="{value}""#));
                                    attrs.push_str(" ");
                                }

                                attrs
                            }
                        ),
                        title: provider.name.to_string(),
                        wrapper_styles: padding_styles.clone(),
                        embed_data: serde_json::to_string(&RichEmbedData {
                            embed_type: "rich".to_string(),
                            sources: vec![],
                            styles: padding_styles,
                            provider: provider.name.to_string(),
                            supports_binary_theme: provider.supports_binary_theme,
                        })
                        .unwrap_or("{}".to_string()),
                    }
                    .render_once()
                    .unwrap(),
                )
            }
        } else {
            // Handle web embeds
            respond_with_metadata(&url.to_string()).await
        }
    } else {
        HttpResponse::BadRequest()
            .content_type(ContentType::plaintext())
            .body("Malformed URL")
    }
}

/// Registers embed routes
///
/// * `cfg` - Web service config
pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}
