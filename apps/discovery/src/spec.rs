use hashbrown::HashMap;
use regex::Regex;
use serde::{
    de,
    Deserialize,
    Deserializer,
    Serialize,
};
use serde_json::Value;
use std::str::FromStr;

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
                    Err(de::Error::custom(format!(
                        "Value {} is out of range for u16",
                        parsed
                    )))
                }
            } else {
                Err(de::Error::custom("Failed to convert number to u16"))
            }
        }
        Value::String(s) => {
            println!("{}", s);
            if let Ok(parsed) = s.parse::<u16>() {
                Ok(Some(parsed))
            } else {
                Err(de::Error::custom("Failed to parse string as u16"))
            }
        }
        _ => Ok(None),
    }
}

/// Embed provider
#[derive(Debug, Deserialize)]
pub struct Provider {
    /// Name of the provider
    pub name: &'static str,
    /// Provider oEmbed enpoint
    pub endpoint: &'static str,
    /// Optional aspect ratio padding for the embed node
    #[serde(default)]
    pub padding: Option<f64>,
    /// Schema patterns
    pub schemas: Vec<String>,
    /// Schema matchers
    #[serde(skip_deserializing)]
    pub matchers: Vec<Regex>,
    /// Boolean flag indicating whether the provider supports
    /// both `light` and `dark` modes
    #[serde(default)]
    pub supports_binary_theme: bool,
    /// DOM attributes for the embed iframe element
    #[serde(default)]
    pub iframe_params: Option<HashMap<&'static str, &'static str>>,
    /// Optional key-value pairs to append to the provider endpoint URL
    #[serde(default)]
    pub origin_params: Option<HashMap<&'static str, &'static str>>,
}

/// Represents one of the oEmbed data types
#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "type")]
pub enum EmbedType {
    /// Photo type
    ///
    /// See section 2.3.4.1. of the [oembed spec](https://oembed.com)
    #[serde(rename = "photo")]
    Photo(Photo),
    /// Video type
    ///
    /// See section 2.3.4.2. of the [oembed spec](https://oembed.com)
    #[serde(rename = "video")]
    Video(Video),
    /// Link type
    ///
    /// See section 2.3.4.3. of the [oembed spec](https://oembed.com)
    #[serde(rename = "link")]
    Link,
    /// Rich type
    ///
    /// See section 2.3.4.4. of the [oembed spec](https://oembed.com)
    #[serde(rename = "rich")]
    Rich(Rich),
}

/// Video type
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

/// Photo type
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

/// Rich type
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

/// oEmbed response
///
/// See the [oembed spec](https://oembed.com/#section2.3)
#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct EmbedResponse {
    #[serde(flatten)]
    pub oembed_type: EmbedType,
    #[serde(default)]
    pub version: String,
    pub title: Option<String>,
    pub author_name: Option<String>,
    pub author_url: Option<String>,
    pub provider_name: Option<String>,
    pub provider_url: Option<String>,
    pub thumbnail_url: Option<String>,
    #[serde(default)]
    #[serde(deserialize_with = "deserialize_u16_from_maybe_string")]
    pub thumbnail_width: Option<u16>,
    #[serde(default)]
    #[serde(deserialize_with = "deserialize_u16_from_maybe_string")]
    pub thumbnail_height: Option<u16>,
    #[serde(flatten)]
    pub extra: HashMap<String, Value>,
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
