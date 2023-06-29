// @generated
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct Connection {
    #[prost(enumeration="Provider", tag="1")]
    pub provider: i32,
    #[prost(string, tag="2")]
    pub url: ::prost::alloc::string::String,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum Provider {
    Twitter = 0,
    Github = 1,
    Twitch = 2,
    Spotify = 3,
    Reddit = 4,
    Facebook = 5,
    Instagram = 6,
    Discord = 7,
    Youtube = 8,
    LinkedIn = 9,
    Figma = 10,
    Dribbble = 11,
    Snapchat = 12,
}
impl Provider {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            Provider::Twitter => "TWITTER",
            Provider::Github => "GITHUB",
            Provider::Twitch => "TWITCH",
            Provider::Spotify => "SPOTIFY",
            Provider::Reddit => "REDDIT",
            Provider::Facebook => "FACEBOOK",
            Provider::Instagram => "INSTAGRAM",
            Provider::Discord => "DISCORD",
            Provider::Youtube => "YOUTUBE",
            Provider::LinkedIn => "LINKED_IN",
            Provider::Figma => "FIGMA",
            Provider::Dribbble => "DRIBBBLE",
            Provider::Snapchat => "SNAPCHAT",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "TWITTER" => Some(Self::Twitter),
            "GITHUB" => Some(Self::Github),
            "TWITCH" => Some(Self::Twitch),
            "SPOTIFY" => Some(Self::Spotify),
            "REDDIT" => Some(Self::Reddit),
            "FACEBOOK" => Some(Self::Facebook),
            "INSTAGRAM" => Some(Self::Instagram),
            "DISCORD" => Some(Self::Discord),
            "YOUTUBE" => Some(Self::Youtube),
            "LINKED_IN" => Some(Self::LinkedIn),
            "FIGMA" => Some(Self::Figma),
            "DRIBBBLE" => Some(Self::Dribbble),
            "SNAPCHAT" => Some(Self::Snapchat),
            _ => None,
        }
    }
}
// @@protoc_insertion_point(module)
