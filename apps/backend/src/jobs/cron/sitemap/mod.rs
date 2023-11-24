mod presets;
mod sitemap;
mod story;
mod tag;
mod user;

pub use sitemap::*;

#[derive(Debug, Default, PartialEq)]
pub struct GenerateSitemapResponse {
    /// The total number of URLs appended to all the sitemap files.
    pub url_count: u32,
    /// The total number of sitemap files generated.
    pub file_count: u32,
}
