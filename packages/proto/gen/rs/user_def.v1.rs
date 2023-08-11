// @generated
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct Status {
    #[prost(string, optional, tag="1")]
    pub emoji: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="2")]
    pub text: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="3")]
    pub expires_at: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(enumeration="StatusVisibility", tag="4")]
    pub visibility: i32,
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
// Get user credentials

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetUserCredentialsRequest {
    /// User ID
    #[prost(string, tag="1")]
    pub id: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetUserCredentialsResponse {
    #[prost(bool, tag="1")]
    pub has_password: bool,
    #[prost(bool, tag="2")]
    pub mfa_enabled: bool,
    #[prost(string, optional, tag="3")]
    pub login_apple_id: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(string, optional, tag="4")]
    pub login_google_id: ::core::option::Option<::prost::alloc::string::String>,
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
            StatusVisibility::Unspecified => "UNSPECIFIED",
            StatusVisibility::Global => "GLOBAL",
            StatusVisibility::Followers => "FOLLOWERS",
            StatusVisibility::Friends => "FRIENDS",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "UNSPECIFIED" => Some(Self::Unspecified),
            "GLOBAL" => Some(Self::Global),
            "FOLLOWERS" => Some(Self::Followers),
            "FRIENDS" => Some(Self::Friends),
            _ => None,
        }
    }
}
// @@protoc_insertion_point(module)
