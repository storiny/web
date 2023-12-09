// @generated
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct Connection {
    #[prost(enumeration = "Provider", tag = "1")]
    pub provider: i32,
    #[prost(string, tag = "2")]
    pub url: ::prost::alloc::string::String,
    #[prost(string, tag = "3")]
    pub display_name: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ConnectionSetting {
    #[prost(string, tag = "1")]
    pub id: ::prost::alloc::string::String,
    #[prost(enumeration = "Provider", tag = "2")]
    pub provider: i32,
    #[prost(bool, tag = "3")]
    pub hidden: bool,
    #[prost(string, tag = "4")]
    pub display_name: ::prost::alloc::string::String,
    #[prost(string, tag = "5")]
    pub url: ::prost::alloc::string::String,
    #[prost(string, tag = "6")]
    pub created_at: ::prost::alloc::string::String,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum Provider {
    Unspecified = 0,
    Twitter = 1,
    Github = 2,
    Twitch = 3,
    Spotify = 4,
    Reddit = 5,
    Facebook = 6,
    Instagram = 7,
    Discord = 8,
    Youtube = 9,
    LinkedIn = 10,
    Figma = 11,
    Dribbble = 12,
    Snapchat = 13,
}
impl Provider {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            Provider::Unspecified => "PROVIDER_UNSPECIFIED",
            Provider::Twitter => "PROVIDER_TWITTER",
            Provider::Github => "PROVIDER_GITHUB",
            Provider::Twitch => "PROVIDER_TWITCH",
            Provider::Spotify => "PROVIDER_SPOTIFY",
            Provider::Reddit => "PROVIDER_REDDIT",
            Provider::Facebook => "PROVIDER_FACEBOOK",
            Provider::Instagram => "PROVIDER_INSTAGRAM",
            Provider::Discord => "PROVIDER_DISCORD",
            Provider::Youtube => "PROVIDER_YOUTUBE",
            Provider::LinkedIn => "PROVIDER_LINKED_IN",
            Provider::Figma => "PROVIDER_FIGMA",
            Provider::Dribbble => "PROVIDER_DRIBBBLE",
            Provider::Snapchat => "PROVIDER_SNAPCHAT",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "PROVIDER_UNSPECIFIED" => Some(Self::Unspecified),
            "PROVIDER_TWITTER" => Some(Self::Twitter),
            "PROVIDER_GITHUB" => Some(Self::Github),
            "PROVIDER_TWITCH" => Some(Self::Twitch),
            "PROVIDER_SPOTIFY" => Some(Self::Spotify),
            "PROVIDER_REDDIT" => Some(Self::Reddit),
            "PROVIDER_FACEBOOK" => Some(Self::Facebook),
            "PROVIDER_INSTAGRAM" => Some(Self::Instagram),
            "PROVIDER_DISCORD" => Some(Self::Discord),
            "PROVIDER_YOUTUBE" => Some(Self::Youtube),
            "PROVIDER_LINKED_IN" => Some(Self::LinkedIn),
            "PROVIDER_FIGMA" => Some(Self::Figma),
            "PROVIDER_DRIBBBLE" => Some(Self::Dribbble),
            "PROVIDER_SNAPCHAT" => Some(Self::Snapchat),
            _ => None,
        }
    }
}
// @@protoc_insertion_point(module)
