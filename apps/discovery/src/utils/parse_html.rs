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

const DEFAULT_HEIGHT: u16 = 360;
const DEFAULT_WIDTH: u16 = 640;

/// Converts an element attribute to a string.
///
/// * `attr` - An optional element attribute.
fn attr_to_string(attr: Option<IAttrValue>) -> String {
    attr.unwrap_or(IAttrValue::Value(String::from(""), None))
        .to_string()
}

/// Represents the result of parsing an response having an iframe.
#[derive(Debug, Serialize, PartialEq)]
pub struct IframeResult {
    /// The HTML content of the iframe.
    pub iframe_html: String,
    /// The title associated with the iframe.
    pub title: String,
    /// The styles applied to the iframe wrapper.
    pub wrapper_styles: String,
}

/// Represents the result of parsing a response not having an iframe.
#[derive(Debug, Serialize, PartialEq)]
pub struct ScriptResult {
    /// The HTML content of the response (without scripts).
    pub html: String,
    /// A list of script sources.
    pub sources: Vec<String>,
}

/// Represents the result of parsing the response.
#[derive(Debug, Serialize, PartialEq)]
pub enum ParseResult {
    /// The result of parsing a response with an iframe element.
    IframeResult(IframeResult),
    /// The result of parsing a response without an iframe element.
    ScriptResult(ScriptResult),
}

/// Parses a provider response.
///
/// * `html` - HTML from the response
/// * `width_prop` - Width value
/// * `height_prop` - Height value
/// * `title_prop` - Embed title value
/// * `iframe_params` - Optional extra iframe params (appended to the iframe src)
fn parse_response_impl(
    html: &str,
    width_prop: &Option<u16>,
    height_prop: &Option<u16>,
    title_prop: &Option<String>,
    iframe_params: &Option<HashMap<&str, &str>>,
) -> Option<ParseResult> {
    let mut width = width_prop.unwrap_or(DEFAULT_WIDTH);
    let mut height = height_prop.unwrap_or(DEFAULT_HEIGHT);
    let root = Vis::load(html).unwrap();

    // Get the first iframe
    let mut iframe = root.find("iframe").first();

    if !iframe.is_empty() {
        // Get the optional iframe wrapper
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
        let has_fixed_size = !iframe_width.ends_with("%") && !iframe_height.ends_with("%");

        if iframe_width_px > 0 && iframe_height_px > 0 {
            height = iframe_height_px;
            width = iframe_width_px;
        }

        // Set the extra params
        if let Some(extra_params) = iframe_params {
            let mut iframe_src = Url::parse(&iframe.attr("src").unwrap().to_string()).unwrap();
            iframe_src
                .query_pairs_mut()
                .extend_pairs(&extra_params.clone())
                .finish();
            iframe.set_attr("src", Some(&iframe_src.to_string()));
        }

        iframe.set_attr("loading", Some("lazy"));
        iframe.remove_attr("width");
        iframe.remove_attr("height");
        iframe.remove_attr("style");

        // Replace the wrapper with the iframe element
        if has_wrapper {
            wrapper.replace_with(&mut iframe);
        }

        Some(ParseResult::IframeResult(IframeResult {
            iframe_html: root.outer_html(),
            wrapper_styles: if has_wrapper && !style_attr.is_empty() {
                style_attr
            } else if has_fixed_size {
                format!(
                    "padding-bottom:{:.2}%",
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

            return true;
        });

        // Remove the script elements
        scripts.remove();

        Some(ParseResult::ScriptResult(ScriptResult {
            html: root.outer_html(),
            sources,
        }))
    }
}

/// Parses HTML from the provider.
///
/// * `response` - Provider response
/// * `iframe_params` - Optional extra iframe params
pub fn parse_html(
    response: &EmbedResponse,
    iframe_params: &Option<HashMap<&str, &str>>,
) -> Option<ParseResult> {
    match &response.oembed_type {
        EmbedType::Video(data) => parse_response_impl(
            &data.html,
            &data.width,
            &data.height,
            &response.title,
            iframe_params,
        ),
        EmbedType::Rich(data) => parse_response_impl(
            &data.html,
            &data.width,
            &data.height,
            &response.title,
            iframe_params,
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
            version: "1".to_string(),
            title: Some("Video embed title".to_string()),
            author_name: None,
            author_url: None,
            provider_name: None,
            provider_url: None,
            thumbnail_url: None,
            thumbnail_width: None,
            thumbnail_height: None,
            extra: Default::default(),
        };
        let result = parse_html(&video_response, &None).unwrap();

        assert_eq!(
            result,
            ParseResult::IframeResult(IframeResult {
                iframe_html: r#"<iframe src="https://example.com" loading="lazy"></iframe>"#
                    .to_string(),
                title: video_response.title.unwrap(),
                wrapper_styles: "padding-bottom:50.00%".to_string(),
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
            version: "1".to_string(),
            title: Some("Rich embed title".to_string()),
            author_name: None,
            author_url: None,
            provider_name: None,
            provider_url: None,
            thumbnail_url: None,
            thumbnail_width: None,
            thumbnail_height: None,
            extra: Default::default(),
        };
        let result = parse_html(&rich_response, &None).unwrap();

        assert_eq!(
            result,
            ParseResult::IframeResult(IframeResult {
                iframe_html: r#"<iframe src="https://example.com" loading="lazy"></iframe>"#
                    .to_string(),
                title: rich_response.title.unwrap(),
                wrapper_styles: "padding-bottom:50.00%".to_string(),
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
            version: "1".to_string(),
            title: Some("Embed title".to_string()),
            author_name: None,
            author_url: None,
            provider_name: None,
            provider_url: None,
            thumbnail_url: None,
            thumbnail_width: None,
            thumbnail_height: None,
            extra: Default::default(),
        };
        let result = parse_html(&response, &None);

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
            version: "1".to_string(),
            title: Some("Embed title".to_string()),
            author_name: None,
            author_url: None,
            provider_name: None,
            provider_url: None,
            thumbnail_url: None,
            thumbnail_width: None,
            thumbnail_height: None,
            extra: Default::default(),
        };
        let result = parse_html(&response, &None).unwrap();

        assert_eq!(
            result,
            ParseResult::IframeResult(IframeResult {
                iframe_html: r#"<iframe src="https://example.com" loading="lazy"></iframe>"#
                    .to_string(),
                title: response.title.unwrap(),
                wrapper_styles: "padding-bottom:59.72%".to_string(),
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
            version: "1".to_string(),
            title: Some("Embed title".to_string()),
            author_name: None,
            author_url: None,
            provider_name: None,
            provider_url: None,
            thumbnail_url: None,
            thumbnail_width: None,
            thumbnail_height: None,
            extra: Default::default(),
        };
        let result = parse_html(&response, &None).unwrap();

        assert_eq!(
            result,
            ParseResult::IframeResult(IframeResult {
                iframe_html: r#"<iframe src="https://example.com" loading="lazy"></iframe>"#
                    .to_string(),
                title: response.title.unwrap(),
                wrapper_styles: "padding-bottom:50.00%".to_string(),
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
            version: "1".to_string(),
            title: Some("Embed title".to_string()),
            author_name: None,
            author_url: None,
            provider_name: None,
            provider_url: None,
            thumbnail_url: None,
            thumbnail_width: None,
            thumbnail_height: None,
            extra: Default::default(),
        };
        let result = parse_html(&response, &None).unwrap();

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
            version: "1".to_string(),
            title: Some("Embed title".to_string()),
            author_name: None,
            author_url: None,
            provider_name: None,
            provider_url: None,
            thumbnail_url: None,
            thumbnail_width: None,
            thumbnail_height: None,
            extra: Default::default(),
        };
        let result = parse_html(&response, &None).unwrap();

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
            version: "1".to_string(),
            title: Some("Embed title".to_string()),
            author_name: None,
            author_url: None,
            provider_name: None,
            provider_url: None,
            thumbnail_url: None,
            thumbnail_width: None,
            thumbnail_height: None,
            extra: Default::default(),
        };
        let mut iframe_params = HashMap::new();

        iframe_params.insert("some_param", "some_value");

        let result = parse_html(&response, &Some(iframe_params)).unwrap();

        assert_eq!(
            result,
            ParseResult::IframeResult(IframeResult {
                iframe_html: r#"<iframe src="https://example.com/?some_param=some_value" loading="lazy"></iframe>"#
                    .to_string(),
                title: response.title.unwrap(),
                wrapper_styles: "padding-bottom:50.00%".to_string(),
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
            version: "1".to_string(),
            title: Some("Embed title".to_string()),
            author_name: None,
            author_url: None,
            provider_name: None,
            provider_url: None,
            thumbnail_url: None,
            thumbnail_width: None,
            thumbnail_height: None,
            extra: Default::default(),
        };
        let mut iframe_params = HashMap::new();

        iframe_params.insert("some_param", "some_value");

        let result = parse_html(&response, &Some(iframe_params)).unwrap();

        assert_eq!(
            result,
            ParseResult::IframeResult(IframeResult {
                iframe_html: r#"<iframe src="https://example.com/?param=value&some_param=some_value" loading="lazy"></iframe>"#
                    .to_string(),
                title: response.title.unwrap(),
                wrapper_styles: "padding-bottom:50.00%".to_string(),
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
            version: "1".to_string(),
            title: Some("Embed title".to_string()),
            author_name: None,
            author_url: None,
            provider_name: None,
            provider_url: None,
            thumbnail_url: None,
            thumbnail_width: None,
            thumbnail_height: None,
            extra: Default::default(),
        };
        let result = parse_html(&response, &None).unwrap();

        assert_eq!(
            result,
            ParseResult::ScriptResult(ScriptResult {
                html: r#"<blockquote></blockquote>"#.to_string(),
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
            version: "1".to_string(),
            title: Some("Embed title".to_string()),
            author_name: None,
            author_url: None,
            provider_name: None,
            provider_url: None,
            thumbnail_url: None,
            thumbnail_width: None,
            thumbnail_height: None,
            extra: Default::default(),
        };
        let result = parse_html(&response, &None).unwrap();

        assert_eq!(
            result,
            ParseResult::ScriptResult(ScriptResult {
                html: r#"<blockquote></blockquote>"#.to_string(),
                sources: vec![
                    "https://example.com/some.js".to_string(),
                    "https://example.com/other.js".to_string()
                ]
            })
        );
    }
}
