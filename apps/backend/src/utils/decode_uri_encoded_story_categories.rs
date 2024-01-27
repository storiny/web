use crate::constants::story_category::STORY_CATEGORY_VEC;
use anyhow::anyhow;
use itertools::Itertools;

/// Decodes the encoded categories string data and returns the unique set of valid story categories.
///
/// * `encoded_categories` - The URI encoded categories data.
pub fn decode_uri_encoded_story_categories(
    encoded_categories: &str,
) -> anyhow::Result<Vec<String>> {
    match lz_str::decompress_from_encoded_uri_component(encoded_categories) {
        None => Err(anyhow!("failed to decode the encoded categories")),
        Some(decoded_categories) => {
            let categories_str = String::from_utf16(&decoded_categories)?;
            let categories_vec: Vec<&str> = categories_str.split('|').collect();

            if categories_vec.len() > STORY_CATEGORY_VEC.len() {
                return Err(anyhow!("too many categories"));
            }

            let valid_categories: Vec<String> = categories_vec
                .into_iter()
                .unique()
                .filter(|&category| STORY_CATEGORY_VEC.contains(&category.to_string()))
                .map(|category| category.to_owned())
                .collect::<Vec<_>>();

            if valid_categories.is_empty() {
                Err(anyhow!("no valid categories found in the decoded data"))
            } else {
                Ok(valid_categories)
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::constants::story_category::StoryCategory;

    #[test]
    fn can_decode_uri_encoded_story_categories() {
        let categories_str = [StoryCategory::Travel.to_string(),
            StoryCategory::Entertainment.to_string(),
            StoryCategory::DigitalGraphics.to_string(),
            StoryCategory::Gaming.to_string(),
            StoryCategory::Lifestyle.to_string()]
        .join("|");
        let uri_encoded = lz_str::compress_to_encoded_uri_component(&categories_str);
        let decoded = decode_uri_encoded_story_categories(&uri_encoded);

        assert!(decoded.is_ok());
        assert_eq!(decoded.unwrap().len(), 5);
    }

    #[test]
    fn can_throw_on_invalid_encoded_data() {
        let uri_encoded = lz_str::compress_to_encoded_uri_component("some_invalid_data");
        let decoded = decode_uri_encoded_story_categories(&uri_encoded);
        assert!(decoded.is_err());
    }

    #[test]
    fn can_throw_on_invalid_data() {
        let decoded = decode_uri_encoded_story_categories("some_invalid_data");
        assert!(decoded.is_err());
    }

    #[test]
    fn can_throw_on_large_number_of_encoded_categories() {
        let categories_str = format!(
            "{}{}",
            StoryCategory::Travel,
            format!("|{}", StoryCategory::Travel).repeat(STORY_CATEGORY_VEC.len() + 1)
        );
        let uri_encoded = lz_str::compress_to_encoded_uri_component(&categories_str);
        let decoded = decode_uri_encoded_story_categories(&uri_encoded);

        assert!(decoded.is_err());
    }
}
