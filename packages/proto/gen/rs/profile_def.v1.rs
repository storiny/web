// @generated
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetProfileRequest {
    #[prost(string, tag="1")]
    pub username: ::prost::alloc::string::String,
    #[prost(string, optional, tag="2")]
    pub current_user_id: ::core::option::Option<::prost::alloc::string::String>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetProfileResponse {
    /// Base props
    #[prost(string, tag="1")]
    pub id: ::prost::alloc::string::String,
    #[prost(string, tag="2")]
    pub name: ::prost::alloc::string::String,
    #[prost(string, tag="3")]
    pub username: ::prost::alloc::string::String,
    #[prost(message, optional, tag="4")]
    pub status: ::core::option::Option<super::super::user_def::v1::Status>,
    #[prost(string, optional, tag="5")]
    pub bio: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="6")]
    pub location: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="7")]
    pub avatar_id: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="8")]
    pub avatar_hex: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="9")]
    pub banner_id: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="10")]
    pub banner_hex: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, tag="11")]
    pub created_at: ::prost::alloc::string::String,
    #[prost(int64, tag="12")]
    pub public_flags: i64,
    #[prost(int32, tag="13")]
    pub story_count: i32,
    #[prost(int32, tag="14")]
    pub follower_count: i32,
    /// Following and friend lists can be private
    #[prost(int32, optional, tag="15")]
    pub following_count: ::core::option::Option<i32>,
    #[prost(int32, optional, tag="16")]
    pub friend_count: ::core::option::Option<i32>,
    #[prost(bool, tag="17")]
    pub is_private: bool,
    #[prost(message, repeated, tag="18")]
    pub connections: ::prost::alloc::vec::Vec<super::super::connection_def::v1::Connection>,
    /// User specific props
    #[prost(bool, optional, tag="19")]
    pub is_following: ::core::option::Option<bool>,
    #[prost(bool, optional, tag="20")]
    pub is_follower: ::core::option::Option<bool>,
    #[prost(bool, optional, tag="21")]
    pub is_friend: ::core::option::Option<bool>,
    #[prost(bool, optional, tag="22")]
    pub is_subscribed: ::core::option::Option<bool>,
    #[prost(bool, optional, tag="23")]
    pub is_friend_request_sent: ::core::option::Option<bool>,
    #[prost(bool, optional, tag="24")]
    pub is_blocked_by_user: ::core::option::Option<bool>,
    #[prost(bool, optional, tag="25")]
    pub is_blocking: ::core::option::Option<bool>,
    #[prost(bool, optional, tag="26")]
    pub is_muted: ::core::option::Option<bool>,
    #[prost(bool, optional, tag="27")]
    pub is_self: ::core::option::Option<bool>,
}
// @@protoc_insertion_point(module)
