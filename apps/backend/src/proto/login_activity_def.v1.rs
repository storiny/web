// @generated
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct Device {
    #[prost(string, tag="1")]
    pub display_name: ::prost::alloc::string::String,
    #[prost(enumeration="DeviceType", tag="2")]
    pub r#type: i32,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct Location {
    #[prost(string, tag="1")]
    pub display_name: ::prost::alloc::string::String,
    #[prost(double, optional, tag="2")]
    pub lat: ::core::option::Option<f64>,
    #[prost(double, optional, tag="3")]
    pub lng: ::core::option::Option<f64>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct Login {
    #[prost(string, tag="1")]
    pub id: ::prost::alloc::string::String,
    #[prost(message, optional, tag="2")]
    pub device: ::core::option::Option<Device>,
    #[prost(message, optional, tag="3")]
    pub location: ::core::option::Option<Location>,
    #[prost(string, optional, tag="4")]
    pub domain: ::core::option::Option<::prost::alloc::string::String>,
    #[prost(bool, tag="5")]
    pub is_active: bool,
    #[prost(string, tag="6")]
    pub created_at: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetLoginActivityRequest {
    /// Token from the session cookie (used to determine if the current device is active)
    #[prost(string, tag="1")]
    pub token: ::prost::alloc::string::String,
    /// User ID
    #[prost(string, tag="2")]
    pub user_id: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetLoginActivityResponse {
    #[prost(message, optional, tag="1")]
    pub recent: ::core::option::Option<Login>,
    #[prost(message, repeated, tag="2")]
    pub logins: ::prost::alloc::vec::Vec<Login>,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum DeviceType {
    Unspecified = 0,
    Computer = 1,
    Mobile = 2,
    Tablet = 3,
    Unknown = 4,
}
impl DeviceType {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            DeviceType::Unspecified => "DEVICE_TYPE_UNSPECIFIED",
            DeviceType::Computer => "DEVICE_TYPE_COMPUTER",
            DeviceType::Mobile => "DEVICE_TYPE_MOBILE",
            DeviceType::Tablet => "DEVICE_TYPE_TABLET",
            DeviceType::Unknown => "DEVICE_TYPE_UNKNOWN",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "DEVICE_TYPE_UNSPECIFIED" => Some(Self::Unspecified),
            "DEVICE_TYPE_COMPUTER" => Some(Self::Computer),
            "DEVICE_TYPE_MOBILE" => Some(Self::Mobile),
            "DEVICE_TYPE_TABLET" => Some(Self::Tablet),
            "DEVICE_TYPE_UNKNOWN" => Some(Self::Unknown),
            _ => None,
        }
    }
}
// @@protoc_insertion_point(module)
