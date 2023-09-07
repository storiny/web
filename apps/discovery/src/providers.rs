use lazy_regex::Regex;
use once_cell::sync::Lazy;
use phf::Map;

mod chartblocks;
mod codepen;
mod codesandbox;
mod coub;
mod dailymotion;
mod facebook_page;
mod facebook_post;
mod facebook_video;
mod flickr;
mod framer;
mod getty_images;
mod gfycat;
mod giphy;
mod github_gist;
mod hulu;
mod instagram;
mod kickstarter;
mod lottiefiles;
mod microsoft_stream;
mod miro;
mod observablehq;
mod pinterest;
mod plusdocs;
mod reddit;
mod replit;
mod runkit;
mod sketchfab;
mod slideshare;
mod soundcloud;
mod spotify;
mod ted;
mod tiktok;
mod twitter;
mod vevo;
mod vimeo;
mod youtube;

/// Embed provider
pub struct Provider {
    /// Name of the provider
    pub name: &'static str,
    /// Provider oembed enpoint
    pub endpoint: &'static str,
    /// Optional aspect ratio padding for the embed node
    pub padding: Option<f64>,
    /// String input matchers
    pub schemas: &'static [&'static Lazy<Regex>],
    /// Boolean flag indicating whether the provider supports
    /// both `light` and `dark` modes
    pub supports_binary_theme: bool,
    /// DOM attributes for the embed iframe element
    pub iframe_params: Option<Map<&'static str, &'static str>>,
    /// Optional key-value pairs to append to the provider endpoint URL
    pub origin_params: Option<Map<&'static str, &'static str>>,
}

/// Collection of all the supported providers
pub static PROVIDERS: &'static [&'static Provider] = &[
    &chartblocks::CHARTBLOCKS_PROVIDER,
    &codepen::CODEPEN_PROVIDER,
    &codesandbox::CODESANDBOX_PROVIDER,
    &coub::COUB_PROVIDER,
    &dailymotion::DAILYMOTION_PROVIDER,
    &facebook_page::FACEBOOK_PAGE_PROVIDER,
    &facebook_video::FACEBOOK_VIDEO_PROVIDER,
    &facebook_post::FACEBOOK_POST_PROVIDER,
    &flickr::FLICKR_PROVIDER,
    &framer::FRAMER_PROVIDER,
    &getty_images::GETTY_IMAGES_PROVIDER,
    &gfycat::GFYCAT_PROVIDER,
    &giphy::GIPHY_PROVIDER,
    &github_gist::GITHUB_GIST_PROVIDER,
    &hulu::HULU_PROVIDER,
    &instagram::INSTAGRAM_PROVIDER,
    &kickstarter::KICKSTARTER_PROVIDER,
    &lottiefiles::LOTTIEFILES_PROVIDER,
    &microsoft_stream::MICROSOFT_STREAM_PROVIDER,
    &miro::MIRO_PROVIDER,
    &observablehq::OBSERVABLEHQ_PROVIDER,
    &pinterest::PINTEREST_PROVIDER,
    &plusdocs::PLUSDOCS_PROVIDER,
    &reddit::REDDIT_PROVIDER,
    &replit::REPLIT_PROVIDER,
    &runkit::RUNKIT_PROVIDER,
    &sketchfab::SKETCHFAB_PROVIDER,
    &slideshare::SLIDESHARE_PROVIDER,
    &soundcloud::SOUNDCLOUD_PROVIDER,
    &spotify::SPOTIFY_PROVIDER,
    &ted::TED_PROVIDER,
    &tiktok::TIKTOK_PROVIDER,
    &twitter::TWITTER_PROVIDER,
    &vevo::VEVO_PROVIDER,
    &vimeo::VIMEO_PROVIDER,
    &youtube::YOUTUBE_PROVIDER,
];
