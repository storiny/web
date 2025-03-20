// @generated
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct BareStatus {
    #[prost(string, optional, tag="1")]
    pub emoji: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="2")]
    pub text: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="3")]
    pub expires_at: ::core::option::Option<::prost::alloc::string::String>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ExtendedStatus {
    #[prost(string, optional, tag="1")]
    pub emoji: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="2")]
    pub text: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="3")]
    pub expires_at: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(enumeration="StatusDuration", tag="4")]
    pub duration: i32,
    #[prost(enumeration="StatusVisibility", tag="5")]
    pub visibility: i32,
}
// User

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct BareUser {
    #[prost(string, tag="1")]
    pub id: ::prost::alloc::string::String,
    #[prost(string, tag="2")]
    pub name: ::prost::alloc::string::String,
    #[prost(string, tag="3")]
    pub username: ::prost::alloc::string::String,
    #[prost(string, optional, tag="4")]
    pub avatar_id: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="5")]
    pub avatar_hex: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(uint32, tag="6")]
    pub public_flags: u32,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ExtendedUser {
    #[prost(string, tag="1")]
    pub id: ::prost::alloc::string::String,
    #[prost(string, tag="2")]
    pub name: ::prost::alloc::string::String,
    #[prost(string, tag="3")]
    pub username: ::prost::alloc::string::String,
    #[prost(string, tag="4")]
    pub rendered_bio: ::prost::alloc::string::String,
    #[prost(string, optional, tag="5")]
    pub avatar_id: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="6")]
    pub avatar_hex: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(uint32, tag="7")]
    pub public_flags: u32,
    #[prost(bool, tag="8")]
    pub is_private: bool,
    #[prost(string, tag="9")]
    pub location: ::prost::alloc::string::String,
    #[prost(string, tag="10")]
    pub created_at: ::prost::alloc::string::String,
    #[prost(uint32, tag="11")]
    pub follower_count: u32,
    #[prost(message, optional, tag="12")]
    pub status: ::core::option::Option<BareStatus>,
    /// User specific props
    #[prost(bool, tag="13")]
    pub is_self: bool,
    #[prost(bool, tag="14")]
    pub is_following: bool,
    #[prost(bool, tag="15")]
    pub is_follower: bool,
    #[prost(bool, tag="16")]
    pub is_friend: bool,
    #[prost(bool, tag="17")]
    pub is_blocked_by_user: bool,
}
// Get user ID

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetUserIdRequest {
    /// Token from the session cookie
    #[prost(string, tag="1")]
    pub token: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetUserIdResponse {
    #[prost(string, tag="1")]
    pub id: ::prost::alloc::string::String,
}
// Get username

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetUsernameRequest {
    #[prost(string, tag="1")]
    pub user_id: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetUsernameResponse {
    #[prost(string, tag="1")]
    pub username: ::prost::alloc::string::String,
}
// Get user relations info

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetUserRelationsInfoRequest {
    #[prost(string, tag="1")]
    pub user_id: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetUserRelationsInfoResponse {
    #[prost(uint32, tag="1")]
    pub follower_count: u32,
    #[prost(uint32, tag="2")]
    pub following_count: u32,
    #[prost(uint32, tag="3")]
    pub friend_count: u32,
    #[prost(uint32, tag="4")]
    pub pending_friend_request_count: u32,
}
// Get user blocks count

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetUserBlockCountRequest {
    #[prost(string, tag="1")]
    pub user_id: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetUserBlockCountResponse {
    #[prost(uint32, tag="1")]
    pub block_count: u32,
}
// Get user mutes count

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetUserMuteCountRequest {
    #[prost(string, tag="1")]
    pub user_id: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetUserMuteCountResponse {
    #[prost(uint32, tag="1")]
    pub mute_count: u32,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum StatusVisibility {
    Unspecified = 0,
    Global = 1,
    Followers = 2,
    Friends = 3,
}
impl StatusVisibility {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            StatusVisibility::Unspecified => "STATUS_VISIBILITY_UNSPECIFIED",
            StatusVisibility::Global => "STATUS_VISIBILITY_GLOBAL",
            StatusVisibility::Followers => "STATUS_VISIBILITY_FOLLOWERS",
            StatusVisibility::Friends => "STATUS_VISIBILITY_FRIENDS",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "STATUS_VISIBILITY_UNSPECIFIED" => Some(Self::Unspecified),
            "STATUS_VISIBILITY_GLOBAL" => Some(Self::Global),
            "STATUS_VISIBILITY_FOLLOWERS" => Some(Self::Followers),
            "STATUS_VISIBILITY_FRIENDS" => Some(Self::Friends),
            _ => None,
        }
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum StatusDuration {
    Unspecified = 0,
    Never = 1,
    Min30 = 2,
    Min60 = 3,
    Hr4 = 4,
    Day1 = 5,
}
impl StatusDuration {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            StatusDuration::Unspecified => "STATUS_DURATION_UNSPECIFIED",
            StatusDuration::Never => "STATUS_DURATION_NEVER",
            StatusDuration::Min30 => "STATUS_DURATION_MIN_30",
            StatusDuration::Min60 => "STATUS_DURATION_MIN_60",
            StatusDuration::Hr4 => "STATUS_DURATION_HR_4",
            StatusDuration::Day1 => "STATUS_DURATION_DAY_1",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "STATUS_DURATION_UNSPECIFIED" => Some(Self::Unspecified),
            "STATUS_DURATION_NEVER" => Some(Self::Never),
            "STATUS_DURATION_MIN_30" => Some(Self::Min30),
            "STATUS_DURATION_MIN_60" => Some(Self::Min60),
            "STATUS_DURATION_HR_4" => Some(Self::Hr4),
            "STATUS_DURATION_DAY_1" => Some(Self::Day1),
            _ => None,
        }
    }
}
// @@protoc_insertion_point(module)
