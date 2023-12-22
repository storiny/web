use crate::constants::image_size::ImageSize;

/// Generates the CDN URL for the provided media key (from the `uploads` bucket).
///
/// * `cdn_server_url` - The URL of the public CDN server.
/// * `key` - The key of the object.
/// * `image_size` - An optional image size parameter. Defaults to `auto`.
pub fn get_cdn_url(cdn_server_url: &str, key: &str, image_size: Option<ImageSize>) -> String {
    format!(
        "{cdn_server_url}/uploads/w@{}/{key}",
        if let Some(size) = image_size {
            size.to_string()
        } else {
            "auto".to_string()
        },
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn can_return_cdn_url() {
        let cdn_url = get_cdn_url("https://cdn.storiny.com", "some_key.ext", None);
        assert_eq!(
            cdn_url,
            "https://cdn.storiny.com/uploads/w@auto/some_key.ext".to_string()
        );
    }

    #[test]
    fn can_return_cdn_url_with_custom_image_size() {
        let cdn_url = get_cdn_url(
            "https://cdn.storiny.com",
            "some_key.ext",
            Some(ImageSize::W64),
        );

        assert_eq!(
            cdn_url,
            format!(
                "https://cdn.storiny.com/uploads/w@{}/some_key.ext",
                ImageSize::W64,
            )
        );
    }
}
