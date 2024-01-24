use crate::spec::{
    EmbedResponse,
    EmbedType,
};
use hashbrown::HashMap;
use serde_this_or_that::Serialize;
use url::Url;
use visdom::{
    types::IAttrValue,
    Vis,
};

/// The default height in pixels.
const DEFAULT_HEIGHT: u16 = 360;

/// The default width in pixels.
const DEFAULT_WIDTH: u16 = 640;

/// Converts an element attribute to a string.
///
/// * `attr` - An optional element attribute.
fn attr_to_string(attr: Option<IAttrValue>) -> String {
    attr.unwrap_or(IAttrValue::Value(String::from(""), None))
        .to_string()
}

/// The result of parsing an response having an iframe.
#[derive(Debug, Serialize, PartialEq)]
pub struct IframeResult {
    /// The HTML content of the iframe.
    pub iframe_html: String,
    /// The title associated with the iframe.
    pub title: String,
    /// The styles applied to the iframe wrapper.
    pub wrapper_styles: String,
}

/// The result of parsing a response not having an iframe.
#[derive(Debug, Serialize, PartialEq)]
pub struct ScriptResult {
    /// The HTML content of the response (without scripts).
    pub html: String,
    /// A list of script sources.
    pub sources: Vec<String>,
    /// The type of the embed.
    pub embed_type: String,
    /// The binary theme flag.
    pub supports_binary_theme: bool,
}

/// The result of parsing the response.
#[derive(Debug, Serialize, PartialEq)]
pub enum ParseResult {
    /// The result of parsing a response with an iframe element.
    IframeResult(IframeResult),
    /// The result of parsing a response without an iframe element.
    ScriptResult(ScriptResult),
}

/// Parses a provider response.
///
/// * `html` - The HTML string from the response.
/// * `width_prop` - The width value (in px).
/// * `height_prop` - The height value (in px).
/// * `title_prop` - The embed title value.
/// * `iframe_params` - Optional extra iframe params (appended to the iframe src).
/// * `iframe_attrs` - Optional iframe attributes.
/// * `supports_binary_theme` - The binary theme flag.
fn parse_response_impl(
    html: &str,
    width_prop: &Option<u16>,
    height_prop: &Option<u16>,
    title_prop: &Option<String>,
    iframe_params: &Option<HashMap<&str, &str>>,
    iframe_attrs: &Option<HashMap<&str, &str>>,
    supports_binary_theme: &bool,
) -> Option<ParseResult> {
    let mut width = width_prop.unwrap_or(DEFAULT_WIDTH);
    let mut height = height_prop.unwrap_or(DEFAULT_HEIGHT);
    let root = Vis::load(html).ok()?;

    // Get the first iframe.
    let mut iframe = root.find("iframe").first();

    if !iframe.is_empty() {
        // Get the optional iframe wrapper.
        let mut wrapper = iframe.parent("div").first();
        let has_wrapper = !wrapper.is_empty();

        let style_attr =
            attr_to_string((if has_wrapper { &wrapper } else { &iframe }).attr("style"));

        let title = title_prop
            .clone()
            .unwrap_or(attr_to_string(iframe.attr("title")));

        let iframe_width = attr_to_string(iframe.attr("width"));
        let iframe_height = attr_to_string(iframe.attr("height"));

        let iframe_width_px = iframe_width.parse::<u16>().unwrap_or(0);
        let iframe_height_px = iframe_height.parse::<u16>().unwrap_or(0);
        let has_fixed_size = !iframe_width.ends_with('%') && !iframe_height.ends_with('%');

        if iframe_width_px > 0 && iframe_height_px > 0 {
            height = iframe_height_px;
            width = iframe_width_px;
        }

        // Set the extra params.
        if let Some(extra_params) = iframe_params {
            let iframe_src = iframe
                .attr("src")
                .map(|value| value.to_string())
                .unwrap_or_default();

            if let Ok(mut iframe_src) = Url::parse(iframe_src.as_str()) {
                iframe_src
                    .query_pairs_mut()
                    .extend_pairs(&extra_params.clone())
                    .finish();

                iframe.set_attr("src", Some(iframe_src.as_ref()));
            }
        }

        iframe.set_attr("loading", Some("lazy"));
        iframe.remove_attr("width");
        iframe.remove_attr("height");
        iframe.remove_attr("style");

        if let Some(iframe_attrs) = iframe_attrs {
            for (key, value) in iframe_attrs.clone() {
                iframe.set_attr(key, Some(value));
            }
        }

        // Replace the wrapper with the iframe element.
        if has_wrapper {
            wrapper.replace_with(&mut iframe);
        }

        Some(ParseResult::IframeResult(IframeResult {
            iframe_html: root.outer_html(),
            wrapper_styles: if has_wrapper && !style_attr.is_empty() {
                style_attr
            } else if has_fixed_size {
                format!(
                    "--padding-desktop:{:.2}%",
                    (height as f32 / width as f32) * 100.0
                )
            } else {
                format!(
                    "height:{};width:{};{}",
                    if iframe_height_px > 0 {
                        format!("{}px", iframe_height_px)
                    } else {
                        iframe_height
                    },
                    if iframe_width_px > 0 {
                        format!("{}px", iframe_width_px)
                    } else {
                        iframe_width
                    },
                    style_attr
                )
            },
            title,
        }))
    } else {
        let mut scripts = root.find("script[src]");
        let mut sources: Vec<String> = vec![];

        scripts.for_each(|_, script_node| {
            sources.push(attr_to_string(script_node.get_attribute("src")));

            true
        });

        // Remove the script elements.
        scripts.remove();

        Some(ParseResult::ScriptResult(ScriptResult {
            embed_type: "sourced_oembed".to_string(),
            supports_binary_theme: *supports_binary_theme,
            html: root.outer_html(),
            sources,
        }))
    }
}

/// Parses HTML from the provider.
///
/// * `response` - The provider response.
/// * `iframe_params` - Optional extra iframe parameters.
/// * `iframe_attrs` - Optional iframe attributes.
/// * `supports_binary_theme` - The boolean flag indicating whether the provider supports binary
///   theme.
pub fn parse_html(
    response: &EmbedResponse,
    iframe_params: &Option<HashMap<&str, &str>>,
    iframe_attrs: &Option<HashMap<&str, &str>>,
    supports_binary_theme: &bool,
) -> Option<ParseResult> {
    match &response.oembed_type {
        EmbedType::Video(data) => parse_response_impl(
            &data.html,
            &data.width,
            &data.height,
            &response.title,
            iframe_params,
            iframe_attrs,
            supports_binary_theme,
        ),
        EmbedType::Rich(data) => parse_response_impl(
            &data.html,
            &data.width,
            &data.height,
            &response.title,
            iframe_params,
            iframe_attrs,
            supports_binary_theme,
        ),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::spec::{
        Photo,
        Rich,
        Video,
    };

    #[test]
    fn can_parse_video_embed() {
        let video_response = EmbedResponse {
            oembed_type: EmbedType::Video(Video {
                html: r#"<iframe src="https://example.com"></iframe>"#.to_string(),
                width: Some(640),
                height: Some(320),
            }),
            title: Some("Video embed title".to_string()),
            extra: Default::default(),
        };
        let result = parse_html(&video_response, &None, &None, &false).unwrap();

        assert_eq!(
            result,
            ParseResult::IframeResult(IframeResult {
                iframe_html: r#"<iframe src="https://example.com" loading="lazy"></iframe>"#
                    .to_string(),
                title: video_response.title.unwrap(),
                wrapper_styles: "--padding-desktop:50.00%".to_string(),
            })
        );
    }

    #[test]
    fn can_parse_rich_embed() {
        let rich_response = EmbedResponse {
            oembed_type: EmbedType::Rich(Rich {
                html: r#"<iframe src="https://example.com"></iframe>"#.to_string(),
                width: Some(640),
                height: Some(320),
            }),
            title: Some("Rich embed title".to_string()),
            extra: Default::default(),
        };
        let result = parse_html(&rich_response, &None, &None, &false).unwrap();

        assert_eq!(
            result,
            ParseResult::IframeResult(IframeResult {
                iframe_html: r#"<iframe src="https://example.com" loading="lazy"></iframe>"#
                    .to_string(),
                title: rich_response.title.unwrap(),
                wrapper_styles: "--padding-desktop:50.00%".to_string(),
            })
        );
    }

    #[test]
    fn can_skip_other_embed_types() {
        let response = EmbedResponse {
            oembed_type: EmbedType::Photo(Photo {
                url: "https://example.com/some.jpg".to_string(),
                width: Some(640),
                height: Some(320),
            }),
            title: Some("Embed title".to_string()),
            extra: Default::default(),
        };
        let result = parse_html(&response, &None, &None, &false);

        assert_eq!(result, None);
    }

    #[test]
    fn can_compute_padding() {
        let response = EmbedResponse {
            oembed_type: EmbedType::Rich(Rich {
                html: r#"<iframe src="https://example.com"></iframe>"#.to_string(),
                width: Some(1440),
                height: Some(860),
            }),
            title: Some("Embed title".to_string()),
            extra: Default::default(),
        };
        let result = parse_html(&response, &None, &None, &false).unwrap();

        assert_eq!(
            result,
            ParseResult::IframeResult(IframeResult {
                iframe_html: r#"<iframe src="https://example.com" loading="lazy"></iframe>"#
                    .to_string(),
                title: response.title.unwrap(),
                wrapper_styles: "--padding-desktop:59.72%".to_string(),
            })
        );
    }

    #[test]
    fn can_replace_wrapper_with_iframe() {
        let response = EmbedResponse {
            oembed_type: EmbedType::Rich(Rich {
                html: r#"<div><iframe src="https://example.com"></iframe><div>"#.to_string(),
                width: Some(640),
                height: Some(320),
            }),
            title: Some("Embed title".to_string()),
            extra: Default::default(),
        };
        let result = parse_html(&response, &None, &None, &false).unwrap();

        assert_eq!(
            result,
            ParseResult::IframeResult(IframeResult {
                iframe_html: r#"<iframe src="https://example.com" loading="lazy"></iframe>"#
                    .to_string(),
                title: response.title.unwrap(),
                wrapper_styles: "--padding-desktop:50.00%".to_string(),
            })
        );
    }

    #[test]
    fn can_extract_styles_from_wrapper() {
        let response = EmbedResponse {
            oembed_type: EmbedType::Rich(Rich {
                html:
                    r#"<div style="height:400px"><iframe src="https://example.com"></iframe><div>"#
                        .to_string(),
                width: Some(640),
                height: Some(320),
            }),
            title: Some("Embed title".to_string()),
            extra: Default::default(),
        };
        let result = parse_html(&response, &None, &None, &false).unwrap();

        assert_eq!(
            result,
            ParseResult::IframeResult(IframeResult {
                iframe_html: r#"<iframe src="https://example.com" loading="lazy"></iframe>"#
                    .to_string(),
                title: response.title.unwrap(),
                wrapper_styles: "height:400px".to_string(),
            })
        );
    }

    #[test]
    fn can_handle_relative_iframe_size() {
        let response = EmbedResponse {
            oembed_type: EmbedType::Rich(Rich {
                html: r#"<iframe height="60%" width="40%" style="color:red" src="https://example.com"></iframe>"#.to_string(),
                width: Some(640),
                height: Some(320),
            }),
            title: Some("Embed title".to_string()),
            extra: Default::default(),
        };
        let result = parse_html(&response, &None, &None, &false).unwrap();

        assert_eq!(
            result,
            ParseResult::IframeResult(IframeResult {
                // visdom adds extra whitespace when the src is mutated
                iframe_html: r#"<iframe    src="https://example.com" loading="lazy"></iframe>"#
                    .to_string(),
                title: response.title.unwrap(),
                wrapper_styles: "height:60%;width:40%;color:red".to_string(),
            })
        );
    }

    #[test]
    fn can_append_iframe_params() {
        let response = EmbedResponse {
            oembed_type: EmbedType::Rich(Rich {
                html: r#"<iframe src="https://example.com"></iframe>"#.to_string(),
                width: Some(640),
                height: Some(320),
            }),
            title: Some("Embed title".to_string()),
            extra: Default::default(),
        };
        let mut iframe_params = HashMap::new();

        iframe_params.insert("some_param", "some_value");

        let result = parse_html(&response, &Some(iframe_params), &None, &false).unwrap();

        assert_eq!(
            result,
            ParseResult::IframeResult(IframeResult {
                iframe_html: r#"<iframe src="https://example.com/?some_param=some_value" loading="lazy"></iframe>"#
                    .to_string(),
                title: response.title.unwrap(),
                wrapper_styles: "--padding-desktop:50.00%".to_string(),
            })
        );
    }

    #[test]
    fn can_append_iframe_params_with_existing_query_string() {
        let response = EmbedResponse {
            oembed_type: EmbedType::Rich(Rich {
                html: r#"<iframe src="https://example.com/?param=value"></iframe>"#.to_string(),
                width: Some(640),
                height: Some(320),
            }),
            title: Some("Embed title".to_string()),
            extra: Default::default(),
        };
        let mut iframe_params = HashMap::new();

        iframe_params.insert("some_param", "some_value");

        let result = parse_html(&response, &Some(iframe_params), &None, &false).unwrap();

        assert_eq!(
            result,
            ParseResult::IframeResult(IframeResult {
                iframe_html: r#"<iframe src="https://example.com/?param=value&some_param=some_value" loading="lazy"></iframe>"#
                    .to_string(),
                title: response.title.unwrap(),
                wrapper_styles: "--padding-desktop:50.00%".to_string(),
            })
        );
    }

    #[test]
    fn can_append_iframe_attributes() {
        let response = EmbedResponse {
            oembed_type: EmbedType::Rich(Rich {
                html: r#"<iframe src="https://example.com"></iframe>"#.to_string(),
                width: Some(640),
                height: Some(320),
            }),
            title: Some("Embed title".to_string()),
            extra: Default::default(),
        };
        let mut iframe_attrs = HashMap::new();

        iframe_attrs.insert("allowfullscreen", "true");

        let result = parse_html(&response, &None, &Some(iframe_attrs), &false).unwrap();

        assert_eq!(
            result,
            ParseResult::IframeResult(IframeResult {
                iframe_html: r#"<iframe src="https://example.com" loading="lazy" allowfullscreen="true"></iframe>"#.to_string(),
                title: response.title.unwrap(),
                wrapper_styles: "--padding-desktop:50.00%".to_string(),
            })
        );
    }

    #[test]
    fn can_parse_embed_without_iframe() {
        let response = EmbedResponse {
            oembed_type: EmbedType::Rich(Rich {
                html: r#"<blockquote></blockquote>"#.to_string(),
                width: Some(640),
                height: Some(320),
            }),
            title: Some("Embed title".to_string()),
            extra: Default::default(),
        };
        let result = parse_html(&response, &None, &None, &false).unwrap();

        assert_eq!(
            result,
            ParseResult::ScriptResult(ScriptResult {
                embed_type: "sourced_oembed".to_string(),
                html: r#"<blockquote></blockquote>"#.to_string(),
                supports_binary_theme: false,
                sources: vec![]
            })
        );
    }

    #[test]
    fn can_parse_extract_and_clean_script_data() {
        let response = EmbedResponse {
            oembed_type: EmbedType::Rich(Rich {
                html: r#"<blockquote></blockquote><script src="https://example.com/some.js"></script><script src="https://example.com/other.js"></script>"#
                .to_string(),
                width: Some(640),
                height: Some(320),
            }),
            title: Some("Embed title".to_string()),
            extra: Default::default(),
        };
        let result = parse_html(&response, &None, &None, &false).unwrap();

        assert_eq!(
            result,
            ParseResult::ScriptResult(ScriptResult {
                embed_type: "sourced_oembed".to_string(),
                html: r#"<blockquote></blockquote>"#.to_string(),
                supports_binary_theme: false,
                sources: vec![
                    "https://example.com/some.js".to_string(),
                    "https://example.com/other.js".to_string()
                ]
            })
        );
    }
}
