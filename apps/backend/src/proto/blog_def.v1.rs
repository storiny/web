// @generated
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct LeftSidebarItem {
    #[prost(string, tag="1")]
    pub id: ::prost::alloc::string::String,
    #[prost(string, tag="2")]
    pub name: ::prost::alloc::string::String,
    #[prost(string, optional, tag="3")]
    pub icon: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(uint32, tag="4")]
    pub priority: u32,
    #[prost(string, tag="5")]
    pub target: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct RightSidebarItem {
    #[prost(string, tag="1")]
    pub id: ::prost::alloc::string::String,
    #[prost(string, tag="2")]
    pub primary_text: ::prost::alloc::string::String,
    #[prost(string, optional, tag="3")]
    pub secondary_text: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="4")]
    pub icon: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(uint32, tag="5")]
    pub priority: u32,
    #[prost(string, tag="6")]
    pub target: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetBlogRequest {
    #[prost(string, tag="1")]
    pub slug: ::prost::alloc::string::String,
    #[prost(string, optional, tag="2")]
    pub current_user_id: ::core::option::Option<::prost::alloc::string::String>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetBlogResponse {
    #[prost(string, tag="1")]
    pub id: ::prost::alloc::string::String,
    #[prost(string, tag="2")]
    pub name: ::prost::alloc::string::String,
    #[prost(string, tag="3")]
    pub slug: ::prost::alloc::string::String,
    #[prost(string, optional, tag="4")]
    pub description: ::core::option::Option<::prost::alloc::string::String>,
    /// Banner
    #[prost(string, optional, tag="5")]
    pub banner_id: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="6")]
    pub banner_hex: ::core::option::Option<::prost::alloc::string::String>,
    /// Logo
    #[prost(string, optional, tag="7")]
    pub logo_id: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="8")]
    pub logo_hex: ::core::option::Option<::prost::alloc::string::String>,
    /// Newsletter splash
    #[prost(string, optional, tag="9")]
    pub newsletter_splash_id: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="10")]
    pub newsletter_splash_hex: ::core::option::Option<::prost::alloc::string::String>,
    /// Mark
    #[prost(string, optional, tag="11")]
    pub mark_light: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="12")]
    pub mark_dark: ::core::option::Option<::prost::alloc::string::String>,
    /// Font
    #[prost(string, optional, tag="13")]
    pub font_code: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="14")]
    pub font_primary: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="15")]
    pub font_secondary: ::core::option::Option<::prost::alloc::string::String>,
    /// Theme
    #[prost(string, optional, tag="16")]
    pub default_theme: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(bool, tag="17")]
    pub force_theme: bool,
    #[prost(string, optional, tag="18")]
    pub favicon: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(bool, tag="19")]
    pub hide_storiny_branding: bool,
    #[prost(bool, tag="20")]
    pub is_homepage_large_layout: bool,
    #[prost(bool, tag="21")]
    pub is_story_minimal_layout: bool,
    /// SEO
    #[prost(string, optional, tag="22")]
    pub seo_description: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="23")]
    pub seo_title: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="24")]
    pub preview_image: ::core::option::Option<::prost::alloc::string::String>,
    /// Boolean flags
    #[prost(bool, tag="25")]
    pub is_following: bool,
    #[prost(bool, tag="26")]
    pub is_owner: bool,
    #[prost(bool, tag="27")]
    pub is_editor: bool,
    #[prost(bool, tag="28")]
    pub is_writer: bool,
    /// Connections
    #[prost(string, optional, tag="29")]
    pub website_url: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="30")]
    pub public_email: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="31")]
    pub github_id: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="32")]
    pub instagram_id: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="33")]
    pub linkedin_id: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="34")]
    pub youtube_id: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="35")]
    pub twitter_id: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="36")]
    pub twitch_id: ::core::option::Option<::prost::alloc::string::String>,
    /// Other props
    #[prost(string, optional, tag="37")]
    pub domain: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, tag="38")]
    pub created_at: ::prost::alloc::string::String,
    #[prost(string, tag="39")]
    pub category: ::prost::alloc::string::String,
    #[prost(string, tag="40")]
    pub user_id: ::prost::alloc::string::String,
    #[prost(string, tag="41")]
    pub rsb_items_label: ::prost::alloc::string::String,
    #[prost(message, repeated, tag="42")]
    pub lsb_items: ::prost::alloc::vec::Vec<LeftSidebarItem>,
    #[prost(message, repeated, tag="43")]
    pub rsb_items: ::prost::alloc::vec::Vec<RightSidebarItem>,
}
// @@protoc_insertion_point(module)
