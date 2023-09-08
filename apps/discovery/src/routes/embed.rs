use crate::{
    error::Error,
    utils::{
        decompress_url,
        fetch_embed,
        parse_html,
        resolve_provider,
        ConsumerRequest,
        ParseResult,
    },
};
use actix_web::{
    get,
    http::header::ContentType,
    web,
    HttpResponse,
    Responder,
};
use serde::Deserialize;

#[derive(Deserialize)]
struct EmbedQueryParams {
    theme: Option<String>,
}

#[get("/embed/{compressed_url}")]
async fn get(
    compressed_url: web::Path<String>,
    query: web::Query<EmbedQueryParams>,
) -> impl Responder {
    let decompressed_url = decompress_url(&compressed_url.to_string());

    match decompressed_url {
        Some(result) => match result {
            Ok(url) => match resolve_provider(&url) {
                None => HttpResponse::UnprocessableEntity()
                    .content_type(ContentType::plaintext())
                    .body("Provider not supported yet"),
                Some(provider) => {
                    let response;

                    // Extend params
                    if let Some(origin_params) = &provider.origin_params {
                        let theme = query.theme.clone().unwrap_or("light".to_string());
                        let mut origin_params_cloned = origin_params.clone();

                        // Replace theme placeholders
                        origin_params_cloned.iter_mut().for_each(|(_, value)| {
                            if *value == "{theme}" {
                                *value = &theme;
                            }
                        });

                        response = fetch_embed(
                            &provider.endpoint,
                            ConsumerRequest {
                                url: &url,
                                params: Some(origin_params_cloned),
                            },
                        )
                        .await;
                    } else {
                        response = fetch_embed(
                            &provider.endpoint,
                            ConsumerRequest {
                                url: &url,
                                ..ConsumerRequest::default()
                            },
                        )
                        .await;
                    }

                    match response {
                        Ok(json) => match parse_html(&json, &provider.iframe_params) {
                            None => HttpResponse::Ok()
                                .content_type(ContentType::json())
                                .json(&json),
                            Some(parsed) => HttpResponse::Ok()
                                .content_type(ContentType::json())
                                .json(&parsed),
                        },
                        Err(Error::Reqwest(err)) => {
                            println!("{}", err);
                            HttpResponse::UnprocessableEntity()
                                .content_type(ContentType::plaintext())
                                .body("Invalid response from the provider")
                        }
                        Err(_) => HttpResponse::InternalServerError()
                            .content_type(ContentType::plaintext())
                            .body("Cannot retrieve the embed"),
                    }
                }
            },
            Err(_) => HttpResponse::InternalServerError()
                .content_type(ContentType::plaintext())
                .body("Could not resolve the provider"),
        },
        None => HttpResponse::UnprocessableEntity()
            .content_type(ContentType::plaintext())
            .body("Provider not supported yet"),
    }
}

/// Registers embed routes
///
/// * `cfg` - Web service config
pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get);
}
