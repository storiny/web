// @generated
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetConnectionSettingsRequest {
    #[prost(string, tag="1")]
    pub user_id: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetConnectionSettingsResponse {
    #[prost(message, repeated, tag="1")]
    pub connections: ::prost::alloc::vec::Vec<super::super::connection_def::v1::ConnectionSetting>,
}
// @@protoc_insertion_point(module)
