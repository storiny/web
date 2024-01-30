use crate::{
    config::Config,
    error::AppError,
    spec::EmbedType,
    utils::{
        decompress_url::decompress_url,
        fetch_embed::{
            fetch_embed,
            ConsumerRequest,
        },
        get_metadata::get_metadata,
        parse_html::{
            parse_html,
            ParseResult,
        },
        resolve_provider::resolve_provider,
    },
    IframeEmbedData,
    IframeTemplate,
    PhotoEmbedData,
    PhotoTemplate,
};
use actix_web::{
    get,
    http::header::ContentType,
    web,
    HttpResponse,
};
use sailfish::TemplateOnce;
use serde::Deserialize;
use tracing::{
    debug,
    trace,
};
use url::Url;

// TODO: Write tests

/// The embed endpoint query parameters.
#[derive(Debug, Deserialize)]
struct EmbedQueryParams {
    theme: Option<String>,
}

/// Sends a webpage metadata object for the provided URL.
///
/// * `config` - The environment configuration.
/// * `url` - The URL to fetch the metadata for.
async fn respond_with_metadata(config: &Config, url: &str) -> HttpResponse {
    let metadata = get_metadata(config, url, false).await;

    if let Ok(metadata) = metadata {
        HttpResponse::Ok().json(metadata)
    } else {
        HttpResponse::UnprocessableEntity().body("Invalid response from the provider")
    }
}

#[get("/embed/{compressed_url}")]
#[tracing::instrument(
    name = "GET /embed/{compressed_url}",
    skip_all,
    fields(
        compressed_url,
        decompressed_url = tracing::field::Empty,
        resolved_provider = tracing::field::Empty,
        theme = query.theme
    ),
    err
)]
async fn get(
    compressed_url: web::Path<String>,
    query: web::Query<EmbedQueryParams>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let decompressed_url = decompress_url(compressed_url.as_str()).unwrap_or_default();

    tracing::Span::current().record("decompressed_url", &decompressed_url);

    // Always validate the URL.
    let url = Url::parse(&decompressed_url)?;
    let provider = resolve_provider(url.as_ref());

    let provider = match provider {
        Some(value) => value,
        None => {
            debug!("provider not found, responding with metadata instead");

            return Ok(respond_with_metadata(&config, url.as_ref()).await);
        }
    };

    tracing::Span::current().record("resolved_provider", provider.name);

    let theme = query.theme.clone().unwrap_or("light".to_string());

    let padding_styles = format!(
        "{}{}",
        provider
            .desktop_padding
            .map(|padding| format!("--padding-desktop:{padding}%;"))
            .unwrap_or_default(),
        provider
            .mobile_padding
            .map(|padding| format!("--padding-mobile:{padding}%;"))
            .unwrap_or_default(),
    );

    debug!("padding styles for the embed: {padding_styles}");

    if provider.supports_oembed {
        trace!("provider supports the oembed spec");

        let response = if let Some(origin_params) = &provider.origin_params {
            let mut origin_params_cloned = origin_params.clone(); // Extra params for the provider.

            // Replace theme placeholders.
            origin_params_cloned.iter_mut().for_each(|(_, value)| {
                if *value == "{theme}" {
                    *value = &theme;
                }
            });

            debug!("origin parameters: {origin_params_cloned:?}");

            fetch_embed(
                provider.endpoint,
                ConsumerRequest {
                    url: url.as_ref(),
                    params: Some(origin_params_cloned),
                },
            )
            .await
        } else {
            fetch_embed(
                provider.endpoint,
                ConsumerRequest {
                    url: url.as_ref(),
                    ..Default::default()
                },
            )
            .await
        }?;

        match response.oembed_type {
            // Handle photo embed response.
            EmbedType::Photo(photo_res) => {
                let embed_title = response.title.unwrap_or_default();
                let photo_embed_html = format!(
                    r#"<img src="{}" alt="{embed_title}" loading="lazy">"#,
                    photo_res.url,
                );

                PhotoTemplate {
                    theme,
                    photo_html: photo_embed_html,
                    title: embed_title,
                    embed_data: PhotoEmbedData {
                        embed_type: "photo".to_string(),
                        provider: provider.name.to_string(),
                        width: photo_res.width,
                        height: photo_res.height,
                    },
                }
                .render_once()
                .map(|body| {
                    HttpResponse::Ok()
                        .content_type(ContentType::html())
                        .body(body)
                })
                .map_err(|error| AppError::InternalError(error.to_string()))
            }

            // Handle photo embed response.
            EmbedType::Link => Ok(respond_with_metadata(&config, url.as_ref()).await),

            // Handle video and rich embed response.
            EmbedType::Video(_) | EmbedType::Rich(_) => {
                let iframe_params = provider.iframe_params.as_ref().map(|iframe_params| {
                    let mut iframe_params_cloned = iframe_params.clone(); // Extra params for the iframe.

                    if provider.supports_binary_theme {
                        iframe_params_cloned.iter_mut().for_each(|(_, value)| {
                            // Replace theme placeholders.
                            if *value == "{theme}" {
                                *value = &theme;
                            }
                        });
                    }

                    debug!("iframe parameters: {iframe_params_cloned:?}");

                    iframe_params_cloned
                });

                let parse_result = parse_html(
                    &response,
                    &iframe_params,
                    &provider.iframe_attrs,
                    &provider.supports_binary_theme,
                );

                let parse_result = match parse_result {
                    Some(value) => value,
                    None => {
                        // We simply return the provider response data if the HTML can not be
                        // parsed.
                        return Ok(HttpResponse::Ok().json(response));
                    }
                };

                match parse_result {
                    // Handle iframe embed response.
                    ParseResult::IframeResult(result) => IframeTemplate {
                        theme: theme.clone(),
                        iframe_html: result.iframe_html,
                        title: result.title,
                        wrapper_styles: result.wrapper_styles.to_string(),
                        embed_data: IframeEmbedData {
                            embed_type: "rich".to_string(),
                            sources: vec![],
                            styles: if !padding_styles.is_empty() {
                                padding_styles
                            } else {
                                result.wrapper_styles.to_string()
                            },
                            provider: provider.name.to_string(),
                            supports_binary_theme: provider.supports_binary_theme,
                        },
                    }
                    .render_once()
                    .map(|body| {
                        HttpResponse::Ok()
                            .content_type(ContentType::html())
                            .body(body)
                    })
                    .map_err(|error| AppError::InternalError(error.to_string())),

                    // Handle scripted embed response. The response contains scripts that are
                    // executed on the client side to embed the content.
                    ParseResult::ScriptResult(result) => Ok(HttpResponse::Ok().json(&result)),
                }
            }
        }
    } else {
        trace!("provider does not support the oembed spec");

        // Handle providers that do not support the oembed spec.
        let iframe_src = &mut url.clone();

        // Resolve custom embed endpoint if available.
        if let Some(embed_endpoint) = &provider.embed_endpoint {
            if let Ok(embed_endpoint) = Url::parse(embed_endpoint) {
                *iframe_src = embed_endpoint;
            }
        }

        let url_str = url.to_string();

        // Append parameters.
        if let Some(iframe_params) = &provider.iframe_params {
            let mut iframe_params_cloned = iframe_params.clone(); // Extra params for the iframe.

            iframe_params_cloned.iter_mut().for_each(|(_, value)| {
                // Replace theme placeholders.
                if provider.supports_binary_theme && *value == "{theme}" {
                    *value = &theme;
                }

                // Replace URL placeholders.
                if *value == "{url}" {
                    *value = &url_str;
                }
            });

            debug!("iframe parameters: {iframe_params_cloned:?}");

            {
                // Filter iframe parameters.
                let pairs_not_in_params = iframe_src
                    .query_pairs()
                    .into_iter()
                    .filter_map(|(key, value)| {
                        let binding = key.to_string();
                        let key = binding.as_str();

                        if iframe_params_cloned.contains_key(key) {
                            None
                        } else {
                            Some((key.to_string(), value.to_string()))
                        }
                    })
                    .collect::<Vec<_>>();

                iframe_src
                    .query_pairs_mut()
                    .clear()
                    .extend_pairs(pairs_not_in_params)
                    .extend_pairs(iframe_params_cloned)
                    .finish();
            }
        }

        IframeTemplate {
            theme,
            iframe_html: format!(
                r#"<iframe src="{}" loading="lazy" referrerpolicy="strict-origin" {}></iframe>"#,
                iframe_src,
                {
                    // Append iframe attributes.
                    let mut attrs = " ".to_string();

                    for (key, value) in provider.iframe_attrs.clone().unwrap_or_default() {
                        attrs.push_str(&format!(r#"{key}="{value}""#));
                        attrs.push(' ');
                    }

                    attrs
                }
            ),
            title: provider.name.to_string(),
            wrapper_styles: padding_styles.clone(),
            embed_data: IframeEmbedData {
                embed_type: "rich".to_string(),
                sources: vec![],
                styles: padding_styles,
                provider: provider.name.to_string(),
                supports_binary_theme: provider.supports_binary_theme,
            },
        }
        .render_once()
        .map(|body| {
            HttpResponse::Ok()
                .content_type(ContentType::html())
                .body(body)
        })
        .map_err(|error| AppError::InternalError(error.to_string()))
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}
