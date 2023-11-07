use sailfish::TemplateOnce;

pub mod providers;
pub mod routes;

pub mod error;

pub mod utils;

pub mod request;
pub mod spec;

/// Iframe embed template
#[derive(TemplateOnce)]
#[template(path = "iframe.stpl")]
pub struct IframeTemplate {
    iframe_html: String,
    wrapper_styles: String,
    title: String,
    embed_data: String,
    theme: String,
}

/// Photo embed template
#[derive(TemplateOnce)]
#[template(path = "photo.stpl")]
pub struct PhotoTemplate {
    photo_html: String,
    title: String,
    embed_data: String,
    theme: String,
}
