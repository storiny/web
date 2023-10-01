// @generated
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetCommentRequest {
    #[prost(string, tag="1")]
    pub id: ::prost::alloc::string::String,
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
    #[prost(bool, tag="6")]
    pub hidden: bool,
    #[prost(string, optional, tag="7")]
    pub edited_at: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, tag="8")]
    pub created_at: ::prost::alloc::string::String,
    #[prost(uint32, tag="9")]
    pub like_count: u32,
    #[prost(uint32, tag="10")]
    pub reply_count: u32,
    #[prost(message, optional, tag="11")]
    pub user: ::core::option::Option<super::super::user_def::v1::User>,
    /// User specific props
    #[prost(bool, optional, tag="12")]
    pub is_liked: ::core::option::Option<bool>,
}
// @@protoc_insertion_point(module)
