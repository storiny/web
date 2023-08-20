// @generated
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct Story {
    #[prost(string, tag="1")]
    pub id: ::prost::alloc::string::String,
    #[prost(string, tag="2")]
    pub title: ::prost::alloc::string::String,
    #[prost(string, optional, tag="3")]
    pub slug: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="4")]
    pub description: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="5")]
    pub splash_id: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="6")]
    pub splash_hex: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(uint64, tag="7")]
    pub like_count: u64,
    #[prost(uint64, tag="8")]
    pub read_count: u64,
    #[prost(uint32, tag="9")]
    pub word_count: u32,
    #[prost(string, tag="10")]
    pub created_at: ::prost::alloc::string::String,
    #[prost(string, optional, tag="11")]
    pub edited_at: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="12")]
    pub published_at: ::core::option::Option<::prost::alloc::string::String>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct Draft {
    #[prost(string, tag="1")]
    pub id: ::prost::alloc::string::String,
    #[prost(string, tag="2")]
    pub title: ::prost::alloc::string::String,
    #[prost(string, optional, tag="5")]
    pub splash_id: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="6")]
    pub splash_hex: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(uint32, tag="9")]
    pub word_count: u32,
    #[prost(string, tag="10")]
    pub created_at: ::prost::alloc::string::String,
    #[prost(string, optional, tag="11")]
    pub edited_at: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="12")]
    pub published_at: ::core::option::Option<::prost::alloc::string::String>,
}
// Drafts information request

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetDraftsInfoRequest {
    #[prost(string, tag="1")]
    pub id: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetDraftsInfoResponse {
    #[prost(uint32, tag="1")]
    pub pending_draft_count: u32,
    #[prost(uint32, tag="2")]
    pub deleted_draft_count: u32,
    #[prost(message, optional, tag="3")]
    pub latest_draft: ::core::option::Option<Draft>,
}
// Stories information request

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetStoriesInfoRequest {
    #[prost(string, tag="1")]
    pub id: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetStoriesInfoResponse {
    #[prost(uint32, tag="1")]
    pub published_story_count: u32,
    #[prost(uint32, tag="2")]
    pub deleted_story_count: u32,
}
// @@protoc_insertion_point(module)
