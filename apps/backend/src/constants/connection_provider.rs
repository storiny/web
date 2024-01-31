use strum_macros::Display;

/// A connection provider.
#[derive(Display, Debug)]
pub enum ConnectionProvider {
    #[strum(serialize = "discord")]
    Discord,
    #[strum(serialize = "dribbble")]
    Dribbble,
    #[strum(serialize = "figma")]
    Figma,
    #[strum(serialize = "github")]
    GitHub,
    #[strum(serialize = "linkedin")]
    LinkedIn,
    #[strum(serialize = "reddit")]
    Reddit,
    #[strum(serialize = "snapchat")]
    Snapchat,
    #[strum(serialize = "spotify")]
    Spotify,
    #[strum(serialize = "twitch")]
    Twitch,
    #[strum(serialize = "youtube")]
    YouTube,
}
