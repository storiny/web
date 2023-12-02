use hashbrown::HashMap;
use regex::Regex;
use serde::{
    Deserialize,
    Deserializer,
    Serialize,
};
use serde_json::Value;

/// The embed provider.
#[derive(Debug, Deserialize)]
pub struct Provider {
    /// The name of the provider.
    pub name: &'static str,
    /// The provider oembed enpoint URL.
    #[serde(default)]
    pub endpoint: &'static str,
    /// The provider raw embed enpoint (providers that supports embedding using a dedicated
    /// endpoint).
    #[serde(default)]
    pub embed_endpoint: Option<&'static str>,
    /// The optional aspect ratio padding for the embed node (desktop viewport).
    #[serde(default)]
    pub desktop_padding: Option<f64>,
    /// The optional aspect ratio padding for the embed node (mobile viewport).
    #[serde(default)]
    pub mobile_padding: Option<f64>,
    /// The schema patterns for constructing the regex matchers.
    pub schemas: Vec<String>,
    /// The schema matchers for matching client-provided URLs.
    #[serde(skip_deserializing)]
    pub matchers: Vec<Regex>,
    /// The boolean flag indicating whether the provider supports
    /// both `light` and `dark` modes.
    #[serde(default)]
    pub supports_binary_theme: bool,
    /// The boolean flag indicating whether the provider supports
    /// the oembed spec.
    #[serde(default = "true_value")]
    pub supports_oembed: bool,
    /// The DOM attributes for the embed iframe element.
    #[serde(default)]
    pub iframe_attrs: Option<HashMap<&'static str, &'static str>>,
    /// The iframe source query parameters for the embed iframe element.
    #[serde(default)]
    pub iframe_params: Option<HashMap<&'static str, &'static str>>,
    /// The optional key-value pairs to append to the provider endpoint URL.
    #[serde(default)]
    pub origin_params: Option<HashMap<&'static str, &'static str>>,
}

/// The oEmbed data type.
#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "type")]
pub enum EmbedType {
    /// The photo type.
    ///
    /// See section 2.3.4.1. of the [oembed spec](https://oembed.com)
    #[serde(rename = "photo")]
    Photo(Photo),
    /// The video type.
    ///
    /// See section 2.3.4.2. of the [oembed spec](https://oembed.com)
    #[serde(rename = "video")]
    Video(Video),
    /// The link type.
    ///
    /// See section 2.3.4.3. of the [oembed spec](https://oembed.com)
    #[serde(rename = "link")]
    Link,
    /// The rich type.
    ///
    /// See section 2.3.4.4. of the [oembed spec](https://oembed.com)
    #[serde(rename = "rich")]
    Rich(Rich),
}

/// The video type.
///
/// See section 2.3.4.2. of the [oembed spec](https://oembed.com)
#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
pub struct Video {
    pub html: String,
    #[serde(default)]
    #[serde(deserialize_with = "deserialize_u16_from_maybe_string")]
    pub width: Option<u16>,
    #[serde(default)]
    #[serde(deserialize_with = "deserialize_u16_from_maybe_string")]
    pub height: Option<u16>,
}

/// The photo type.
///
/// See section 2.3.4.1. of the [oembed spec](https://oembed.com)
#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
pub struct Photo {
    pub url: String,
    #[serde(default)]
    #[serde(deserialize_with = "deserialize_u16_from_maybe_string")]
    pub width: Option<u16>,
    #[serde(default)]
    #[serde(deserialize_with = "deserialize_u16_from_maybe_string")]
    pub height: Option<u16>,
}

/// The rich type.
///
/// See section 2.3.4.4. of the [oembed spec](https://oembed.com)
#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
pub struct Rich {
    pub html: String,
    #[serde(default)]
    #[serde(deserialize_with = "deserialize_u16_from_maybe_string")]
    pub width: Option<u16>,
    #[serde(default)]
    #[serde(deserialize_with = "deserialize_u16_from_maybe_string")]
    pub height: Option<u16>,
}

/// The oEmbed response.
///
/// See the [oembed spec](https://oembed.com/#section2.3)
#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct EmbedResponse {
    #[serde(flatten)]
    pub oembed_type: EmbedType,
    pub title: Option<String>,
    #[serde(flatten)]
    pub extra: HashMap<String, Value>,
}

/// Deserializes u16 from a number or a string, since some providers could return numbers as
/// string in the JSON response.
///
/// * `deserializer` - Deserializer
fn deserialize_u16_from_maybe_string<'de, D>(deserializer: D) -> Result<Option<u16>, D::Error>
where
    D: Deserializer<'de>,
{
    let value: Value = Deserialize::deserialize(deserializer)?;

    match value {
        Value::Number(num) => {
            if let Some(parsed) = num.as_u64() {
                if parsed <= u16::MAX as u64 {
                    Ok(Some(parsed as u16))
                } else {
                    Ok(None)
                }
            } else {
                Ok(None)
            }
        }
        Value::String(s) => {
            if let Ok(parsed) = s.parse::<u16>() {
                Ok(Some(parsed))
            } else {
                Ok(None)
            }
        }
        _ => Ok(None),
    }
}

/// Returns `true`
fn true_value() -> bool {
    true
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn can_deserialize_photo_response() {
        let input = r#"{
            "version": "1.0",
            "type": "video",
            "provider_name": "YouTube",
            "provider_url": "https://youtube.com/",
            "width": 425,
            "height": 344,
            "title": "Amazing Nintendo Facts",
            "author_name": "ZackScott",
            "author_url": "https://www.youtube.com/user/ZackScott",
            "html": "..."
        }"#;
        let response: EmbedResponse = serde_json::from_str(input).unwrap();

        assert_eq!(response.title, Some("Amazing Nintendo Facts".to_string()));
        assert_eq!(
            response.oembed_type,
            EmbedType::Video(Video {
                html: "...".to_string(),
                width: Some(425),
                height: Some(344)
            })
        )
    }
}
