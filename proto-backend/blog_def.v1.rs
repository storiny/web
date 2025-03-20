// @generated
// Blog

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct BareBlog {
    #[prost(string, tag="1")]
    pub id: ::prost::alloc::string::String,
    #[prost(string, tag="2")]
    pub slug: ::prost::alloc::string::String,
    #[prost(string, optional, tag="3")]
    pub domain: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, tag="4")]
    pub name: ::prost::alloc::string::String,
    #[prost(string, optional, tag="5")]
    pub logo_id: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="6")]
    pub logo_hex: ::core::option::Option<::prost::alloc::string::String>,
}
// Main blog request

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct LeftSidebarItem {
    #[prost(string, tag="1")]
    pub id: ::prost::alloc::string::String,
    #[prost(string, tag="2")]
    pub name: ::prost::alloc::string::String,
    #[prost(string, optional, tag="3")]
    pub icon: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, tag="4")]
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
    #[prost(string, tag="5")]
    pub target: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetBlogRequest {
    #[prost(string, tag="1")]
    pub identifier: ::prost::alloc::string::String,
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
    #[prost(bool, tag="29")]
    pub is_external: bool,
    #[prost(bool, tag="30")]
    pub has_plus_features: bool,
    /// Connections
    #[prost(string, optional, tag="31")]
    pub website_url: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="32")]
    pub public_email: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="33")]
    pub github_url: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="34")]
    pub instagram_url: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="35")]
    pub linkedin_url: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="36")]
    pub youtube_url: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="37")]
    pub twitter_url: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="38")]
    pub twitch_url: ::core::option::Option<::prost::alloc::string::String>,
    /// Other props
    #[prost(string, optional, tag="39")]
    pub domain: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, tag="40")]
    pub created_at: ::prost::alloc::string::String,
    #[prost(string, tag="41")]
    pub category: ::prost::alloc::string::String,
    #[prost(string, tag="42")]
    pub user_id: ::prost::alloc::string::String,
    #[prost(string, tag="43")]
    pub rsb_items_label: ::prost::alloc::string::String,
    #[prost(message, repeated, tag="44")]
    pub lsb_items: ::prost::alloc::vec::Vec<LeftSidebarItem>,
    #[prost(message, repeated, tag="45")]
    pub rsb_items: ::prost::alloc::vec::Vec<RightSidebarItem>,
}
// Blog archive request

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ArchiveTimeline {
    #[prost(uint32, tag="1")]
    pub year: u32,
    #[prost(uint32, repeated, tag="2")]
    pub active_months: ::prost::alloc::vec::Vec<u32>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetBlogArchiveRequest {
    #[prost(string, tag="1")]
    pub identifier: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetBlogArchiveResponse {
    #[prost(uint32, tag="1")]
    pub story_count: u32,
    #[prost(message, repeated, tag="2")]
    pub timeline: ::prost::alloc::vec::Vec<ArchiveTimeline>,
}
// Get user blogs info

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetUserBlogsInfoRequest {
    #[prost(string, tag="1")]
    pub user_id: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetUserBlogsInfoResponse {
    #[prost(uint32, tag="1")]
    pub blog_count: u32,
    #[prost(uint32, tag="2")]
    pub pending_blog_request_count: u32,
    #[prost(bool, tag="3")]
    pub can_create_blog: bool,
}
// Blog pending stories info

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetBlogPendingStoryCountRequest {
    #[prost(string, tag="1")]
    pub identifier: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetBlogPendingStoryCountResponse {
    #[prost(uint32, tag="1")]
    pub pending_story_count: u32,
}
// Blog published stories info

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetBlogPublishedStoryCountRequest {
    #[prost(string, tag="1")]
    pub identifier: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetBlogPublishedStoryCountResponse {
    #[prost(uint32, tag="1")]
    pub published_story_count: u32,
}
// Blog editors info

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetBlogEditorsInfoRequest {
    #[prost(string, tag="1")]
    pub identifier: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetBlogEditorsInfoResponse {
    #[prost(uint32, tag="1")]
    pub editor_count: u32,
    #[prost(uint32, tag="2")]
    pub pending_editor_request_count: u32,
}
// Blog writers info

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetBlogWritersInfoRequest {
    #[prost(string, tag="1")]
    pub identifier: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetBlogWritersInfoResponse {
    #[prost(uint32, tag="1")]
    pub writer_count: u32,
    #[prost(uint32, tag="2")]
    pub pending_writer_request_count: u32,
}
// Blog newsletter info

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetBlogNewsletterInfoRequest {
    #[prost(string, tag="1")]
    pub identifier: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetBlogNewsletterInfoResponse {
    #[prost(uint32, tag="1")]
    pub subscriber_count: u32,
}
// Blog sitemap

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetBlogSitemapRequest {
    #[prost(string, tag="1")]
    pub identifier: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetBlogSitemapResponse {
    #[prost(string, tag="1")]
    pub content: ::prost::alloc::string::String,
}
// Blog newsletter

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetBlogNewsletterRequest {
    #[prost(string, tag="1")]
    pub identifier: ::prost::alloc::string::String,
    #[prost(string, optional, tag="2")]
    pub current_user_id: ::core::option::Option<::prost::alloc::string::String>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetBlogNewsletterResponse {
    #[prost(string, tag="1")]
    pub id: ::prost::alloc::string::String,
    #[prost(string, tag="2")]
    pub name: ::prost::alloc::string::String,
    #[prost(string, optional, tag="3")]
    pub description: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="4")]
    pub newsletter_splash_id: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="5")]
    pub newsletter_splash_hex: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(message, optional, tag="6")]
    pub user: ::core::option::Option<super::super::user_def::v1::BareUser>,
    #[prost(bool, tag="7")]
    pub is_subscribed: bool,
}
// @@protoc_insertion_point(module)
