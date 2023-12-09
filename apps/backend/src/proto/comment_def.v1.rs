// @generated
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetCommentRequest {
    #[prost(string, tag="1")]
    pub id: ::prost::alloc::string::String,
    #[prost(string, optional, tag="2")]
    pub current_user_id: ::core::option::Option<::prost::alloc::string::String>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetCommentResponse {
    #[prost(string, tag="1")]
    pub id: ::prost::alloc::string::String,
    #[prost(string, tag="2")]
    pub content: ::prost::alloc::string::String,
    #[prost(string, tag="3")]
    pub rendered_content: ::prost::alloc::string::String,
    #[prost(string, tag="4")]
    pub user_id: ::prost::alloc::string::String,
    #[prost(string, tag="5")]
    pub story_id: ::prost::alloc::string::String,
    #[prost(string, tag="6")]
    pub story_slug: ::prost::alloc::string::String,
    #[prost(string, tag="7")]
    pub story_writer_username: ::prost::alloc::string::String,
    #[prost(bool, tag="8")]
    pub hidden: bool,
    #[prost(string, optional, tag="9")]
    pub edited_at: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, tag="10")]
    pub created_at: ::prost::alloc::string::String,
    #[prost(uint32, tag="11")]
    pub like_count: u32,
    #[prost(uint32, tag="12")]
    pub reply_count: u32,
    #[prost(message, optional, tag="13")]
    pub user: ::core::option::Option<super::super::user_def::v1::BareUser>,
    /// User specific props
    #[prost(bool, tag="14")]
    pub is_liked: bool,
}
// @@protoc_insertion_point(module)
