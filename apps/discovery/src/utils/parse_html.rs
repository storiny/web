use crate::spec::{
    EmbedResponse,
    EmbedType,
};
use serde::Serialize;
use std::collections::HashMap;
use url::Url;
use visdom::{
    types::IAttrValue,
    Vis,
};

const DEFAULT_HEIGHT: u16 = 360;
const DEFAULT_WIDTH: u16 = 640;

///   let height = Number.parseInt('' + data.height) || 360;
//     let width = Number.parseInt('' + data.width) || 640;
//
//     const $ = cheerio.load(data.html);
//     const iframes = $('iframe');
//
//     if (iframes.length) {
//       const wrapper = $('div');
//       const frame = iframes.first();
//
//       const hasFixedDimensions =
//         !(frame.attr('width') || '').endsWith('%') &&
//         !(frame.attr('height') || '').endsWith('%');
//
//       const widthAttr = frame.attr('width');
//       const heightAttr = frame.attr('height');
//       const styleAttr = (wrapper.length ? wrapper : frame).attr('style');
//
//       const frameWidth = Number.parseInt('' + widthAttr);
//       const frameHeight = Number.parseInt('' + heightAttr);
//
//       const frameSrc = frame.attr('src') || '';
//       const title = data.title || frame.attr('title') || data.provider_name;
//
//       if (frameWidth && frameHeight) {
//         height = frameHeight;
//         width = frameWidth;
//       }
//
//       frame.attr('loading', 'lazy');
//       frame.removeAttr('width');
//       frame.removeAttr('height');
//       frame.removeAttr('style');
//
//       if (iframeParams) {
//         frame.attr(
//           'src',
//           `${frameSrc}${
//             frameSrc.indexOf('?') > -1 ? '&' : '?'
//           }${new URLSearchParams(iframeParams).toString()}`
//         );
//       }
//
//       if (wrapper.length) {
//         frame.unwrap();
//       }
//
//       return {
//         frameHtml: $.html(),
//         title,
//         wrapperStyles: wrapper.length
//           ? styleAttr
//           : hasFixedDimensions
//           ? `padding-bottom: ${((height / width) * 100).toFixed(2)}%`
//           : [
//               `height: ${parseDimension(heightAttr)}`,
//               `width: ${parseDimension(widthAttr)}`,
//               styleAttr || '',
//             ].join(';'),
//       };
//     } else {
//       const script = $('script');
//       const scriptSrc = script.length
//         ? script.first().attr('src') || null
//         : null;
//
//       if (script.length) {
//         script.remove();
//       }
//
//       return {
//         html: data.html,
//         script: scriptSrc,
//       };
//     }

#[derive(Serialize)]
pub struct ParseResult {
    frame_html: String,
    title: String,
    wrapper_styles: String,
}

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
    // Get the optional iframe wrapper
    let mut wrapper = iframe.parent("div").first();
    let has_wrapper = !wrapper.is_empty();

    let style_attr = (if has_wrapper { &wrapper } else { &iframe })
        .attr("style")
        .unwrap_or(IAttrValue::Value(String::from(""), None))
        .to_string();

    let title = title_prop.clone().unwrap_or(
        iframe
            .attr("title")
            .unwrap_or(IAttrValue::Value(String::from(""), None))
            .to_string(),
    );

    let iframe_width = iframe
        .attr("width")
        .unwrap_or(IAttrValue::Value(String::from(""), None))
        .to_string();

    let iframe_height = iframe
        .attr("height")
        .unwrap_or(IAttrValue::Value(String::from(""), None))
        .to_string();

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

    if has_wrapper {
        wrapper.replace_with(&mut iframe);
    }

    Some(ParseResult {
        frame_html: root.outer_html(),
        wrapper_styles: if has_wrapper {
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
    })
}

/// Decompresses a compressed URL
///
/// * `compressed_url` - Compressed URL
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

// #[cfg(test)]
// mod tests {
//     use super::*;
//     use lz_str::compress_to_encoded_uri_component;
//
//     #[test]
//     fn can_decompress_url() {
//         let url = "https://storiny.com/some-path?with=query";
//         let compressed_url = compress_to_encoded_uri_component(url);
//         let decompressed_url = decompress_url(&compressed_url).unwrap().unwrap();
//
//         assert_eq!(decompressed_url, url);
//     }
// }
