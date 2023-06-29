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
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum StatusVisibility {
    Global = 0,
    Followers = 1,
    Friends = 2,
}
impl StatusVisibility {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            StatusVisibility::Global => "GLOBAL",
            StatusVisibility::Followers => "FOLLOWERS",
            StatusVisibility::Friends => "FRIENDS",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "GLOBAL" => Some(Self::Global),
            "FOLLOWERS" => Some(Self::Followers),
            "FRIENDS" => Some(Self::Friends),
            _ => None,
        }
    }
}
// @@protoc_insertion_point(module)
