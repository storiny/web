use crate::{
    config::Config,
    error::AppError,
    request::{
        REQUEST_CLIENT,
        USER_AGENT,
    },
    utils::encode_cdn_url::encode_cdn_url,
};
use html5ever::{
    driver::ParseOpts,
    parse_document,
    tendril::{
        fmt::UTF8,
        Tendril,
        TendrilSink,
    },
    Attribute,
};
use markup5ever_rcdom::{
    Handle,
    NodeData,
    RcDom,
};
use reqwest::header;
use serde::Serialize;
use std::{
    default::Default,
    io,
};
use url::{
    ParseError,
    Url,
};

/// The minimum width for an image to be classified as a large image.
const LARGE_IMAGE_WIDTH_LOWER_BOUND: u16 = 600;

/// The minimum height for an image to be classified as a large image.
const LARGE_IMAGE_HEIGHT_LOWER_BOUND: u16 = 300;

/// The metadata client.
#[derive(Debug, Clone)]
pub struct Client(reqwest::Client);

/// The metadata image object.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct MetadataImage {
    /// The image source URL.
    src: String,
    /// The width of the image (in px).
    width: Option<u16>,
    /// The Height of the image (in px).
    height: Option<u16>,
    /// The alt text for the image.
    alt: Option<String>,
    /// The boolean flag indicating whether the image is large enough to be displayed as the main
    /// entity of the web embed.
    is_large: bool,
}

/// The metadata result object.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct MetadataResult {
    /// The title of the object.
    title: String,
    /// The host URL of the object.
    host: String,
    /// The request URL.
    url: String,
    /// The description of the object.
    description: String,
    /// The image object relevant to this object.
    image: Option<MetadataImage>,
    /// The favicon object relevant to this object.
    favicon: Option<String>,
    /// The type of the embed result.
    embed_type: String,
}

/// The Opengraph image object.
#[derive(Debug, Clone, PartialEq)]
pub struct OpengraphImage {
    /// The source of the image.
    pub url: String,
    /// The height of the image object (in px).
    pub height: Option<u16>,
    /// The width of the image object (in px).
    pub width: Option<u16>,
    /// The description of the image object.
    pub alt: Option<String>,
}

/// The twitter card image object.
#[derive(Debug, Clone, PartialEq)]
pub struct TwitterImage {
    /// The source of the image.
    pub url: String,
    /// The boolean flag indicating whether the image is a large image (inferred from
    /// `summary_large_card` type).
    pub is_large: bool,
    /// The description of the image object.
    pub alt: Option<String>,
}

/// The Opengraph metadata.
///
/// See [opengraph specs](http://ogp.me/)
#[derive(Debug, Clone, PartialEq)]
pub struct Opengraph {
    /// The bame of the site.
    pub site_name: Option<String>,
    /// The title of the object.
    pub title: Option<String>,
    /// The description of the object.
    pub description: Option<String>,
    /// The image relevant to this object.
    pub image: Option<OpengraphImage>,
}

/// The twitter card metadata.
///
/// See [Twitter card docs](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
#[derive(Debug, Clone, PartialEq)]
pub struct TwitterCard {
    /// The title of the object.
    pub title: Option<String>,
    /// The description of the object.
    pub description: Option<String>,
    /// The image relevant to this object.
    pub image: Option<TwitterImage>,
}

/// The struct for parsing the DOM tree.
pub struct DomParser {
    /// The node handle.
    handle: Handle,
    /// The boolean flag indicating whether the traversal is happening inside the head element.
    inside_head: bool,
}

/// The document metadata.
#[derive(Debug, Clone)]
pub struct DocMetadata {
    /// The title of the document (from <title>).
    pub title: Option<String>,
    /// The meta description of the document (from <head>).
    pub description: Option<String>,
    /// The canonical URL of the resource.
    pub canonical_url: Option<String>,
    /// The favicon image URL of the site.
    pub favicon: Option<String>,
    /// The Opengraph tags.
    pub opengraph: Opengraph,
    /// The Twitter card tags.
    pub twitter_card: TwitterCard,
}

impl Client {
    /// Creates a new request client,
    ///
    /// * `client` - The [reqwest::Client] instance.
    pub fn new(client: reqwest::Client) -> Self {
        Self(client)
    }

    /// Fetches metadata from the provided URL.
    ///
    /// * `url` - The target URL.
    pub async fn fetch(&self, url: Url) -> Result<String, AppError> {
        Ok(self
            .0
            .get(url)
            .header(header::USER_AGENT, USER_AGENT)
            .send()
            .await?
            .error_for_status()?
            .text()
            .await?)
    }
}

impl OpengraphImage {
    /// Creates a new [OpengraphImage] with the given URL.
    ///
    /// * `url` - The target URL.
    pub fn new(url: String) -> Self {
        Self {
            url,
            alt: None,
            height: None,
            width: None,
        }
    }
}

impl TwitterImage {
    /// Creates a new [TwitterImage] with the given URL.
    ///
    /// * `url` - The target URL.
    pub fn new(url: String) -> Self {
        Self {
            url,
            is_large: false,
            alt: None,
        }
    }
}

impl Opengraph {
    /// Creates an empty [Opengraph] instance with default values.
    pub fn empty() -> Self {
        Self {
            site_name: None,
            title: None,
            description: None,
            image: None,
        }
    }

    /// Gets a mutable reference to the [OpengraphImage] associated with the current instance. If
    /// the [OpengraphImage] is not already set, it gets initialized with the default value and a
    /// mutable reference to the newly created image is returned.
    fn get_or_set_image(&mut self) -> &mut OpengraphImage {
        if self.image.is_none() {
            self.image = Some(OpengraphImage::new("".to_string()));
        }

        #[allow(clippy::unwrap_used)]
        self.image.as_mut().unwrap()
    }

    /// Extends the instance with the provided properties.
    ///
    /// * `property` - The property to extend.
    /// * `content` - The content for the property.
    pub fn extend(&mut self, property: &str, content: String) {
        match property {
            "site_name" => self.site_name = Some(content),
            "title" => self.title = Some(content),
            "description" => self.description = Some(content),
            "image" | "image:secure_url" => self.get_or_set_image().url = content,
            "image:width" => {
                self.get_or_set_image().width = Some(content.parse::<u16>().unwrap_or_default())
            }
            "image:height" => {
                self.get_or_set_image().height = Some(content.parse::<u16>().unwrap_or_default())
            }
            "image:alt" => self.get_or_set_image().alt = Some(content),
            _ => {}
        }
    }
}

impl TwitterCard {
    /// Creates an empty [TwitterCard] instance with default values.
    pub fn empty() -> Self {
        Self {
            title: None,
            description: None,
            image: None,
        }
    }

    /// Gets a mutable reference to the [TwitterImage] associated with the current instance. If the
    /// [TwitterImage] is not already set, it gets initialized with the default value and a mutable
    /// reference to the newly created image is returned.
    fn get_or_set_image(&mut self) -> &mut TwitterImage {
        if self.image.is_none() {
            self.image = Some(TwitterImage::new("".to_string()));
        }

        #[allow(clippy::unwrap_used)]
        self.image.as_mut().unwrap()
    }

    /// Extends the instance with the provided properties.
    ///
    /// * `property` - The property to extend.
    /// * `content` - The content for the property.
    pub fn extend(&mut self, property: &str, content: String) {
        match property {
            "title" => self.title = Some(content),
            "description" => self.description = Some(content),
            "card" => self.get_or_set_image().is_large = content == "summary_large_image",
            "image" => self.get_or_set_image().url = content,
            "image:alt" => self.get_or_set_image().alt = Some(content),
            _ => {}
        }
    }
}

impl DomParser {
    /// Creates a new [DomParser] with the provided handle.
    ///
    /// * `handle` - The handle to the root node of the DOM tree.
    pub fn start(handle: Handle) -> Self {
        DomParser {
            handle,
            inside_head: false,
        }
    }

    /// Traverses the DOM tree and populates the provided metadata object.
    ///
    /// * `metadata` - The metadata object to populate with extracted data.
    pub fn traverse(mut self, metadata: &mut DocMetadata) {
        let handle_ref = &self.handle;

        match self.handle.data {
            NodeData::Document => (),
            NodeData::Doctype { .. } => (),
            NodeData::Comment { .. } => (),
            NodeData::Text { .. } => (),
            NodeData::ProcessingInstruction { .. } => unreachable!(),
            NodeData::Element {
                ref name,
                ref attrs,
                ..
            } => {
                let tag_name = name.local.as_ref();

                if tag_name == "head" {
                    self.inside_head = true;
                } else if tag_name == "body" {
                    self.inside_head = false; // Exit when entering the body.
                }

                if self.inside_head {
                    process_head(tag_name, handle_ref, &attrs.borrow(), metadata)
                }
            }
        }

        for child in self.handle.children.borrow().iter() {
            DomParser {
                handle: child.clone(),
                inside_head: self.inside_head,
            }
            .traverse(metadata);
        }
    }
}

impl DocMetadata {
    /// Creates an empty [DocMetadata] instance with default values.
    fn empty() -> Self {
        Self {
            title: None,
            description: None,
            canonical_url: None,
            favicon: None,
            opengraph: Opengraph::empty(),
            twitter_card: TwitterCard::empty(),
        }
    }

    /// Constructs [DocMetadata] from a DOM tree.
    ///
    /// * `dom` - The DOM tree.
    pub fn from_dom(dom: RcDom) -> Self {
        let mut html = Self::empty();
        let parser = DomParser::start(dom.document);
        parser.traverse(&mut html);

        html
    }

    /// Constructs [DocMetadata] from a HTML string.
    ///
    /// * `html` - The HTML string.
    pub fn from_string(html: &str) -> Result<Self, io::Error> {
        parse_document(RcDom::default(), ParseOpts::default())
            .from_utf8()
            .read_from(&mut html.as_bytes())
            .map(Self::from_dom)
    }
}

/// Processes a node inside the head of the DOM tree by analyzing the node and updating the provided
/// `metadata` accordingly based on the node's properties.
///
/// * `tag_name` - The name of the node's tag.
/// * `handle` - A handle to the node.
/// * `attrs` - The attributes associated with the node.
/// * `metadata` - The metadata object to be updated.
fn process_head(tag_name: &str, handle: &Handle, attrs: &[Attribute], metadata: &mut DocMetadata) {
    // If the node is a <title>, update the metadata title.
    if tag_name == "title" {
        metadata.title = text_content(handle);
    }

    // If the node is a <meta> element, extract content and property.
    if tag_name == "meta" {
        let content = get_attribute(attrs, "content");

        if let Some(content) = content {
            let property_opt = get_attribute(attrs, "property")
                .or_else(|| get_attribute(attrs, "name"))
                .or_else(|| get_attribute(attrs, "http-equiv"));

            if let Some(property) = property_opt {
                if property.starts_with("og:") && property.len() > 3 {
                    // Extend Opengraph tags.
                    metadata.opengraph.extend(&property[3..], content);
                } else if property.starts_with("twitter:") && property.len() > 8 {
                    // Extend Twitter tags.
                    metadata.twitter_card.extend(&property[8..], content);
                } else if property == "description" {
                    metadata.description = Some(content);
                }
            }
        }
    }

    // If the node is a <link>, check for canonical URL.
    if tag_name == "link" {
        let rel = get_attribute(attrs, "rel").unwrap_or_default();
        let href = get_attribute(attrs, "href");

        // Update metadata URL to the canonical URL if present.
        if rel == "canonical" {
            metadata.canonical_url = href.clone();
        } else if rel == "icon" || rel == "shortcut icon" {
            // Handle favicon.
            metadata.favicon = href.clone();
        } else if metadata.favicon.is_none() {
            // Try different alternatives for favicon.
            let tag_type = get_attribute(attrs, "type").unwrap_or_default();

            if tag_type == "image/x-icon" || tag_type == "image/ico" || tag_type == "image/png" {
                metadata.favicon = href.clone();
            }
        }
    }
}

/// Converts a Tendril containing UTF-8 encoded data into a UTF-8 string slice.
///
/// * `t` - Ref to Tendril containing UTF-8 encoded data.
fn tendril_to_utf8(t: &Tendril<UTF8>) -> &str {
    t
}

/// Retrieves and trims the attribute value from the collection of attributes if it exists.
///
/// * `attrs` - A slice containing attributes to search through.
/// * `name` - The name of the attribute to find and retrieve.
fn get_attribute(attrs: &[Attribute], name: &str) -> Option<String> {
    attrs
        .iter()
        .find(|attr| attr.name.local.as_ref() == name)
        .map(|attr| attr.value.trim().to_string())
}

/// Extracts and accumulates the text content from a given HTML element
/// represented by the handle.
///
/// * `handle` - A reference to a node handle.
fn text_content(handle: &Handle) -> Option<String> {
    // Iterate through the children and accumulate text content.
    let mut text_content = String::new();

    for child in handle.children.borrow().iter() {
        if let NodeData::Text { ref contents } = child.data {
            text_content.push_str(tendril_to_utf8(&contents.borrow()));
        }
    }

    // Trim the accumulated text content and return it.
    let trimmed_content = text_content.trim();

    if trimmed_content.is_empty() {
        None
    } else {
        Some(trimmed_content.to_string())
    }
}

/// Converts a relative image URL to an absolute URL based on a provided base URL object.
///
/// * `src` - A string representing the source URL (can be relative or absolute)
/// * `base` - Base URL object
fn process_image_src(src: &str, base: &mut Url) -> Option<String> {
    match Url::parse(src) {
        Ok(url) => Some(url.to_string()), // Already an absolute URL.
        Err(error) => {
            if ParseError::RelativeUrlWithoutBase == error {
                // Relative URL.
                base.set_path(""); // Remove paths
                let joined = base.join(src).ok();

                joined.map(|joined| joined.to_string())
            } else {
                None
            }
        }
    }
}

/// Returns the metadata for a given URL.
///
/// * `config` - The environment configuration.
/// * `url` - The URL of the target site.
/// * `skip_encoding_image` - The boolean flag indicating whether to skip encoding image URLs for
///   CDN usage (used during testing)
pub async fn get_metadata(
    config: &Config,
    url_prop: &str,
    skip_encoding_image: bool,
) -> Result<MetadataResult, AppError> {
    let url = Url::parse(url_prop)?;
    let html = Client::new(REQUEST_CLIENT.clone())
        .fetch(url.clone())
        .await?;
    let doc_metadata = DocMetadata::from_string(&html).map_err(|error| {
        AppError::InternalError(format!("unable to parse the document metadata: {error:?}"))
    })?;
    let has_opengraph_image = doc_metadata.opengraph.image.is_some();
    let has_twitter_card_image = doc_metadata.twitter_card.image.is_some();

    Ok(MetadataResult {
        embed_type: "metadata".to_string(),
        title: doc_metadata.title.unwrap_or(
            doc_metadata
                .opengraph
                .title
                .unwrap_or(doc_metadata.twitter_card.title.unwrap_or_default()),
        ),
        host: doc_metadata
            .opengraph
            .site_name
            .unwrap_or(url.host_str().unwrap_or_default().to_string()),
        url: url.to_string(),
        description: doc_metadata.description.unwrap_or(
            doc_metadata
                .opengraph
                .description
                .unwrap_or(doc_metadata.twitter_card.description.unwrap_or_default()),
        ),
        image: if has_opengraph_image || has_twitter_card_image {
            let og_image = doc_metadata.opengraph.image;
            let tc_image = doc_metadata.twitter_card.image;

            #[allow(clippy::unwrap_used)]
            let is_large = if has_twitter_card_image && tc_image.clone().unwrap().is_large {
                true
            } else if has_opengraph_image {
                og_image.clone().unwrap().width.unwrap_or_default() > LARGE_IMAGE_WIDTH_LOWER_BOUND
                    && og_image.clone().unwrap().height.unwrap_or_default()
                        > LARGE_IMAGE_HEIGHT_LOWER_BOUND
            } else {
                false
            };

            Some(MetadataImage {
                src: {
                    let src = {
                        if has_opengraph_image {
                            #[allow(clippy::unwrap_used)]
                            process_image_src(&og_image.clone().unwrap().url, &mut url.clone())
                                .unwrap_or_default()
                        } else {
                            #[allow(clippy::unwrap_used)]
                            process_image_src(&tc_image.clone().unwrap().url, &mut url.clone())
                                .unwrap_or_default()
                        }
                    };

                    if skip_encoding_image {
                        src
                    } else {
                        encode_cdn_url(
                            &config.cdn_server_url,
                            &src,
                            &config.proxy_key_secret,
                            if is_large { "w@640" } else { "w@128" },
                        )
                    }
                },
                width: if has_opengraph_image {
                    #[allow(clippy::unwrap_used)]
                    og_image.clone().unwrap().width
                } else {
                    None
                },
                height: if has_opengraph_image {
                    #[allow(clippy::unwrap_used)]
                    og_image.clone().unwrap().height
                } else {
                    None
                },
                alt: if has_opengraph_image {
                    #[allow(clippy::unwrap_used)]
                    og_image.clone().unwrap().alt
                } else {
                    #[allow(clippy::unwrap_used)]
                    tc_image.clone().unwrap().alt
                },
                is_large,
            })
        } else {
            None
        },
        favicon: if let Some(favicon) = doc_metadata.favicon {
            if let Some(src) = process_image_src(favicon.as_str(), &mut url.clone()) {
                if skip_encoding_image {
                    Some(src)
                } else {
                    Some(encode_cdn_url(
                        &config.cdn_server_url,
                        &src,
                        &config.proxy_key_secret,
                        "w@64",
                    ))
                }
            } else {
                None
            }
        } else {
            None
        },
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::get_app_config;
    use mockito::Server;

    #[test]
    fn can_extend_opengraph_tags() {
        let mut opengraph = Opengraph::empty();

        opengraph.extend("site_name", "Some site".to_string());
        opengraph.extend("title", "Some title".to_string());
        opengraph.extend("description", "Some description".to_string());
        opengraph.extend("image", "https://example.com/image.png".to_string());

        assert_eq!(
            opengraph.image.clone().unwrap().url,
            "https://example.com/image.png"
        );

        // Source mutation

        opengraph.extend(
            "image:secure_url",
            "https://secure.example.com/image.png".to_string(),
        );
        opengraph.extend("image:width", "640".to_string());
        opengraph.extend("image:height", "320".to_string());
        opengraph.extend("image:alt", "Some alt text".to_string());

        assert_eq!(
            opengraph,
            Opengraph {
                site_name: Some("Some site".to_string()),
                title: Some("Some title".to_string()),
                description: Some("Some description".to_string()),
                image: Some(OpengraphImage {
                    url: "https://secure.example.com/image.png".to_string(),
                    height: Some(320),
                    width: Some(640),
                    alt: Some("Some alt text".to_string()),
                }),
            }
        );
    }

    #[test]
    fn can_extend_twitter_card_tags() {
        let mut twitter_card = TwitterCard::empty();

        twitter_card.extend("title", "Some title".to_string());
        twitter_card.extend("description", "Some description".to_string());
        twitter_card.extend("image", "https://example.org/image.png".to_string());
        twitter_card.extend("card", "summary_large_image".to_string());
        twitter_card.extend("image:alt", "Some alt text".to_string());

        assert_eq!(
            twitter_card,
            TwitterCard {
                title: Some("Some title".to_string()),
                description: Some("Some description".to_string()),
                image: Some(TwitterImage {
                    url: "https://example.org/image.png".to_string(),
                    is_large: true,
                    alt: Some("Some alt text".to_string()),
                }),
            }
        );
    }

    #[test]
    fn can_extract_opengraph_tags_from_html() {
        let input = r#"
              <html>
                  <head>
                      <meta name="og:site_name" content="Some site">
                      <meta name="og:title" content="Some title">
                      <meta name="og:description" content="Some description">
                      <meta name="og:image" content="https://media.example.com/some.jpg">
                      <meta name="og:image:height" content="320">
                      <meta name="og:image:width" content="640">
                      <meta name="og:image:alt" content="Some alt text">
                  </head>
              </html>
             "#
        .to_string();
        let html = DocMetadata::from_string(&input).unwrap();

        assert_eq!(
            html.opengraph,
            Opengraph {
                site_name: Some("Some site".to_string()),
                title: Some("Some title".to_string()),
                description: Some("Some description".to_string()),
                image: Some(OpengraphImage {
                    url: "https://media.example.com/some.jpg".to_string(),
                    height: Some(320),
                    width: Some(640),
                    alt: Some("Some alt text".to_string()),
                }),
            }
        );

        // Images with secure URL

        let secure_input = r#"
              <html>
                  <head>
                      <meta name="og:image:secure_url" content="https://secure.example.com/some.jpg">
                  </head>
              </html>
             "#
        .to_string();
        let secure_html = DocMetadata::from_string(&secure_input).unwrap();

        assert_eq!(
            secure_html.opengraph.image.clone().unwrap().url,
            "https://secure.example.com/some.jpg".to_string()
        )
    }

    #[test]
    fn can_extract_twitter_tags_from_html() {
        let input = r#"
              <html>
                  <head>
                      <meta name="twitter:title" content="Some title">
                      <meta name="twitter:description" content="Some description">
                      <meta name="twitter:card" content="summary_large_image">
                      <meta name="twitter:image" content="https://media.example.com/some.jpg">
                      <meta name="twitter:image:alt" content="Some alt text">
                  </head>
              </html>
             "#
        .to_string();
        let html = DocMetadata::from_string(&input).unwrap();

        assert_eq!(
            html.twitter_card,
            TwitterCard {
                title: Some("Some title".to_string()),
                description: Some("Some description".to_string()),
                image: Some(TwitterImage {
                    url: "https://media.example.com/some.jpg".to_string(),
                    is_large: true,
                    alt: Some("Some alt text".to_string()),
                }),
            }
        );
    }

    #[test]
    fn can_extract_doc_metadata_from_html() {
        let input = r#"
           <html>
               <head>
                   <title>Some title</title>
                   <meta name="description" content="Some description">
                   <link rel="icon" href="https://example.com/favicon.ico">
               </head>
           </html>
             "#
        .to_string();
        let html = DocMetadata::from_string(&input).unwrap();

        assert_eq!(html.title, Some("Some title".to_string()));
        assert_eq!(html.description, Some("Some description".to_string()));
        assert_eq!(
            html.favicon,
            Some("https://example.com/favicon.ico".to_string())
        );
    }

    #[tokio::test]
    async fn can_fetch_metadata_from_url() {
        let mut server = Server::new_async().await;
        let config = get_app_config().unwrap();

        let mock = server
            .mock("GET", "/")
            .with_status(200)
            .with_body(
                r#"
                <html>
                   <head>
                       <title>Some title</title>
                       <meta name="description" content="Some description">
                       <link rel="icon" href="/favicon.ico">
                       
                       <!-- Opengraph -->
                       <meta name="og:site_name" content="Some site">
                       <meta name="og:title" content="Some title">
                       <meta name="og:description" content="Some description">
                       <meta name="og:image" content="https://media.example.com/some.jpg">
                       <meta name="og:image:height" content="320">
                       <meta name="og:image:width" content="640">
                       <meta name="og:image:alt" content="Some alt text">
                   </head>
               </html>
           "#,
            )
            .with_header("content-type", "text/html")
            .create_async()
            .await;

        let result = get_metadata(&config, server.url().as_str(), true).await;

        assert_eq!(
            result.ok(),
            Some(MetadataResult {
                embed_type: "metadata".to_string(),
                title: "Some title".to_string(),
                host: "Some site".to_string(),
                url: format!("{}/", server.url()),
                description: "Some description".to_string(),
                image: Some(MetadataImage {
                    src: "https://media.example.com/some.jpg".to_string(),
                    width: Some(640),
                    height: Some(320),
                    alt: Some("Some alt text".to_string()),
                    is_large: true,
                }),
                favicon: Some(format!("{}/{}", &server.url().as_str(), "favicon.ico")),
            })
        );

        mock.assert_async().await;
    }

    #[tokio::test]
    async fn can_fallback_to_twitter_cards() {
        let mut server = Server::new_async().await;
        let config = get_app_config().unwrap();

        let mock = server
            .mock("GET", "/")
            .with_status(200)
            .with_body(
                r#"
                <html>
                   <head>
                       <!-- Twitter -->
                       <meta name="twitter:title" content="Some title">
                       <meta name="twitter:description" content="Some description">
                       <meta name="twitter:card" content="summary_large_image">
                       <meta name="twitter:image" content="https://media.example.com/some.jpg">
                       <meta name="twitter:image:alt" content="Some alt text">
                   </head>
               </html>
           "#,
            )
            .with_header("content-type", "text/html")
            .create_async()
            .await;

        let result = get_metadata(&config, server.url().as_str(), true).await;

        assert_eq!(
            result.ok(),
            Some(MetadataResult {
                embed_type: "metadata".to_string(),
                title: "Some title".to_string(),
                host: server.host_with_port().split(':').collect::<Vec<_>>()[0].to_string(),
                url: format!("{}/", server.url()),
                description: "Some description".to_string(),
                image: Some(MetadataImage {
                    src: "https://media.example.com/some.jpg".to_string(),
                    width: None,
                    height: None,
                    alt: Some("Some alt text".to_string()),
                    is_large: true,
                }),
                favicon: None,
            })
        );

        mock.assert_async().await;
    }
}
