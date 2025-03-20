// @generated
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct Connection {
    #[prost(string, tag="1")]
    pub provider: ::prost::alloc::string::String,
    #[prost(string, tag="2")]
    pub url: ::prost::alloc::string::String,
    #[prost(string, tag="3")]
    pub display_name: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct ConnectionSetting {
    #[prost(string, tag="1")]
    pub id: ::prost::alloc::string::String,
    #[prost(string, tag="2")]
    pub provider: ::prost::alloc::string::String,
    #[prost(bool, tag="3")]
    pub hidden: bool,
    #[prost(string, tag="4")]
    pub display_name: ::prost::alloc::string::String,
    #[prost(string, tag="5")]
    pub url: ::prost::alloc::string::String,
    #[prost(string, tag="6")]
    pub created_at: ::prost::alloc::string::String,
}
// @@protoc_insertion_point(module)
