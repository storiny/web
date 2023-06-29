// @generated
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetTagRequest {
    #[prost(string, tag="1")]
    pub name: ::prost::alloc::string::String,
    #[prost(string, optional, tag="2")]
    pub current_user_id: ::core::option::Option<::prost::alloc::string::String>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetTagResponse {
    /// Base props
    #[prost(string, tag="1")]
    pub id: ::prost::alloc::string::String,
    #[prost(string, tag="2")]
    pub name: ::prost::alloc::string::String,
    #[prost(int32, tag="3")]
    pub story_count: i32,
    #[prost(int32, tag="4")]
    pub follower_count: i32,
    #[prost(string, tag="5")]
    pub created_at: ::prost::alloc::string::String,
    /// User specific props
    #[prost(bool, optional, tag="6")]
    pub is_following: ::core::option::Option<bool>,
}
// @@protoc_insertion_point(module)
