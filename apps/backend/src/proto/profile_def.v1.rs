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
    pub status: ::core::option::Option<super::super::user_def::v1::ExtendedStatus>,
    #[prost(string, optional, tag="5")]
    pub bio: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="6")]
    pub rendered_bio: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="7")]
    pub avatar_id: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="8")]
    pub avatar_hex: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="9")]
    pub banner_id: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="10")]
    pub banner_hex: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, tag="11")]
    pub location: ::prost::alloc::string::String,
    #[prost(string, tag="12")]
    pub created_at: ::prost::alloc::string::String,
    #[prost(uint32, tag="13")]
    pub public_flags: u32,
    #[prost(uint32, tag="14")]
    pub story_count: u32,
    #[prost(uint32, tag="15")]
    pub follower_count: u32,
    /// Following and friend lists can be private (optional=private)
    #[prost(uint32, optional, tag="16")]
    pub following_count: ::core::option::Option<u32>,
    #[prost(uint32, optional, tag="17")]
    pub friend_count: ::core::option::Option<u32>,
    #[prost(bool, tag="18")]
    pub is_private: bool,
    #[prost(message, repeated, tag="19")]
    pub connections: ::prost::alloc::vec::Vec<super::super::connection_def::v1::Connection>,
    /// User specific props
    #[prost(bool, tag="20")]
    pub is_following: bool,
    #[prost(bool, tag="21")]
    pub is_follower: bool,
    #[prost(bool, tag="22")]
    pub is_friend: bool,
    #[prost(bool, tag="23")]
    pub is_subscribed: bool,
    #[prost(bool, tag="24")]
    pub is_friend_request_sent: bool,
    #[prost(bool, tag="25")]
    pub is_blocked_by_user: bool,
    #[prost(bool, tag="26")]
    pub is_blocked: bool,
    #[prost(bool, tag="27")]
    pub is_muted: bool,
    #[prost(bool, tag="28")]
    pub is_self: bool,
    #[prost(bool, tag="29")]
    pub is_plus_member: bool,
}
// @@protoc_insertion_point(module)
