#![forbid(unsafe_code)]
#![allow(clippy::module_inception)]
#![deny(clippy::expect_used, clippy::unwrap_used)]
//
#[cfg(target_has_atomic = "ptr")]
//
use sailfish::{
    runtime::{
        Buffer,
        Render,
    },
    RenderError,
    TemplateOnce,
};
use serde::Serialize;

pub mod config;
pub mod constants;
pub mod error;
pub mod providers;
pub mod request;
pub mod routes;
pub mod spec;
pub mod telemetry;
pub mod utils;

/// The iframe embed template.
#[derive(TemplateOnce)]
#[template(path = "iframe.stpl")]
pub struct IframeTemplate {
    /// The HTML string for the template.
    iframe_html: String,
    /// The CSS styles that are applied to the iframe wrapper.
    wrapper_styles: String,
    /// The title for the embed.
    title: String,
    /// The [IframeEmbedData] for the embed.
    embed_data: IframeEmbedData,
    /// The theme of the embed.
    theme: String,
}

/// The photo embed template.
#[derive(TemplateOnce)]
#[template(path = "photo.stpl")]
pub struct PhotoTemplate {
    /// The HTML string for the template.
    photo_html: String,
    /// The title for the embed.
    title: String,
    /// The [PhotoEmbedData] for the embed.
    embed_data: PhotoEmbedData,
    /// The theme of the embed.
    theme: String,
}

/// The iframe embed data.
#[derive(Serialize)]
pub struct IframeEmbedData {
    /// The script sources.
    sources: Vec<String>,
    /// The embed provider.
    provider: String,
    /// The embed CSS styles.
    styles: String,
    /// The type of the embed.
    embed_type: String,
    /// The boolean flag indicating whether the provider supports both `light` and `dark` themes.
    supports_binary_theme: bool,
}

impl Render for IframeEmbedData {
    #[inline]
    fn render(&self, buffer: &mut Buffer) -> Result<(), RenderError> {
        serde_json::to_string(self)
            .map_err(|error| RenderError::Msg(format!("{error:?}")))?
            .render(buffer)
    }
}

/// The photo embed data.
#[derive(Serialize)]
pub struct PhotoEmbedData {
    /// The embed height (in px).
    height: Option<u16>,
    /// The embed width (in px).
    width: Option<u16>,
    /// The type of the embed.
    embed_type: String,
    /// The embed provider.
    provider: String,
}

impl Render for PhotoEmbedData {
    #[inline]
    fn render(&self, buffer: &mut Buffer) -> Result<(), RenderError> {
        serde_json::to_string(self)
            .map_err(|error| RenderError::Msg(format!("{error:?}")))?
            .render(buffer)
    }
}
