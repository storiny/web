use lazy_regex::Regex;
use once_cell::sync::Lazy;
use phf::{
    phf_map,
    Map,
};

#[path = "chartblocks/mod.rs"]
mod chartblocks;
#[path = "codepen/mod.rs"]
mod codepen;
#[path = "codesandbox/mod.rs"]
mod codesandbox;
#[path = "coub/mod.rs"]
mod coub;
#[path = "dailymotion/mod.rs"]
mod dailymotion;
#[path = "facebook_page/mod.rs"]
mod facebook_page;
#[path = "facebook_post/mod.rs"]
mod facebook_post;
#[path = "facebook_video/mod.rs"]
mod facebook_video;
#[path = "flickr/mod.rs"]
mod flickr;
#[path = "github_gist/mod.rs"]
mod github_gist;
#[path = "instagram/mod.rs"]
mod instagram;

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

pub static PROVIDERS: &'static [Provider] = &[
    chartblocks::chartblocks_provider(),
    codepen::codepen_provider(),
    codesandbox::codesandbox_provider(),
    github_gist::github_gist_provider(),
    coub::coub_provider(),
    dailymotion::dailymotion_provider(),
    facebook_post::facebook_post_provider(),
    facebook_video::facebook_video_provider(),
    facebook_page::facebook_page_provider(),
    instagram::instagram_provider(),
    flickr::flickr_provider(),
    Provider {
        name: "Framer",
        endpoint: "api.framer.com/web/oembed",
        padding: None,
        schemas: &["framer.com/share/(.*)", "framer.com/embed/(.*)"],
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    },
    Provider {
        name: "Getty Images",
        endpoint: "embed.gettyimages.com/oembed",
        padding: None,
        schemas: &["gty.im/(.*)"],
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    },
    Provider {
        name: "Gfycat",
        endpoint: "api.gfycat.com/v1/oembed",
        padding: None,
        schemas: &["gfycat.com/(.*)", "gfycat.com/(.*)"],
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    },
    Provider {
        name: "Giphy",
        endpoint: "giphy.com/services/oembed",
        padding: None,
        schemas: sanitize_schema(&[
            "giphy.com/gifs/(.*)",
            "giphy.com/clips/(.*)",
            "gph.is/(.*)",
            "media.giphy.com/media/(.*)/giphy.gif",
        ]),
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    },
    Provider {
        name: "Hulu",
        endpoint: "hulu.com/api/oembed.json",
        padding: None,
        schemas: &["hulu.com/watch/(.*)"],
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    },
    Provider {
        name: "Kickstarter",
        endpoint: "kickstarter.com/services/oembed",
        padding: None,
        schemas: &["kickstarter.com/projects/(.*)"],
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    },
    Provider {
        name: "Lottiefiles",
        endpoint: "embed.lottiefiles.com/oembed",
        padding: None,
        schemas: &["lottiefiles.com/(.*)", "*.lottiefiles.com/(.*)"],
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    },
    Provider {
        name: "Microsoft Stream",
        endpoint: "web.microsoftstream.com/oembed",
        padding: None,
        schemas: sanitize_schema(&[
            "*.microsoftstream.com/video/(.*)",
            "*.microsoftstream.com/channel/(.*)",
        ]),
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    },
    Provider {
        name: "Miro",
        endpoint: "miro.com/api/v1/oembed",
        padding: None,
        schemas: &["miro.com/app/board/(.*)"],
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    },
    Provider {
        name: "ObservableHQ",
        endpoint: "api.observablehq.com/oembed",
        padding: None,
        schemas: sanitize_schema(&[
            "observablehq.com/@*/(.*)",
            "observablehq.com/d/(.*)",
            "observablehq.com/embed/(.*)",
        ]),
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    },
    Provider {
        name: "Pinterest",
        endpoint: "pinterest.com/oembed.json",
        padding: None,
        schemas: &["pinterest.com/(.*)"],
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    },
    Provider {
        name: "Plus Docs",
        endpoint: "app.plusdocs.com/oembed",
        padding: None,
        schemas: sanitize_schema(&[
            "app.plusdocs.com/(.*)/snapshots/(.*)",
            "app.plusdocs.com/(.*)/pages/edit/(.*)",
            "app.plusdocs.com/(.*)/pages/share/(.*)",
        ]),
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    },
    Provider {
        name: "Reddit",
        endpoint: "reddit.com/oembed",
        padding: None,
        schemas: &["reddit.com/r/(.*)/comments/(.*)/(.*)"],
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    },
    Provider {
        name: "Replit",
        endpoint: "replit.com/data/oembed",
        padding: None,
        schemas: &["repl.it/@*/(.*)", "replit.com/@*/(.*)"],
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    },
    Provider {
        name: "Runkit",
        endpoint: "embed.runkit.com/oembed",
        padding: None,
        schemas: &["embed.runkit.com/(.*)"],
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    },
    Provider {
        name: "Sketchfab",
        endpoint: "sketchfab.com/oembed",
        padding: None,
        schemas: &[
            "sketchfab.com/(.*)models/(.*)",
            "sketchfab.com/(.*)/folders/(.*)",
        ],
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    },
    Provider {
        name: "SlideShare",
        endpoint: "slideshare.net/api/oembed/2",
        padding: None,
        schemas: &["slideshare.net/(.*)/(.*)", "*.slideshare.net/(.*)/(.*)"],
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    },
    Provider {
        name: "SoundCloud",
        endpoint: "soundcloud.com/oembed",
        padding: None,
        schemas: sanitize_schema(&[
            "soundcloud.com/(.*)",
            "on.soundcloud.com/(.*)",
            "soundcloud.app.goog.gl/(.*)",
        ]),
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    },
    Provider {
        name: "Spotify",
        endpoint: "open.spotify.com/oembed",
        padding: None,
        schemas: &["open.spotify.com/(.*)", "spotify:*"],
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    },
    Provider {
        name: "TED",
        endpoint: "ted.com/services/v1/oembed.json",
        padding: None,
        schemas: &["ted.com/talks/(.*)"],
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    },
    Provider {
        name: "TikTok",
        endpoint: "tiktok.com/oembed",
        padding: None,
        schemas: &["tiktok.com/(.*)", "tiktok.com/(.*)/video/(.*)"],
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    },
    Provider {
        name: "Twitter",
        endpoint: "publish.twitter.com/oembed",
        padding: None,
        schemas: sanitize_schema(&[
            "twitter.com/(.*)",
            "twitter.com/(.*)/status/(.*)",
            "*.twitter.com/(.*)/status/(.*)",
        ]),
        supports_binary_theme: true,
        iframe_params: None,
        origin_params: Some(
            phf_map! { "align" => "center", "dnt" => "true", "theme" => "{theme}" },
        ),
    },
    Provider {
        name: "Vevo",
        endpoint: "vevo.com/oembed",
        padding: None,
        schemas: &["vevo.com/(.*)"],
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    },
    Provider {
        name: "Vimeo",
        endpoint: "vimeo.com/api/oembed.json",
        padding: None,
        schemas: sanitize_schema(&[
            "vimeo.com/(.*)",
            "vimeo.com/album/(.*)/video/(.*)",
            "vimeo.com/channels/(.*)/(.*)",
            "vimeo.com/groups/(.*)/videos/(.*)",
            "vimeo.com/ondemand/(.*)/(.*)",
            "player.vimeo.com/video/(.*)",
        ]),
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    },
    Provider {
        name: "YouTube",
        endpoint: "youtube.com/oembed",
        padding: None,
        schemas: sanitize_schema(&[
            "*.youtube.com/watch*",
            "*.youtube.com/v/(.*)",
            "*.youtube.com/playlist\\?list=*",
            "*.youtube.com/shorts*",
            "youtu.be/(.*)",
            "youtube.com/playlist\\?list=*",
        ]),
        supports_binary_theme: false,
        iframe_params: None,
        origin_params: None,
    },
];
